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

// ---------------------------------------------------------------------------
// The deadline
// ---------------------------------------------------------------------------
//
// The window is four CALENDAR days ending at 23:59:59 Pacific, not 96 clock
// hours from whenever the cron happened to run. A ragged afternoon expiry makes
// "until tomorrow" (email 6), "today" (email 7) and "ends at midnight"
// (email 8) all false, and email 8 is the worst case: it sends at 8pm against a
// window that closed that afternoon, so every click in it lands on the expired
// page.
//
// Pacific is deliberate. Everyone east of it gets their own midnight honoured
// and then some, because their midnight arrives before the cutoff.

export const OFFER_TZ = 'America/Los_Angeles'
export const OFFER_WINDOW_DAYS = 4

// What clock time is it in `timeZone` at this instant?
function zonedParts(ts, timeZone) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(new Date(ts))
  const get = (type) => Number(parts.find((p) => p.type === type).value)
  // Intl renders midnight as hour 24 in some ICU versions; normalise it.
  const hour = get('hour') % 24
  return { y: get('year'), m: get('month'), d: get('day'), hh: hour, mm: get('minute'), ss: get('second') }
}

// How far ahead of UTC is `timeZone` at this instant, in ms?
function zoneOffset(ts, timeZone) {
  const p = zonedParts(ts, timeZone)
  return Date.UTC(p.y, p.m - 1, p.d, p.hh, p.mm, p.ss) - ts
}

// A wall-clock time in `timeZone` -> the UTC instant it refers to.
//
// Two passes, because the offset depends on the answer: the first guess can
// land on the wrong side of a DST transition, and re-reading the offset at the
// corrected instant settles it. This is the standard fix and it is why the
// tests include both DST boundaries.
function zonedToUtc({ y, m, d, hh, mm, ss }, timeZone) {
  const naive = Date.UTC(y, m - 1, d, hh, mm, ss)
  const first = naive - zoneOffset(naive, timeZone)
  const second = naive - zoneOffset(first, timeZone)
  return new Date(second)
}

// End of day, `days` calendar days after the Pacific date `from` falls on.
//
// Calendar arithmetic, not 24-hour arithmetic: Date.UTC normalises an
// overflowing day for us, so month and year ends need no special case, and a
// spring-forward day is still one day.
export function endOfOfferWindow(from = new Date(), days = OFFER_WINDOW_DAYS, timeZone = OFFER_TZ) {
  const p = zonedParts(from.getTime(), timeZone)
  const target = new Date(Date.UTC(p.y, p.m - 1, p.d + days))
  return zonedToUtc(
    {
      y: target.getUTCFullYear(),
      m: target.getUTCMonth() + 1,
      d: target.getUTCDate(),
      hh: 23,
      mm: 59,
      ss: 59,
    },
    timeZone,
  )
}

// "Thursday, September 17 at 11:59pm Pacific"
//
// Kit formats nothing: whatever goes into the offer_deadline custom field is
// exactly what the reader sees in email 8. This is the only thing that should
// ever be written there -- never an ISO timestamp.
export function formatDeadline(expiresAt, timeZone = OFFER_TZ) {
  const day = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(expiresAt)
  return `${day} at 11:59pm Pacific`
}
