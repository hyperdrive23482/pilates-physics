import { supabaseAdmin } from '../_lib/supabase-admin.js'
import { requireUser } from '../_lib/require-user.js'
import { requireEntitlement } from '../_lib/require-entitlement.js'
import { logActivity } from '../_lib/log-activity.js'

// The graded assessment behind the NPCP certificate.
//
// Everything about this route exists to keep two things true:
//
//   1. The answer key never reaches the browser. quiz_questions has an admin
//      RLS policy and nothing else, so a buyer cannot read the table at all;
//      this route holds the only path to the questions and strips the answers
//      on the way out. It also never says WHICH option was right for a missed
//      question, or the key could be reassembled by retaking.
//
//   2. A score is something the server wrote. quiz_attempts has no insert
//      policy, so rows come only from here, with the service role. That is
//      what makes an attempt worth citing if NPCP asks how a credit was
//      earned. Progress rows are not evidence: courses do not gate on
//      playback, so those can be clicked through. This cannot.
//
// There is deliberately no progress gate. See the plan's Phase 3: with free
// navigation it would stop nobody and would lock out anyone who moved through
// the course by the module list instead of the Next button.

const MAX_ANSWERS = 100

/**
 * Grade an attempt. Pure, and exported so it can be tested directly: this is
 * the function that decides whether someone earns a CEC.
 *
 * `submitted` maps question id to chosen index. A question with no answer is
 * simply wrong, never an error, so a partial submission still grades.
 *
 * The returned per-question results carry `correct` and the explanation but
 * NEVER `correct_index`. Returning the right answer for a missed question
 * would let anyone assemble the answer key by retaking.
 *
 * @returns {{ score, total, needed, passed, results }}
 */
export function gradeQuiz(questions, submitted, passPct) {
  let score = 0
  const results = questions.map((q) => {
    const chosen = submitted.has(q.id) ? submitted.get(q.id) : null
    const correct = chosen === q.correct_index
    if (correct) score += 1
    return {
      question_id: q.id,
      chosen_index: chosen,
      correct,
      explanation: q.explanation ?? null,
    }
  })

  const total = questions.length
  // Ceiling, so 80% of 10 needs 8 and 70% of 10 needs 7. Rounding down would
  // quietly let a failing score through on some counts.
  const needed = Math.ceil((passPct / 100) * total)
  return { score, total, needed, passed: score >= needed, results }
}

export default async function handler(req, res) {
  const auth = await requireUser(req, res)
  if (!auth) return
  const { user } = auth

  if (req.method === 'GET') return getQuiz(req, res, user)
  if (req.method === 'POST') return submitQuiz(req, res, user)

  res.setHeader('Allow', 'GET, POST')
  return res.status(405).json({ error: 'Method not allowed' })
}

// Shared preamble: resolve the course and confirm the caller may reach it.
// Returns null when a response has already been sent.
async function loadCourse(res, user, webinarId) {
  if (!webinarId) {
    res.status(400).json({ error: 'webinarId is required' })
    return null
  }

  const { data: workshop, error } = await supabaseAdmin
    .from('webinars')
    .select('id, slug, title, kind, quiz_pass_pct')
    .eq('id', webinarId)
    .maybeSingle()
  if (error) throw error
  if (!workshop) {
    res.status(404).json({ error: 'Course not found' })
    return null
  }
  if (workshop.kind !== 'course') {
    res.status(400).json({ error: 'That product does not have a quiz' })
    return null
  }

  const access = await requireEntitlement(res, user, workshop.id)
  if (!access) return null

  return { workshop, access }
}

