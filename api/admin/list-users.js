import { supabaseAdmin } from '../_lib/supabase-admin.js'
import { requireAdmin } from '../_lib/require-admin.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const admin = await requireAdmin(req, res)
  if (!admin) return

  try {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    })
    if (error) throw error

    // Pull all entitlements once and group by user to avoid N round-trips.
    const { data: entitlements, error: entErr } = await supabaseAdmin
      .from('user_entitlements')
      .select('id, user_id, webinar_id, source, granted_at, expires_at, webinar:webinars(title, slug)')
    if (entErr) throw entErr

    const byUser = new Map()
    for (const e of entitlements ?? []) {
      if (!byUser.has(e.user_id)) byUser.set(e.user_id, [])
      byUser.get(e.user_id).push(e)
    }

    const users = (data.users ?? []).map((u) => ({
      id: u.id,
      email: u.email,
      first_name: u.user_metadata?.first_name ?? '',
      last_name: u.user_metadata?.last_name ?? '',
      is_admin: u.user_metadata?.is_admin === true,
      created_at: u.created_at,
      entitlements: byUser.get(u.id) ?? [],
    }))

    return res.status(200).json({ users })
  } catch (err) {
    console.error('list-users error:', err)
    return res.status(500).json({ error: err.message ?? 'Internal error' })
  }
}
