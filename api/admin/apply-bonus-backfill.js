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
    const { webinar_id } = req.body ?? {}
    if (!webinar_id) return res.status(400).json({ error: 'webinar_id is required' })

    const { data: w, error: wErr } = await supabaseAdmin
      .from('webinars')
      .select('id, bonus_webinar_id, bonus_starts_at, bonus_ends_at')
      .eq('id', webinar_id)
      .single()
    if (wErr) throw wErr
    if (!w?.bonus_webinar_id || !w.bonus_starts_at || !w.bonus_ends_at) {
      return res.status(400).json({ error: 'Bonus not fully configured for this webinar' })
    }

    const { data: events, error: evtErr } = await supabaseAdmin
      .from('stripe_events')
      .select('user_id')
      .eq('webinar_id', webinar_id)
      .eq('event_type', 'checkout.session.completed')
      .eq('status', 'processed')
      .not('user_id', 'is', null)
      .gte('created_at', w.bonus_starts_at)
      .lte('created_at', w.bonus_ends_at)
    if (evtErr) throw evtErr

    const uniqueUserIds = [...new Set((events ?? []).map((e) => e.user_id))]
    if (uniqueUserIds.length === 0) {
      return res.status(200).json({ scanned: 0, newly_granted: 0, already_granted: 0 })
    }

    const { data: existing, error: existErr } = await supabaseAdmin
      .from('user_entitlements')
      .select('user_id')
      .eq('webinar_id', w.bonus_webinar_id)
      .in('user_id', uniqueUserIds)
    if (existErr) throw existErr
    const existingSet = new Set((existing ?? []).map((r) => r.user_id))

    const rows = uniqueUserIds.map((uid) => ({
      user_id: uid,
      webinar_id: w.bonus_webinar_id,
      source: 'bonus',
    }))
    const { error: upErr } = await supabaseAdmin
      .from('user_entitlements')
      .upsert(rows, { onConflict: 'user_id,webinar_id', ignoreDuplicates: true })
    if (upErr) throw upErr

    return res.status(200).json({
      scanned: uniqueUserIds.length,
      newly_granted: uniqueUserIds.length - existingSet.size,
      already_granted: existingSet.size,
    })
  } catch (err) {
    console.error('apply-bonus-backfill error:', err)
    return res.status(500).json({ error: err.message ?? 'Internal error' })
  }
}
