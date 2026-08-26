import { stripe } from '../_lib/stripe.js'
import { supabaseAdmin } from '../_lib/supabase-admin.js'
import { sendPurchaseNotification } from '../_lib/resend.js'
import { provisionPurchase } from '../_lib/provision-purchase.js'
import { logActivity } from '../_lib/log-activity.js'

// Vercel pure Node functions don't have the Next.js bodyParser flag, so we
// build the raw body from the stream ourselves for signature verification.
async function readRawBody(req) {
  const chunks = []
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  }
  return Buffer.concat(chunks)
}

// Audit log and idempotency record. Upsert on event_id so a retry of a
// previously-failed event updates its row instead of colliding with the
// unique constraint.
async function logEvent(row) {
  const { error } = await supabaseAdmin
    .from('stripe_events')
    .upsert(row, { onConflict: 'event_id' })
  if (error) console.error('stripe_events upsert error:', error)
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).end()
  }

  const sig = req.headers['stripe-signature']
  let event
  try {
    const rawBody = await readRawBody(req)
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('Stripe signature verification failed:', err.message)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  // Idempotency: short-circuit only if this event already completed
  // successfully. A 'failed' row must NOT short-circuit, or Stripe's retries
  // collapse into no-ops and a one-time failure becomes permanent.
  const { data: existingEvent } = await supabaseAdmin
    .from('stripe_events')
    .select('status')
    .eq('event_id', event.id)
    .maybeSingle()
  if (existingEvent?.status === 'processed') {
    return res.status(200).json({ received: true, duplicate: true })
  }

  if (event.type !== 'checkout.session.completed') {
    return res.status(200).json({ received: true, ignored: event.type })
  }

  const session = event.data.object
  const origin = `${req.headers['x-forwarded-proto'] ?? 'https'}://${req.headers.host}`

  try {
    const result = await provisionPurchase(session, {
      siteUrl: origin,
      purchasedAt: new Date(event.created * 1000),
    })

    // ---- Owner notification (non-fatal, observability only) ----
    try {
      await sendPurchaseNotification({
        email: result.email,
        firstName: result.firstName,
        lastName: result.lastName,
        workshopTitle: result.workshopTitle,
        amountCents: session.amount_total,
        userState: result.userState,
        sessionId: session.id,
      })
    } catch (err) {
      console.error('Purchase notification send failed:', err)
    }

    // Anchor the timeline: the purchase itself, and the access it granted.
    // No duplicate guard is needed. The idempotency check above already
    // returned for anything marked 'processed', and the only way to reach here
    // with an existing row is a prior 'failed' one -- which means
    // provisionPurchase threw, since nothing after it can throw (the
    // notification and logEvent both swallow their own errors). So a retry
    // that gets this far never logged these events the first time.
    // ip_address and user_agent are explicitly null because this request comes
    // from Stripe, not the customer -- recording Stripe's IP here would put an
    // address in the evidence log that has nothing to do with the buyer. The
    // customer's own purchase IP is captured by checkout_start in
    // api/checkout/create-session.js.
    for (const eventType of ['purchase', 'entitlement_granted']) {
      await logActivity(req, {
        userId: result.userId,
        email: result.email,
        eventType,
        source: 'server',
        webinarId: result.workshopId,
        ipAddress: null,
        userAgent: null,
        metadata: { label: session.id, content_title: result.workshopTitle },
      })
    }

    await logEvent({
      event_id: event.id,
      session_id: session.id,
      event_type: event.type,
      webinar_id: result.workshopId,
      user_id: result.userId,
      user_state: result.userState,
      status: result.kitError ? 'kit_failed' : 'processed',
      error: result.kitError,
      email_status: result.emailStatus,
      email_error: result.emailError,
      payload: session,
    })

    return res.status(200).json({ received: true })
  } catch (err) {
    console.error('webhook handler error:', err)
    await logEvent({
      event_id: event.id,
      session_id: session.id,
      event_type: event.type,
      webinar_id: session.metadata?.webinar_id ?? null,
      status: 'failed',
      error: err.message,
      payload: session,
    })
    // Return 500 so Stripe retries. The idempotency check above only
    // short-circuits on 'processed', so the retry genuinely re-runs.
    return res.status(500).json({ error: err.message })
  }
}
