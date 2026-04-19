import { stripe } from '../_lib/stripe.js'
import { supabaseAdmin } from '../_lib/supabase-admin.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).end()
  }

  const sessionId = req.query.session_id
  if (!sessionId) return res.status(400).json({ error: 'session_id is required' })

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    const paid = session.payment_status === 'paid'

    const slug = session.metadata?.webinar_slug
    const webinarId = session.metadata?.webinar_id
    const email = session.customer_details?.email ?? session.metadata?.email

    // Did the webhook fire yet?
    const { data: eventRow } = await supabaseAdmin
      .from('stripe_events')
      .select('user_id, user_state, status')
      .eq('session_id', sessionId)
      .maybeSingle()

    let entitlementGranted = false
    if (eventRow?.user_id && webinarId) {
      const { data: ent } = await supabaseAdmin
        .from('user_entitlements')
        .select('id')
        .eq('user_id', eventRow.user_id)
        .eq('webinar_id', webinarId)
        .maybeSingle()
      entitlementGranted = !!ent
    }

    return res.status(200).json({
      paid,
      entitlement_granted: entitlementGranted,
      is_new_user: eventRow?.user_state === 'new',
      is_returning_user: eventRow?.user_state === 'returning',
      email,
      slug,
    })
  } catch (err) {
    console.error('verify-session error:', err)
    return res.status(500).json({ error: err.message ?? 'Internal error' })
  }
}
