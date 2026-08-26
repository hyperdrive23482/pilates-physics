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
        'id, slug, title, subtitle, description, scheduled_at, duration_min, status, npcp_cecs, npcp_course_id, npcp_approval_date'
      )
      .eq('id', workshopId)
      .maybeSingle()
    if (wErr) throw wErr
    if (!workshop) return res.status(404).json({ error: 'Workshop not found' })

    // 2. Status check — workshops are eligible once they've ended (awaiting_recording, complete, archived).
    if (
      workshop.status !== 'awaiting_recording' &&
      workshop.status !== 'complete' &&
      workshop.status !== 'archived'
    ) {
      return res.status(403).json({ error: 'Workshop not yet complete' })
    }

    // 3. Entitlement check (admins bypass)
    const isAdmin = user.user_metadata?.is_admin === true
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
      metadata: { label: workshop.title },
    })

    // 4. Resolve participant name (fallback to email).
    const meta = user.user_metadata ?? {}
    const fullName = [meta.first_name, meta.last_name]
      .filter(Boolean)
      .join(' ')
      .trim()
    const participantName = fullName || user.email || 'Participant'

    // 5. Stream PDF
    const doc = buildCertificate({ workshop, participantName })

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
