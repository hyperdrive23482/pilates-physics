import { supabaseAdmin } from '../_lib/supabase-admin.js'
import { requireAdmin } from '../_lib/require-admin.js'

// Who has worked through a course and who has passed its quiz.
//
// This is the NPCP audit view: for a CEC issued on a passed assessment, the
// defensible record is the attempt, not the click-through. Module progress is
// reported alongside it as context, but it is a bookmark rather than
// evidence, since a learner can advance without watching. See migration 044.
//
// Lives server-side only because auth.users is not joinable through
// PostgREST, the same reason workshop-enrollments exists.

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const admin = await requireAdmin(req, res)
  if (!admin) return

  const webinar_id = req.query.webinar_id
  if (!webinar_id) {
    return res.status(400).json({ error: 'Missing webinar_id' })
  }

  try {
    const [{ data: modules, error: modErr }, { data: entitlements, error: entErr }] =
      await Promise.all([
        supabaseAdmin.from('course_modules').select('id').eq('webinar_id', webinar_id),
        supabaseAdmin
          .from('user_entitlements')
          .select('user_id, granted_at')
          .eq('webinar_id', webinar_id),
      ])
    if (modErr) throw modErr
    if (entErr) throw entErr

    const moduleIds = (modules ?? []).map((m) => m.id)

    // Progress is keyed on module_id, so scope it to this course's modules
    // rather than pulling every row in the table.
    const { data: progress, error: progErr } = moduleIds.length
      ? await supabaseAdmin
          .from('course_progress')
          .select('user_id, module_id, completed_at')
          .in('module_id', moduleIds)
      : { data: [], error: null }
    if (progErr) throw progErr

    const { data: attempts, error: attErr } = await supabaseAdmin
      .from('quiz_attempts')
      .select('user_id, score, total, passed, created_at')
      .eq('webinar_id', webinar_id)
      .order('created_at', { ascending: true })
    if (attErr) throw attErr

    const { data: userPage, error: userErr } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    })
    if (userErr) throw userErr

    const byId = new Map()
    for (const u of userPage.users ?? []) {
      byId.set(u.id, {
        email: u.email,
        first_name: u.user_metadata?.first_name ?? '',
        last_name: u.user_metadata?.last_name ?? '',
      })
    }

    const rows = new Map()
    const row = (userId) => {
      if (!rows.has(userId)) {
        const u = byId.get(userId)
        rows.set(userId, {
          user_id: userId,
          email: u?.email ?? null,
          first_name: u?.first_name ?? '',
          last_name: u?.last_name ?? '',
          granted_at: null,
          modules_done: 0,
          attempts: 0,
          best_score: null,
          total: null,
          passed: false,
          first_passed_at: null,
          last_attempt_at: null,
        })
      }
      return rows.get(userId)
    }

    for (const e of entitlements ?? []) {
      row(e.user_id).granted_at = e.granted_at
    }
    for (const p of progress ?? []) {
      row(p.user_id).modules_done += 1
    }
    for (const a of attempts ?? []) {
      const r = row(a.user_id)
      r.attempts += 1
      r.total = a.total
      r.last_attempt_at = a.created_at
      if (r.best_score == null || a.score > r.best_score) r.best_score = a.score
      if (a.passed && !r.passed) {
        r.passed = true
        // attempts arrive oldest first, so the first pass seen is the earliest,
        // which is the date the certificate prints.
        r.first_passed_at = a.created_at
      }
    }

    const results = [...rows.values()].sort((a, b) => {
      if (a.passed !== b.passed) return a.passed ? -1 : 1
      return (b.modules_done ?? 0) - (a.modules_done ?? 0)
    })

    return res.status(200).json({
      module_count: moduleIds.length,
      results,
    })
  } catch (err) {
    console.error('course-results error:', err)
    return res.status(500).json({ error: err.message ?? 'Internal error' })
  }
}
