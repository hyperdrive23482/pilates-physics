import { daysBetween, fraction, medianDays } from './shared.js'

/**
 * Learners tab aggregation for one course: the module completion funnel,
 * time-to-first-module and time-to-completion, quiz statistics with a
 * per-question miss rate, and the stalled learner list.
 *
 * Progress rows are bookmarks, not proof (migration 044). The quiz is the
 * record that carries the CEC, which is why the funnel ends in a passed
 * attempt and a certificate download rather than "all modules done".
 *
 * Pure. Tested in learners.test.js.
 */

export const STALLED_AFTER_DAYS = 14
export const STALLED_UNDER_SHARE = 0.5

const ms = (iso) => (iso ? Date.parse(iso) : NaN)
const earliest = (a, b) => (Number.isNaN(ms(a)) ? b : Number.isNaN(ms(b)) ? a : ms(a) <= ms(b) ? a : b)
const latest = (a, b) => (Number.isNaN(ms(a)) ? b : Number.isNaN(ms(b)) ? a : ms(a) >= ms(b) ? a : b)

/**
 * Per-question miss rate. An attempt's `answers` array is in the question
 * order at submission time (api/course/quiz.js), so attempts whose length no
 * longer matches the question list (a question added or removed since) are
 * skipped and counted in `unmatched_attempts` rather than mis-scored.
 */
export function questionMissRates(questions, attempts) {
  const ordered = [...(questions ?? [])].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
  const misses = ordered.map(() => 0)
  let graded = 0
  let unmatched = 0
  for (const a of attempts ?? []) {
    const answers = Array.isArray(a.answers) ? a.answers : null
    if (!answers || answers.length !== ordered.length) {
      unmatched += 1
      continue
    }
    graded += 1
    ordered.forEach((q, i) => {
      if (answers[i] !== q.correct_index) misses[i] += 1
    })
  }
  return {
    graded_attempts: graded,
    unmatched_attempts: unmatched,
    questions: ordered.map((q, i) => ({
      id: q.id,
      position: i + 1,
      prompt: q.prompt,
      misses: misses[i],
      attempts: graded,
      miss_rate: graded > 0 ? misses[i] / graded : null,
    })),
  }
}

/**
 * @param course          webinars row: id, title, slug, quiz_pass_pct
 * @param modules         course_modules: id, sort_order, title
 * @param entitlements    user_entitlements for this course: user_id, granted_at, source
 * @param progress        course_progress for these modules: user_id, module_id, completed_at
 * @param attempts        quiz_attempts for this course: user_id, answers, score, total, passed, created_at
 * @param questions       quiz_questions for this course: id, sort_order, prompt, correct_index
 * @param certificateUsers user ids with a certificate_download event, or null if unknown
 * @param users           Map of user id -> { email, last_sign_in_at }
 * @param now             Date
 */
