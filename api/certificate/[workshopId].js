import { supabaseAdmin } from '../_lib/supabase-admin.js'
import { requireUser } from '../_lib/require-user.js'
import { logActivity } from '../_lib/log-activity.js'
import { buildCertificate } from '../_lib/build-certificate.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const auth = await requireUser(req, res)
  if (!auth) return
  const { user } = auth

  const { workshopId } = req.query
  if (!workshopId) {
    return res.status(400).json({ error: 'workshopId is required' })
  }

  try {
    // 1. Fetch workshop
    const { data: workshop, error: wErr } = await supabaseAdmin
      .from('webinars')
      .select(
        'id, slug, title, subtitle, description, kind, scheduled_at, duration_min, status, npcp_cecs, npcp_course_id, npcp_approval_date'
      )
      .eq('id', workshopId)
      .maybeSingle()
    if (wErr) throw wErr
    if (!workshop) return res.status(404).json({ error: 'Workshop not found' })

    const isAdmin = user.user_metadata?.is_admin === true
    const isCourse = workshop.kind === 'course'

    // 2. Eligibility. The two product types earn a certificate differently.
    //
    // A workshop is earned by attending, which the app can only approximate
    // with "the event has happened", so status is the gate.
    //
    // A course has no event. It is earned by passing the quiz, which is a
    // stronger claim: a scored, server-written attempt rather than an
    // inference. That is also the record NPCP would be shown.
    let completedAt = null
    if (isCourse) {
      const { data: pass, error: passErr } = await supabaseAdmin
        .from('quiz_attempts')
        .select('created_at')
        .eq('user_id', user.id)
        .eq('webinar_id', workshop.id)
        .eq('passed', true)
        .order('created_at', { ascending: true })
        .limit(1)
      if (passErr) throw passErr

      completedAt = pass?.[0]?.created_at ?? null

      // Admins bypass so the PDF can be proofed before anyone buys, which
      // otherwise means sitting your own quiz. They get today's date, since
      // there is no attempt to date it by.
      if (!completedAt) {
        if (!isAdmin) {
          return res.status(403).json({ error: 'Pass the course quiz to earn your certificate' })
        }
        completedAt = new Date().toISOString()
      }
    } else if (
      workshop.status !== 'awaiting_recording' &&
      workshop.status !== 'complete' &&
      workshop.status !== 'archived'
    ) {
      return res.status(403).json({ error: 'Workshop not yet complete' })
    }

    // 3. Entitlement check (admins bypass)
    if (!isAdmin) {
      const { data: ent, error: eErr } = await supabaseAdmin
        .from('user_entitlements')
        .select('id, expires_at')
        .eq('user_id', user.id)
        .eq('webinar_id', workshop.id)
        .maybeSingle()
      if (eErr) throw eErr
      if (!ent) return res.status(403).json({ error: 'No access to this workshop' })
      if (ent.expires_at && new Date(ent.expires_at) <= new Date()) {
        return res.status(403).json({ error: 'Access expired' })
      }
    }

    // Server-observed, entitlement-gated, and it produces a PDF with the
    // customer's own name on it. People whose cards were stolen do not
    // download CEC certificates. entitled stays null for admins, who bypassed
    // the check rather than failing it.
    await logActivity(req, {
      userId: user.id,
      email: user.email,
      eventType: 'certificate_download',
      source: 'server',
      webinarId: workshop.id,
      webinarSlug: workshop.slug,
      entitled: isAdmin ? null : true,
      metadata: {
        label: workshop.title,
        // For a course this is the evidence chain in one line: the credit was
        // issued because a quiz was passed on this date.
        ...(isCourse ? { completed_at: completedAt } : {}),
      },
    })

    // 4. Resolve participant name (fallback to email).
    const meta = user.user_metadata ?? {}
    const fullName = [meta.first_name, meta.last_name]
      .filter(Boolean)
      .join(' ')
      .trim()
    const participantName = fullName || user.email || 'Participant'

    // 5. Stream PDF
    const doc = buildCertificate({ workshop, participantName, completedAt })

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="certificate-${workshop.slug}.pdf"`
    )
    res.setHeader('Cache-Control', 'private, no-store')

    doc.pipe(res)
    doc.end()
  } catch (err) {
    console.error('certificate error:', err)
    return res.status(500).json({ error: err.message ?? 'Internal error' })
  }
}
