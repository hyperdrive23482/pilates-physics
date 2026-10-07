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

    // What each enrollee paid, from the stored Checkout Session payloads. Only
    // the amount fields are selected so the full payloads never leave the DB.
    // A user with more than one completed checkout for this workshop is summed.
    const { data: events, error: evErr } = await supabaseAdmin
      .from('stripe_events')
      .select(
        'user_id, amount_total:payload->amount_total, amount_discount:payload->total_details->amount_discount, currency:payload->>currency'
      )
      .eq('webinar_id', webinar_id)
      .eq('event_type', 'checkout.session.completed')
    if (evErr) throw evErr

    const paidByUser = new Map()
    for (const ev of events ?? []) {
      if (!ev.user_id || ev.amount_total == null) continue
      const prev = paidByUser.get(ev.user_id) ?? { amount: 0, discount: 0, currency: ev.currency }
      prev.amount += Number(ev.amount_total) || 0
      prev.discount += Number(ev.amount_discount) || 0
      paidByUser.set(ev.user_id, prev)
    }

    const enrollments = (entitlements ?? []).map((e) => {
      const u = byId.get(e.user_id)
      const paid = paidByUser.get(e.user_id)
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
        // Amounts in the smallest currency unit (cents); null when there is
        // no Stripe checkout on record (manual grant, bonus, scholarship comp).
        paid_amount: paid ? paid.amount : null,
        paid_discount: paid ? paid.discount : null,
        paid_currency: paid?.currency ?? null,
      }
    })

    return res.status(200).json({ enrollments })
  } catch (err) {
    console.error('workshop-enrollments error:', err)
    return res.status(500).json({ error: err.message ?? 'Internal error' })
  }
}
