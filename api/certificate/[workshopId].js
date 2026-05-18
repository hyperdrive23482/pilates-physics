import { supabaseAdmin } from '../_lib/supabase-admin.js'
import { requireUser } from '../_lib/require-user.js'
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

    // 2. Status check — only completed/archived workshops are eligible.
    if (workshop.status !== 'complete' && workshop.status !== 'archived') {
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
