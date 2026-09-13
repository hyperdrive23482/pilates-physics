// Is this offer row good for a $39 checkout right now?
//
// Pulled out of api/checkout/create-session.js for one reason: this predicate
// is the entire enforcement layer for the discount, and inline in a handler it
// could only be tested by standing up Stripe and Supabase. Here it is a pure
// function over a row, and scripts/test-offer-checkout.mjs exercises every
// branch in a second.
//
// There is no Stripe-side backstop behind this. The offer path passes a
// different Price rather than a coupon (Adaptive Pricing rules coupons out --
// see docs/how-a-reformer-works-build-plan.md), so nothing downstream will
// catch a mistake made here.
//
// `now` is injectable so the expiry boundary can be tested without waiting.
export function isOfferValid(row, workshopId, now = new Date()) {
  if (!row) return false

  // Bound to THIS product. The check that is easy to skip and expensive to
  // miss: without it, a valid reformer token passed against the PP-101 slug
  // sells PP-101 for $39, because the price branch keys off the token rather
  // than off the product.
  if (row.webinar_id !== workshopId) return false

  if (row.redeemed_at) return false

  // Strictly greater: a token is dead at its own expiry instant, not one
  // second after. The deadline is minted as 23:59:59 Pacific, so the copy's
  // "ends at midnight" stays true either way.
  return new Date(row.expires_at) > now
}
