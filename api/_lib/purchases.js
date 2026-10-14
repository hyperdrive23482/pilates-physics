import { stripe } from './stripe.js'
import { supabaseAdmin } from './supabase-admin.js'

/**
 * The purchases ledger (migration 062): one row per paid Checkout Session,
 * amended by refunds and disputes.
 *
 * Every function here is NON-FATAL. The ledger is analytics; the entitlement
 * in user_entitlements is the thing the buyer paid for, and a ledger write
 * failing must never make Stripe retry a purchase that fully succeeded. Errors
 * are logged and swallowed.
 */

const PRICINGS = new Set(['full', 'early_bird', 'offer', 'scholarship', 'bundle'])

/**
 * Reads the charge behind a session's PaymentIntent and returns the settled
 * figures. Returns null when the PaymentIntent has no charge yet (a $0 session
 * paid with a 100% code has none) or the lookup fails.
 */
async function settlementFor(paymentIntentId) {
  if (!paymentIntentId) return null
  const pi = await stripe.paymentIntents.retrieve(paymentIntentId, {
    expand: ['latest_charge.balance_transaction'],
  })
  const charge = pi.latest_charge && typeof pi.latest_charge === 'object' ? pi.latest_charge : null
  if (!charge) return null
  const bt = charge.balance_transaction && typeof charge.balance_transaction === 'object' ? charge.balance_transaction : null
  return {
    stripe_charge_id: charge.id,
    // balance_transaction.amount is in the settlement currency, which for this
    // account is USD. For a USD charge it equals amount_total.
    settled_usd_cents: bt ? bt.amount : null,
    stripe_fee_cents: bt ? bt.fee : null,
  }
}

/**
 * Write the ledger row for a completed Checkout Session. Idempotent on
 * stripe_session_id: a Stripe retry updates the same row.
 *
 * `scholarshipCode` comes from provisionPurchase, which already inspected the
 * session's discounts; when present the pricing tier is 'scholarship'.
 */
export async function recordPurchase(session, { userId, userState, sourceEventId, scholarshipCode } = {}) {
  try {
    const meta = session.metadata ?? {}
    const pricing = scholarshipCode
      ? 'scholarship'
      : PRICINGS.has(meta.pricing)
      ? meta.pricing
      : 'full'
    const currency = String(session.currency ?? 'usd').toLowerCase()
    const paymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id ?? null

    let settlement = null
    try {
      settlement = await settlementFor(paymentIntentId)
    } catch (err) {
      console.error('purchase settlement lookup failed (will retry via admin action):', err.message)
    }

    const row = {
      stripe_session_id: session.id,
      stripe_payment_intent_id: paymentIntentId,
      source_event_id: sourceEventId ?? null,
      user_id: userId ?? null,
      email: (session.customer_details?.email ?? meta.email ?? '').toLowerCase() || null,
      webinar_id: meta.webinar_id || null,
      webinar_slug: meta.webinar_slug || null,
      pricing,
      presentment_currency: currency,
      presentment_amount_cents: session.amount_total ?? 0,
      discount_cents: session.total_details?.amount_discount ?? 0,
      promotion_code_id: session.discounts?.[0]?.promotion_code ?? null,
      offer_id: meta.offer_id || null,
      user_state: userState ?? null,
      purchased_at: new Date((session.created ?? Math.floor(Date.now() / 1000)) * 1000).toISOString(),
      ...(settlement
        ? { ...settlement, needs_settlement_lookup: false }
        : {
            // A $0 session has no charge and nothing to settle.
            settled_usd_cents: (session.amount_total ?? 0) === 0 ? 0 : currency === 'usd' ? session.amount_total : null,
            stripe_fee_cents: (session.amount_total ?? 0) === 0 ? 0 : null,
            needs_settlement_lookup: (session.amount_total ?? 0) !== 0,
          }),
    }

    const { error } = await supabaseAdmin.from('purchases').upsert(row, { onConflict: 'stripe_session_id' })
    if (error) console.error('purchases upsert failed:', error.message)
  } catch (err) {
    console.error('recordPurchase error:', err)
  }
}

/**
 * Fill settled_usd_cents and stripe_fee_cents for rows still flagged. Used by
 * the admin "Settle" action, a batch at a time (one Stripe call per row).
 * Returns { settled, remaining, errors }.
 */
