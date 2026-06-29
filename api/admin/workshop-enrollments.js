import { supabaseAdmin } from '../_lib/supabase-admin.js'
import { requireAdmin } from '../_lib/require-admin.js'

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
    const { data: entitlements, error: entErr } = await supabaseAdmin
      .from('user_entitlements')
      .select('id, user_id, source, granted_at, expires_at')
      .eq('webinar_id', webinar_id)
      .order('granted_at', { ascending: false })
    if (entErr) throw entErr

    // auth.users is not joinable via PostgREST, so resolve names/emails in JS
    // from the auth admin list (same approach as list-users).
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    })
    if (error) throw error

    const byId = new Map()
    for (const u of data.users ?? []) {
      byId.set(u.id, {
        email: u.email,
        first_name: u.user_metadata?.first_name ?? '',
        last_name: u.user_metadata?.last_name ?? '',
      })
    }

    const enrollments = (entitlements ?? []).map((e) => {
      const u = byId.get(e.user_id)
      return {
        id: e.id,
        user_id: e.user_id,
        email: u?.email ?? null,
        first_name: u?.first_name ?? '',
        last_name: u?.last_name ?? '',
        source: e.source,
        granted_at: e.granted_at,
        expires_at: e.expires_at,
        missing_user: !u,
      }
    })

    return res.status(200).json({ enrollments })
  } catch (err) {
    console.error('workshop-enrollments error:', err)
    return res.status(500).json({ error: err.message ?? 'Internal error' })
  }
}
