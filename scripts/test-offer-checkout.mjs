// The expiry check is the only thing standing between an expired link and a
// $30 discount. There is no Stripe-side backstop: the offer path passes a
// different Price rather than a coupon, so if isOfferValid says yes, the buyer
// pays $39.
//
// Run: node scripts/test-offer-checkout.mjs

import { isOfferValid } from '../api/_lib/offer.js'

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

let failed = 0
for (const [name, r, workshopId, expected] of cases) {
  const actual = isOfferValid(r, workshopId, NOW)
  const ok = actual === expected
  if (!ok) failed += 1
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`)
  if (!ok) console.log(`      expected ${expected}, got ${actual}`)
}

console.log(`\n${cases.length - failed}/${cases.length} passed`)
process.exit(failed === 0 ? 0 : 1)