export function buildCourse({ course, modules, entitlements, progress, attempts, questions, certificateUsers, users, now = new Date() }) {
  const orderedModules = [...(modules ?? [])].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
  const moduleIds = new Set(orderedModules.map((m) => m.id))

  // One record per learner, keyed by user id. Enrolled learners come from
  // entitlements; anyone with progress or an attempt but no entitlement (a
  // revoked grant) still appears, flagged, so the numbers reconcile.
  const learners = new Map()
  const learner = (userId) => {
    if (!learners.has(userId)) {
      learners.set(userId, {
        user_id: userId,
        granted_at: null,
        source: null,
        modules_done: new Set(),
        first_module_at: null,
        last_active_at: null,
        attempts: [],
        first_passed_at: null,
        certificate: false,
      })
    }
    return learners.get(userId)
  }
  for (const e of entitlements ?? []) {
    const l = learner(e.user_id)
    l.granted_at = earliest(l.granted_at, e.granted_at)
    l.source = l.source ?? e.source ?? null
  }
  for (const p of progress ?? []) {
    if (!moduleIds.has(p.module_id)) continue
    const l = learner(p.user_id)
    l.modules_done.add(p.module_id)
    l.first_module_at = earliest(l.first_module_at, p.completed_at)
    l.last_active_at = latest(l.last_active_at, p.completed_at)
  }
  const sortedAttempts = [...(attempts ?? [])].sort((a, b) => ms(a.created_at) - ms(b.created_at))
  for (const a of sortedAttempts) {
    const l = learner(a.user_id)
    l.attempts.push(a)
    l.last_active_at = latest(l.last_active_at, a.created_at)
    if (a.passed && !l.first_passed_at) l.first_passed_at = a.created_at
  }
  for (const id of certificateUsers ?? []) if (learners.has(id)) learner(id).certificate = true

  const all = [...learners.values()]
  const enrolled = all.filter((l) => l.granted_at)
  const started = all.filter((l) => l.modules_done.size > 0 || l.attempts.length > 0)
  const attempted = all.filter((l) => l.attempts.length > 0)
  const passed = all.filter((l) => l.first_passed_at)
  const certified = all.filter((l) => l.certificate)
  const denominator = enrolled.length

  const funnel = [
    { key: 'enrolled', label: 'Enrolled', count: enrolled.length, of: denominator },
    { key: 'started', label: 'Started', count: started.length, of: denominator },
    ...orderedModules.map((m, i) => ({
      key: `module:${m.id}`,
      label: `Module ${i + 1}: ${m.title}`,
      count: all.filter((l) => l.modules_done.has(m.id)).length,
      of: denominator,
    })),
    { key: 'quiz_attempted', label: 'Attempted the quiz', count: attempted.length, of: denominator },
    { key: 'quiz_passed', label: 'Passed the quiz', count: passed.length, of: denominator },
    {
      key: 'certificate',
      label: 'Downloaded the certificate',
      count: certificateUsers ? certified.length : null,
      of: denominator,
    },
  ]

  const toFirstModule = enrolled
    .filter((l) => l.first_module_at)
    .map((l) => daysBetween(l.granted_at, l.first_module_at))
    .filter((d) => d !== null && d >= 0)
  const toCompletion = enrolled
    .filter((l) => l.first_passed_at)
    .map((l) => daysBetween(l.granted_at, l.first_passed_at))
    .filter((d) => d !== null && d >= 0)

  const firstAttemptPasses = attempted.filter((l) => l.attempts[0]?.passed).length
  const attemptsByPassers = passed.reduce((acc, l) => acc + l.attempts.length, 0)
  const missRates = questionMissRates(questions, sortedAttempts)

  const stalledBefore = now.getTime() - STALLED_AFTER_DAYS * 86400000
  const stalled = enrolled
    .filter((l) => !l.first_passed_at && ms(l.granted_at) <= stalledBefore)
    .filter((l) => orderedModules.length === 0 || l.modules_done.size / orderedModules.length < STALLED_UNDER_SHARE)
    .map((l) => ({
      user_id: l.user_id,
      email: users?.get(l.user_id)?.email ?? null,
      granted_at: l.granted_at,
      source: l.source,
      days_since_purchase: Math.floor((now.getTime() - ms(l.granted_at)) / 86400000),
      modules_done: l.modules_done.size,
      module_count: orderedModules.length,
      attempts: l.attempts.length,
      last_active_at: l.last_active_at,
      last_sign_in_at: users?.get(l.user_id)?.last_sign_in_at ?? null,
    }))
    .sort((a, b) => ms(a.granted_at) - ms(b.granted_at))

  return {
    id: course.id,
    title: course.title,
    slug: course.slug,
    pass_pct: course.quiz_pass_pct ?? 80,
    module_count: orderedModules.length,
    question_count: (questions ?? []).length,
    enrolled: enrolled.length,
    unenrolled_active: all.length - enrolled.length,
    funnel,
    timing: {
      to_first_module_days: medianDays(toFirstModule),
      to_first_module_n: toFirstModule.length,
      to_completion_days: medianDays(toCompletion),
      to_completion_n: toCompletion.length,
    },
    quiz: {
      attempts: sortedAttempts.length,
      attempted: attempted.length,
      passed: passed.length,
      pass_rate: fraction(passed.length, attempted.length),
      first_attempt_pass_rate: fraction(firstAttemptPasses, attempted.length),
      attempts_per_passer: passed.length ? Math.round((attemptsByPassers / passed.length) * 10) / 10 : null,
      ...missRates,
    },
    stalled,
  }
}
