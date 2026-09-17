// Workshop early bird pricing.
//
// Pure, like offer.js, and for the same reason: isEarlyBirdActive is the only
// thing deciding which Stripe Price a workshop checkout uses. The early bird
// path passes a different Price rather than a coupon, so nothing downstream
// catches a mistake made here. scripts/test-early-bird.mjs exercises it.
//
// The pages import this file too (src/lib/workshopPricing.js), so the price a
// visitor sees and the price the server charges come from one predicate. It
// must stay free of server-only imports.

import { OFFER_TZ, zonedParts, zonedToUtc } from './offer.js'

// Pacific, like the offer deadline. Everyone east of it gets their own
// 11:59pm honoured and then some.
export const EARLY_BIRD_TZ = OFFER_TZ

// Is early bird pricing live for this workshop right now?
//
// Workshops only. A course sells through PricingBlock, which knows nothing
// about early bird, so a course row with these columns set would show $69 and
// charge less. Keying off kind makes that state impossible rather than merely
// unlikely.
//
// `now` is injectable so the boundary can be tested without waiting.
export function isEarlyBirdActive(workshop, now = new Date()) {
  if (!workshop || workshop.kind !== 'webinar') return false
  if (workshop.early_bird_price_cents == null) return false
  if (!workshop.early_bird_stripe_price_id) return false
  if (!workshop.early_bird_ends_at) return false

  // Strictly greater: closed at its own instant, which is 23:59:59 Pacific, so
  // "ends 11:59pm PT" is true either way.
  return new Date(workshop.early_bird_ends_at) > now
}

// The admin picks a last DAY. This is the instant that day ends in Pacific.
//
// 'YYYY-MM-DD' -> Date. DST is handled by zonedToUtc, so a last day in early
// November still closes at 11:59pm local, not 10:59pm or 12:59am.
export function earlyBirdEndsAt(lastDay, timeZone = EARLY_BIRD_TZ) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(lastDay ?? ''))
  if (!match) return null
  const [, y, m, d] = match.map(Number)
  return zonedToUtc({ y, m, d, hh: 23, mm: 59, ss: 59 }, timeZone)
}

// The reverse, for prefilling the admin date input: which Pacific calendar day
// does this instant fall on? Reading it in the admin's own zone would show the
// next day to anyone east of Pacific, since 11:59pm Pacific is already
// tomorrow almost everywhere else.
export function earlyBirdLastDay(endsAt, timeZone = EARLY_BIRD_TZ) {
  if (!endsAt) return ''
  const ts = new Date(endsAt).getTime()
  if (Number.isNaN(ts)) return ''
  const p = zonedParts(ts, timeZone)
  const pad = (n) => String(n).padStart(2, '0')
  return `${p.y}-${pad(p.m)}-${pad(p.d)}`
}

// "Sep 30, 11:59pm PT"
//
// Always written in Pacific, never the viewer's zone: in London the deadline
// instant is already October 1, and a page saying "ends Oct 1" in one country
// and "ends Sep 30" in another reads as a mistake.
export function formatEarlyBirdEnd(endsAt, timeZone = EARLY_BIRD_TZ) {
  if (!endsAt) return ''
  const day = new Intl.DateTimeFormat('en-US', {
    timeZone,
    month: 'short',
    day: 'numeric',
  }).format(new Date(endsAt))
  return `${day}, 11:59pm PT`
}