export async function settlePendingPurchases({ limit = 25 } = {}) {
  const { data: rows, error } = await supabaseAdmin
    .from('purchases')
    .select('id, stripe_session_id, stripe_payment_intent_id, presentment_currency, presentment_amount_cents')
    .eq('needs_settlement_lookup', true)
    .order('purchased_at', { ascending: true })
    .limit(limit)
  if (error) throw error

  let settled = 0
  const errors = []
  for (const row of rows ?? []) {
    try {
      let paymentIntentId = row.stripe_payment_intent_id
      if (!paymentIntentId) {
        const session = await stripe.checkout.sessions.retrieve(row.stripe_session_id)
        paymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id ?? null
      }
      const settlement = await settlementFor(paymentIntentId)
      const patch = settlement
        ? { ...settlement, stripe_payment_intent_id: paymentIntentId, needs_settlement_lookup: false }
        : row.presentment_amount_cents === 0
        ? { settled_usd_cents: 0, stripe_fee_cents: 0, needs_settlement_lookup: false }
        : null
      if (!patch) {
        errors.push({ id: row.id, error: 'No charge found on the PaymentIntent' })
        continue
      }
      const { error: upErr } = await supabaseAdmin.from('purchases').update(patch).eq('id', row.id)
      if (upErr) throw upErr
      settled += 1
    } catch (err) {
      errors.push({ id: row.id, error: err.message })
    }
  }

  const { count } = await supabaseAdmin
    .from('purchases')
    .select('id', { count: 'exact', head: true })
    .eq('needs_settlement_lookup', true)

  return { settled, remaining: count ?? 0, errors }
}

async function findPurchaseByCharge(charge) {
  const piId = typeof charge.payment_intent === 'string' ? charge.payment_intent : charge.payment_intent?.id ?? null
  let query = supabaseAdmin.from('purchases').select('id, stripe_charge_id, refund_usd_cents')
  if (piId) query = query.or(`stripe_charge_id.eq.${charge.id},stripe_payment_intent_id.eq.${piId}`)
  else query = query.eq('stripe_charge_id', charge.id)
  const { data, error } = await query.limit(1).maybeSingle()
  if (error) throw error
  return data
}

/**
 * charge.refunded: stamp the refund on the ledger row. Refund amounts are
 * summed from the refunds' balance transactions so a foreign-currency refund
 * lands in USD. Access is NOT revoked: see the migration header.
 */
export async function applyRefund(charge) {
  try {
    const row = await findPurchaseByCharge(charge)
    if (!row) {
      console.error('applyRefund: no purchase for charge', charge.id)
      return
    }
    let refundUsd = 0
    try {
      const refunds = await stripe.refunds.list({ charge: charge.id, limit: 100, expand: ['data.balance_transaction'] })
      for (const r of refunds.data) {
        const bt = r.balance_transaction && typeof r.balance_transaction === 'object' ? r.balance_transaction : null
        // A refund's balance transaction amount is negative in the settlement currency.
        refundUsd += bt ? Math.abs(bt.amount) : r.amount
      }
    } catch (err) {
      console.error('refund balance transactions unavailable, using presentment amount:', err.message)
      refundUsd = charge.amount_refunded ?? 0
    }
    const { error } = await supabaseAdmin
      .from('purchases')
      .update({
        stripe_charge_id: row.stripe_charge_id ?? charge.id,
        refunded_at: new Date().toISOString(),
        refund_usd_cents: refundUsd,
      })
      .eq('id', row.id)
    if (error) console.error('applyRefund update failed:', error.message)
  } catch (err) {
    console.error('applyRefund error:', err)
  }
}

/** charge.dispute.*: keep the latest dispute status on the ledger row. */
export async function applyDispute(dispute) {
  try {
    const chargeId = typeof dispute.charge === 'string' ? dispute.charge : dispute.charge?.id
    const piId = typeof dispute.payment_intent === 'string' ? dispute.payment_intent : dispute.payment_intent?.id ?? null
    const row = await findPurchaseByCharge({ id: chargeId, payment_intent: piId })
    if (!row) {
      console.error('applyDispute: no purchase for charge', chargeId)
      return
    }
    const { error } = await supabaseAdmin
      .from('purchases')
      .update({
        stripe_charge_id: row.stripe_charge_id ?? chargeId,
        disputed_at: new Date((dispute.created ?? Math.floor(Date.now() / 1000)) * 1000).toISOString(),
        dispute_status: dispute.status ?? null,
      })
      .eq('id', row.id)
    if (error) console.error('applyDispute update failed:', error.message)
  } catch (err) {
    console.error('applyDispute error:', err)
  }
}
