import { supabaseAdmin } from '../_lib/supabase-admin.js'
import { requireAdmin } from '../_lib/require-admin.js'

// Grants `target_webinar_id` to every user that already has an entitlement
// to `source_webinar_id`. Idempotent: re-running has no effect on users that
// already have the target entitlement.
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const admin = await requireAdmin(req, res)
  if (!admin) return

  try {
    const { source_webinar_id, target_webinar_id, expires_at, dry_run } = req.body ?? {}
    if (!source_webinar_id) return res.status(400).json({ error: 'source_webinar_id is required' })
    if (!target_webinar_id) return res.status(400).json({ error: 'target_webinar_id is required' })
    if (source_webinar_id === target_webinar_id) {
      return res.status(400).json({ error: 'source and target must differ' })
    }

    const { data: sourceEnts, error: sErr } = await supabaseAdmin
      .from('user_entitlements')
      .select('user_id')
      .eq('webinar_id', source_webinar_id)
    if (sErr) throw sErr

    const userIds = [...new Set((sourceEnts ?? []).map((r) => r.user_id))]
    if (userIds.length === 0) {
      return res.status(200).json({ source_users: 0, newly_granted: 0, already_granted: 0 })
    }

    const { data: existing, error: eErr } = await supabaseAdmin
      .from('user_entitlements')
      .select('user_id')
      .eq('webinar_id', target_webinar_id)
      .in('user_id', userIds)
    if (eErr) throw eErr
    const existingSet = new Set((existing ?? []).map((r) => r.user_id))
    const toGrant = userIds.filter((id) => !existingSet.has(id))

    if (dry_run) {
      return res.status(200).json({
        source_users: userIds.length,
        newly_granted: toGrant.length,
        already_granted: existingSet.size,
      })
    }

    if (toGrant.length > 0) {
      const rows = toGrant.map((uid) => ({
        user_id: uid,
        webinar_id: target_webinar_id,
        source: 'admin',
        expires_at: expires_at || null,
      }))
      const { error: upErr } = await supabaseAdmin
        .from('user_entitlements')
        .upsert(rows, { onConflict: 'user_id,webinar_id', ignoreDuplicates: true })
      if (upErr) throw upErr
    }

    return res.status(200).json({
      source_users: userIds.length,
      newly_granted: toGrant.length,
      already_granted: existingSet.size,
    })
  } catch (err) {
    console.error('bulk-grant-entitlement error:', err)
    return res.status(500).json({ error: err.message ?? 'Internal error' })
  }
}
