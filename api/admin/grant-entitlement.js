import { supabaseAdmin } from '../_lib/supabase-admin.js'
import { requireAdmin } from '../_lib/require-admin.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const admin = await requireAdmin(req, res)
  if (!admin) return

  try {
    const { email, user_id, webinar_id, expires_at } = req.body ?? {}
    if (!webinar_id) return res.status(400).json({ error: 'webinar_id is required' })
    if (!email && !user_id) return res.status(400).json({ error: 'email or user_id is required' })

    let targetUserId = user_id
    if (!targetUserId) {
      // Resolve user by email via admin API (auth.users not queryable via PostgREST).
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 })
      if (error) throw error
      const match = (data.users ?? []).find((u) => u.email?.toLowerCase() === email.toLowerCase())
      if (!match) return res.status(404).json({ error: `No user with email ${email}` })
      targetUserId = match.id
    }

    const { data: inserted, error } = await supabaseAdmin
      .from('user_entitlements')
      .upsert(
        {
          user_id: targetUserId,
          webinar_id,
          source: 'admin',
          expires_at: expires_at || null,
        },
        { onConflict: 'user_id,webinar_id' }
      )
      .select()
      .single()
    if (error) throw error

    return res.status(200).json({ entitlement: inserted })
  } catch (err) {
    console.error('grant-entitlement error:', err)
    return res.status(500).json({ error: err.message ?? 'Internal error' })
  }
}
