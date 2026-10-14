import { supabaseAdmin } from '../../_lib/supabase-admin.js'
import { requireAdmin } from '../../_lib/require-admin.js'
import { soft, unwrap } from '../../_lib/analytics/shared.js'
import { buildCourse } from '../../_lib/analytics/learners.js'

// GET /api/admin/analytics/learners
//
// Courses only. Per course: the module completion funnel, median days from
// access to first module and to a passed quiz, quiz statistics with the
// per-question miss rate, and the stalled learner list for a nudge email.
//
// All time by design: a completion funnel is about a cohort of buyers, not a
// month, and the course has had one cohort so far. The range select does not
// apply here and the tab says so.
//
// Emails come from admin_auth_users_brief (migration 063); without it the
// stalled list still builds but shows ids only, and `errors.users` says why.

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const admin = await requireAdmin(req, res)
  if (!admin) return

  const errors = {}
  const now = new Date()

  try {
    const courses = unwrap(
      await supabaseAdmin
        .from('webinars')
        .select('id, title, slug, status, quiz_pass_pct')
        .eq('kind', 'course')
        .order('created_at', { ascending: true }),
    )
    const courseIds = (courses ?? []).map((c) => c.id)
    if (courseIds.length === 0) {
      return res.status(200).json({ courses: [], errors })
    }

    const [modules, entitlements, attempts, questions, certificateRows, userRows] = await Promise.all([
      unwrap(
        await supabaseAdmin.from('course_modules').select('id, webinar_id, sort_order, title').in('webinar_id', courseIds),
      ),
      unwrap(
        await supabaseAdmin
          .from('user_entitlements')
          .select('user_id, webinar_id, source, granted_at')
          .in('webinar_id', courseIds),
      ),
      unwrap(
        await supabaseAdmin
          .from('quiz_attempts')
          .select('user_id, webinar_id, answers, score, total, passed, created_at')
          .in('webinar_id', courseIds)
          .order('created_at', { ascending: true }),
      ),
      unwrap(
        await supabaseAdmin
          .from('quiz_questions')
          .select('id, webinar_id, sort_order, prompt, correct_index')
          .in('webinar_id', courseIds),
      ),
      soft('certificates', errors, async () =>
        unwrap(
          await supabaseAdmin
            .from('activity_events')
            .select('user_id, webinar_id')
            .eq('event_type', 'certificate_download')
            .in('webinar_id', courseIds)
            .limit(10000),
        ),
      ),
      soft('users', errors, async () => unwrap(await supabaseAdmin.rpc('admin_auth_users_brief'))),
    ])

    const moduleIds = (modules ?? []).map((m) => m.id)
    const progress = moduleIds.length
      ? unwrap(
          await supabaseAdmin
            .from('course_progress')
            .select('user_id, module_id, completed_at')
            .in('module_id', moduleIds),
        )
      : []

    const users = new Map((userRows ?? []).map((u) => [u.id, { email: u.email, last_sign_in_at: u.last_sign_in_at }]))
    const moduleOwner = new Map((modules ?? []).map((m) => [m.id, m.webinar_id]))

    const out = (courses ?? []).map((course) =>
      buildCourse({
        course,
        modules: (modules ?? []).filter((m) => m.webinar_id === course.id),
        entitlements: (entitlements ?? []).filter((e) => e.webinar_id === course.id),
        progress: (progress ?? []).filter((p) => moduleOwner.get(p.module_id) === course.id),
        attempts: (attempts ?? []).filter((a) => a.webinar_id === course.id),
        questions: (questions ?? []).filter((q) => q.webinar_id === course.id),
        certificateUsers: certificateRows
          ? [...new Set(certificateRows.filter((r) => r.webinar_id === course.id).map((r) => r.user_id).filter(Boolean))]
          : null,
        users,
        now,
      }),
    )

    return res.status(200).json({ courses: out, errors })
  } catch (err) {
    console.error('analytics/learners error:', err)
    return res.status(500).json({ error: err.message ?? 'Internal error' })
  }
}
