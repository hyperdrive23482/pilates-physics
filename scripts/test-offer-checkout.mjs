// The expiry check is the only thing standing between an expired link and a
// $30 discount. There is no Stripe-side backstop: the offer path passes a
// different Price rather than a coupon, so if isOfferValid says yes, the buyer
// pays $39.
//
// Run: node scripts/test-offer-checkout.mjs

import { isOfferValid, endOfOfferWindow, formatDeadline } from '../api/_lib/offer.js'

const REFORMER = '11111111-1111-1111-1111-111111111111'
const PP101 = '22222222-2222-2222-2222-222222222222'

const NOW = new Date('2026-09-17T12:00:00Z')
const OPEN = '2026-09-18T06:59:59Z' // 23:59:59 Pacific on the 17th
const PAST = '2026-09-16T06:59:59Z'

const row = (patch = {}) => ({
  webinar_id: REFORMER,
  expires_at: OPEN,
  redeemed_at: null,
  ...patch,
})

const cases = [
  ['an open window sells at $39', row(), REFORMER, true],
  ['no row at all is not an offer', null, REFORMER, false],
  ['undefined row is not an offer', undefined, REFORMER, false],
  ['an expired window does not', row({ expires_at: PAST }), REFORMER, false],
  ['a spent token does not', row({ redeemed_at: '2026-09-16T10:00:00Z' }), REFORMER, false],
  [
    'a spent token inside an open window still does not',
    row({ redeemed_at: '2026-09-17T09:00:00Z' }),
    REFORMER,
    false,
  ],
  // The cross-product case. Without the webinar_id check this passes, and a
  // reformer token buys PP-101 for $39.
  ['a reformer token cannot buy PP-101', row(), PP101, false],
  [
    'an expired reformer token cannot buy PP-101 either',
    row({ expires_at: PAST }),
    PP101,
    false,
  ],
  // The boundary. Dead at its own instant, not one second after.
  ['the expiry instant itself is closed', row({ expires_at: NOW.toISOString() }), REFORMER, false],
  [
    'one second before the expiry instant is open',
    row({ expires_at: new Date(NOW.getTime() + 1000).toISOString() }),
    REFORMER,
    true,
  ],
  [
    'one second after is closed',
    row({ expires_at: new Date(NOW.getTime() - 1000).toISOString() }),
    REFORMER,
    false,
  ],
  // Forwarded links are allowed to work: a mismatched email is recorded by the
  // webhook in redeemed_email, never rejected here. If someone adds an email
  // check to isOfferValid, this case fails and says why.
  [
    'a forwarded link is still valid (email is not a condition)',
    row({ email: 'someone-else@studio.com' }),
    REFORMER,
    true,
  ],
]

// The deadline. Four CALENDAR days to 23:59:59 Pacific -- which is a different
// number of hours depending on the month, and that is the point.
//
// `tag` is when Kit applied the tag; `iso` is the instant the window must end.
const windows = [
  ['a plain autumn afternoon', '2026-09-13T20:00:00Z', '2026-09-18T06:59:59.000Z'],

  // The Pacific calendar day is what counts, not the UTC one. These two
  // instants are 60 minutes apart, land on different Pacific dates, and so
  // their windows must differ by a full day.
  ['11:30pm Pacific keeps that day', '2026-09-14T06:30:00Z', '2026-09-18T06:59:59.000Z'],
  ['00:30am Pacific is the next day', '2026-09-14T07:30:00Z', '2026-09-19T06:59:59.000Z'],

  // DST. Clocks go back on 2026-11-01, so a window opened in PDT (UTC-7) has
  // to close in PST (UTC-8). Get this wrong and the deadline is an hour off in
  // the one email that says "ends at midnight".
  ['PDT open, PST close', '2026-10-29T20:00:00Z', '2026-11-03T07:59:59.000Z'],
  ['window ends on the fall-back day itself', '2026-10-28T20:00:00Z', '2026-11-02T07:59:59.000Z'],

  // Clocks go forward on 2026-03-08. A spring-forward day is 23 hours long and
  // still counts as one day.
  ['PST open, PDT close', '2026-03-05T20:00:00Z', '2026-03-10T06:59:59.000Z'],

  // Calendar rollovers.
  ['across a month end', '2026-09-29T20:00:00Z', '2026-10-04T06:59:59.000Z'],
  ['across a year end', '2026-12-30T20:00:00Z', '2027-01-04T07:59:59.000Z'],
]

const labels = [
  ['names the weekday and the zone', '2026-09-13T20:00:00Z', 'Thursday, September 17 at 11:59pm Pacific'],
  ['reads in Pacific, not UTC', '2026-10-29T20:00:00Z', 'Monday, November 2 at 11:59pm Pacific'],
]

let failed = 0
const check = (ok, name, expected, actual) => {
  if (!ok) failed += 1
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`)
  if (!ok) console.log(`      expected ${expected}` + '\n' + `      got      ${actual}`)
}

console.log('-- the validity predicate --')
for (const [name, r, workshopId, expected] of cases) {
  check(isOfferValid(r, workshopId, NOW) === expected, name, expected, isOfferValid(r, workshopId, NOW))
}

console.log('')
console.log('-- the four-day window --')
for (const [name, tag, expected] of windows) {
  const actual = endOfOfferWindow(new Date(tag)).toISOString()
  check(actual === expected, name, expected, actual)
}

console.log('')
console.log('-- the printed deadline --')
for (const [name, tag, expected] of labels) {
  const actual = formatDeadline(endOfOfferWindow(new Date(tag)))
  check(actual === expected, name, expected, actual)
}

const total = cases.length + windows.length + labels.length
console.log('')
console.log(`${total - failed}/${total} passed`)
process.exit(failed === 0 ? 0 : 1)