async function getQuiz(req, res, user) {
  try {
    const loaded = await loadCourse(res, user, req.query.webinarId)
    if (!loaded) return
    const { workshop } = loaded

    const { data: questions, error: qErr } = await supabaseAdmin
      .from('quiz_questions')
      .select('id, sort_order, prompt, choices')
      .eq('webinar_id', workshop.id)
      .order('sort_order', { ascending: true })
    if (qErr) throw qErr

    // correct_index and explanation are not selected above, so there is no
    // path by which they can leak from here.
    const { data: attempts, error: aErr } = await supabaseAdmin
      .from('quiz_attempts')
      .select('score, total, passed, created_at')
      .eq('user_id', user.id)
      .eq('webinar_id', workshop.id)
      .order('created_at', { ascending: true })
    if (aErr) throw aErr

    const passedAttempt = (attempts ?? []).find((a) => a.passed) ?? null
    const best = (attempts ?? []).reduce(
      (acc, a) => (acc == null || a.score > acc.score ? a : acc),
      null,
    )

    return res.status(200).json({
      questions: questions ?? [],
      pass_pct: workshop.quiz_pass_pct ?? 80,
      attempt_count: attempts?.length ?? 0,
      best_attempt: best,
      // The date the certificate prints, so the UI can say it plainly.
      passed_at: passedAttempt?.created_at ?? null,
      passed: !!passedAttempt,
    })
  } catch (err) {
    console.error('quiz GET error:', err)
    return res.status(500).json({ error: err.message ?? 'Internal error' })
  }
}

async function submitQuiz(req, res, user) {
  try {
    const body = req.body ?? {}
    const loaded = await loadCourse(res, user, body.webinarId)
    if (!loaded) return
    const { workshop, access } = loaded

    if (!Array.isArray(body.answers) || body.answers.length > MAX_ANSWERS) {
      return res.status(400).json({ error: 'answers must be an array' })
    }

    // Answers arrive keyed by question id rather than by position, so a
    // reordered quiz cannot silently mis-grade an in-flight attempt.
    const submitted = new Map()
    for (const a of body.answers) {
      if (!a || typeof a !== 'object') continue
      if (typeof a.question_id !== 'string') continue
      if (!Number.isInteger(a.choice_index)) continue
      submitted.set(a.question_id, a.choice_index)
    }

    const { data: questions, error: qErr } = await supabaseAdmin
      .from('quiz_questions')
      .select('id, sort_order, prompt, choices, correct_index, explanation')
      .eq('webinar_id', workshop.id)
      .order('sort_order', { ascending: true })
    if (qErr) throw qErr

    if (!questions?.length) {
      return res.status(400).json({ error: 'This quiz has no questions yet' })
    }

    const passPct = workshop.quiz_pass_pct ?? 80
    const { score, total, needed, passed, results } = gradeQuiz(questions, submitted, passPct)

    // Did they already hold a pass? Read before inserting, so the first pass
    // can be told apart from a later one.
    const { data: priorPass, error: pErr } = await supabaseAdmin
      .from('quiz_attempts')
      .select('id')
      .eq('user_id', user.id)
      .eq('webinar_id', workshop.id)
      .eq('passed', true)
      .limit(1)
    if (pErr) throw pErr
    const alreadyPassed = (priorPass?.length ?? 0) > 0

    const { data: attempt, error: insErr } = await supabaseAdmin
      .from('quiz_attempts')
      .insert({
        user_id: user.id,
        webinar_id: workshop.id,
        answers: questions.map((q) => (submitted.has(q.id) ? submitted.get(q.id) : null)),
        score,
        total,
        passed,
      })
      .select('created_at')
      .single()
    if (insErr) throw insErr

    await logActivity(req, {
      userId: user.id,
      email: user.email,
      eventType: 'quiz_submit',
      source: 'server',
      webinarId: workshop.id,
      webinarSlug: workshop.slug,
      entitled: access.entitled,
      metadata: { score, total, passed },
    })

    if (passed && !alreadyPassed) {
      await logActivity(req, {
        userId: user.id,
        email: user.email,
        eventType: 'course_complete',
        source: 'server',
        webinarId: workshop.id,
        webinarSlug: workshop.slug,
        entitled: access.entitled,
        metadata: { score, total },
      })
    }

    return res.status(200).json({
      score,
      total,
      needed,
      pass_pct: passPct,
      passed,
      results,
      passed_at: passed ? attempt.created_at : null,
      first_pass: passed && !alreadyPassed,
    })
  } catch (err) {
    console.error('quiz POST error:', err)
    return res.status(500).json({ error: err.message ?? 'Internal error' })
  }
}
