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
    const { entitlement_id } = req.body ?? {}
    if (!entitlement_id) return res.status(400).json({ error: 'entitlement_id is required' })

    const { error } = await supabaseAdmin
      .from('user_entitlements')
      .delete()
      .eq('id', entitlement_id)
    if (error) throw error

    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('revoke-entitlement error:', err)
    return res.status(500).json({ error: err.message ?? 'Internal error' })
  }
}
