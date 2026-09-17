// isEarlyBirdActive picks which Stripe Price a workshop checkout charges. There
// is no Stripe-side backstop: the early bird path passes a different Price
// rather than a coupon, so if this says yes, the buyer pays the early bird
// price.
//
// Run: node scripts/test-early-bird.mjs

import {
  isEarlyBirdActive,
  earlyBirdEndsAt,
  earlyBirdLastDay,
  formatEarlyBirdEnd,
} from '../api/_lib/early-bird.js'

const NOW = new Date('2026-09-17T12:00:00Z')
const OPEN = '2026-09-30T06:59:59Z' // 23:59:59 Pacific on Sep 29

const workshop = (patch = {}) => ({
  kind: 'webinar',
  price_cents: 12900,
  stripe_price_id: 'price_full',
  early_bird_price_cents: 9900,
  early_bird_stripe_price_id: 'price_early',
  early_bird_ends_at: OPEN,
  ...patch,
})

const cases = [
  ['a workshop inside its window is early bird', workshop(), true],
  ['no workshop at all is not', null, false],
  ['a past last day is not', workshop({ early_bird_ends_at: '2026-09-16T06:59:59Z' }), false],
  // A clone carries the prices but not the date. It must stay dormant.
  ['prices with no end date are dormant', workshop({ early_bird_ends_at: null }), false],
  ['no early bird price ID is not', workshop({ early_bird_stripe_price_id: null }), false],
  ['an empty early bird price ID is not', workshop({ early_bird_stripe_price_id: '' }), false],
  ['no early bird price is not', workshop({ early_bird_price_cents: null }), false],
  // A free early bird is odd but valid, and 0 is falsy.
  ['a 0-cent early bird price still counts', workshop({ early_bird_price_cents: 0 }), true],
  // Workshops only. A course page cannot show early bird, so it must not charge it.
  ['a course never is', workshop({ kind: 'course' }), false],
  ['a tool never is', workshop({ kind: 'tool' }), false],
  // The boundary. Closed at its own instant.
  ['the end instant itself is closed', workshop({ early_bird_ends_at: NOW.toISOString() }), false],
  [
    'one second before the end is open',
    workshop({ early_bird_ends_at: new Date(NOW.getTime() + 1000).toISOString() }),
    true,
  ],
  [
    'one second after the end is closed',
    workshop({ early_bird_ends_at: new Date(NOW.getTime() - 1000).toISOString() }),
    false,
  ],
]

// Last day (as the admin picks it) -> the instant early bird closes.
const ends = [
  ['a September day closes at 11:59:59pm PDT', '2026-09-30', '2026-10-01T06:59:59.000Z'],
  // Clocks go back on 2026-11-01.
  ['the day before fall-back is still PDT', '2026-10-31', '2026-11-01T06:59:59.000Z'],
  ['the fall-back day itself closes in PST', '2026-11-01', '2026-11-02T07:59:59.000Z'],
  // Clocks go forward on 2026-03-08.
  ['the day before spring-forward is still PST', '2026-03-07', '2026-03-08T07:59:59.000Z'],
  ['the spring-forward day itself closes in PDT', '2026-03-08', '2026-03-09T06:59:59.000Z'],
  ['a year end', '2026-12-31', '2027-01-01T07:59:59.000Z'],
]

const badInput = [
  ['an empty string gives no deadline', ''],
  ['null gives no deadline', null],
  ['a datetime is not a day', '2026-09-30T12:00'],
]

// The admin form reads the stored instant back into a date input. It has to
// land on the same Pacific day it was saved from, not the UTC day after.
const roundTrips = ['2026-09-30', '2026-11-01', '2026-03-08', '2026-12-31']

const labels = [
  ['reads in Pacific, not UTC', '2026-10-01T06:59:59.000Z', 'Sep 30, 11:59pm PT'],
  ['reads in Pacific across fall-back', '2026-11-02T07:59:59.000Z', 'Nov 1, 11:59pm PT'],
]

let failed = 0
let total = 0
const check = (ok, name, expected, actual) => {
  total += 1
  if (!ok) failed += 1
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`)
  if (!ok) console.log(`      expected ${expected}` + '\n' + `      got      ${actual}`)
}

console.log('-- is early bird active --')
for (const [name, w, expected] of cases) {
  const actual = isEarlyBirdActive(w, NOW)
  check(actual === expected, name, expected, actual)
}

console.log('')
console.log('-- last day to deadline --')
for (const [name, day, expected] of ends) {
  const actual = earlyBirdEndsAt(day)?.toISOString()
  check(actual === expected, name, expected, actual)
}
for (const [name, day] of badInput) {
  const actual = earlyBirdEndsAt(day)
  check(actual === null, name, null, actual)
}

console.log('')
console.log('-- deadline back to last day --')
for (const day of roundTrips) {
  const actual = earlyBirdLastDay(earlyBirdEndsAt(day))
  check(actual === day, `${day} round-trips`, day, actual)
}

console.log('')
console.log('-- the printed deadline --')
for (const [name, iso, expected] of labels) {
  const actual = formatEarlyBirdEnd(iso)
  check(actual === expected, name, expected, actual)
}

console.log('')
console.log(`${total - failed}/${total} passed`)
process.exit(failed === 0 ? 0 : 1)
