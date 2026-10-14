import { test } from 'node:test'
import assert from 'node:assert/strict'
import { NO_RECORD } from '../attribution.js'
import { ALL_PRODUCTS, PRIOR_STATUS, buildFunnel, offerDay, weekStart } from './funnel.js'
import { parseRange } from './shared.js'

const NOW = new Date('2026-10-14T12:00:00Z')
const range30 = parseRange({ range: '30d' }, NOW)
const rangeAll = parseRange({ range: 'all' }, NOW)

const WEBINARS = [
  { id: 'w1', slug: 'pp-101', title: 'PP-101', kind: 'webinar' },
  { id: 'w2', slug: 'pp-102', title: 'PP-102', kind: 'webinar' },
  { id: 'c1', slug: 'harw', title: 'How a Reformer Works', kind: 'course' },
  { id: 't1', slug: 'spring-load-calculator', title: 'Calculator', kind: 'tool' },
]

const USERS = [
  { id: 'u1', email: 'one@example.com', created_at: '2026-06-01T00:00:00Z' },
  { id: 'u2', email: 'two@example.com', created_at: '2026-09-20T00:00:00Z' },
  { id: 'u3', email: 'three@example.com', created_at: '2026-10-01T00:00:00Z' },
  { id: 'u4', email: 'four@example.com', created_at: '2026-10-05T00:00:00Z' },
  { id: 'u5', email: 'five@example.com', created_at: '2026-10-08T00:00:00Z' },
]

// u1 claimed in June (outside 30d); u2, u3, u4 claimed inside the window.
const ENTS = [
  { user_id: 'u1', webinar_id: 't1', source: 'lead_magnet', granted_at: '2026-06-01T00:00:00Z' },
  { user_id: 'u2', webinar_id: 't1', source: 'lead_magnet', granted_at: '2026-09-20T00:00:00Z' },
  { user_id: 'u2', webinar_id: 't2', source: 'lead_magnet', granted_at: '2026-09-20T00:00:00Z' },
  { user_id: 'u3', webinar_id: 't1', source: 'lead_magnet', granted_at: '2026-10-01T00:00:00Z' },
  { user_id: 'u4', webinar_id: 't1', source: 'lead_magnet', granted_at: '2026-10-05T00:00:00Z' },
  { user_id: 'u1', webinar_id: 'w1', source: 'stripe', granted_at: '2026-06-11T00:00:00Z' },
]

const ATTRIBUTION = [
  { user_id: 'u2', email: 'two@example.com', first_utm_source: 'ig', first_seen_at: '2026-09-18T00:00:00Z', first_landing_path: '/blog/springs', last_referrer_host: 'google.com', last_seen_at: '2026-09-19T00:00:00Z', first_utm_campaign: 'oct-launch' },
  { user_id: 'u3', email: 'three@example.com', first_seen_at: null, last_seen_at: null },
  { user_id: 'u5', email: 'five@example.com', first_referrer_host: 'instagram.com', first_seen_at: '2026-10-01T00:00:00Z', last_seen_at: '2026-10-01T00:00:00Z' },
]

function order(over) {
  return {
    id: over.id,
    user_id: over.user_id ?? null,
    email: over.email ?? null,
    webinar_id: over.webinar_id ?? 'w1',
    webinar_slug: null,
    pricing: over.pricing ?? 'full',
    offer_id: over.offer_id ?? null,
    purchased_at: over.at,
  }
}

const PURCHASES = [
  order({ id: 'p1', user_id: 'u1', email: 'one@example.com', at: '2026-06-11T00:00:00Z' }), // PP-101, June
  order({ id: 'p2', user_id: 'u2', email: 'two@example.com', webinar_id: 'c1', pricing: 'offer', at: '2026-09-26T00:00:00Z', offer_id: 'o1' }),
  order({ id: 'p3', user_id: 'u2', email: 'two@example.com', webinar_id: 'w2', pricing: 'early_bird', at: '2026-10-10T00:00:00Z' }), // tripwire buyer ascends
  order({ id: 'p4', user_id: 'u4', email: 'four@example.com', at: '2026-10-11T00:00:00Z' }), // lead first
  order({ id: 'p5', user_id: 'u5', email: 'five@example.com', at: '2026-10-12T00:00:00Z' }), // cold
  order({ id: 'p6', user_id: 'u1', email: 'one@example.com', webinar_id: 'w2', at: '2026-10-13T00:00:00Z' }), // repeat from June
  order({ id: 'p7', user_id: 'u3', email: 'three@example.com', webinar_id: 'w1', pricing: 'scholarship', at: '2026-10-13T00:00:00Z' }),
]

const OFFERS = [
  { id: 'o1', offer_key: 'reformer-nurture', email: 'two@example.com', webinar_id: 'c1', created_at: '2026-09-24T00:00:00Z', expires_at: '2026-09-28T06:59:59Z', first_seen_at: '2026-09-25T00:00:00Z', redeemed_at: '2026-09-26T00:00:00Z', redeemed_email: 'two@example.com' },
  { id: 'o2', offer_key: 'reformer-nurture', email: 'three@example.com', webinar_id: 'c1', created_at: '2026-10-05T00:00:00Z', expires_at: '2026-10-09T06:59:59Z', first_seen_at: '2026-10-06T00:00:00Z', redeemed_at: null, redeemed_email: null },
  { id: 'o3', offer_key: 'reformer-nurture', email: 'four@example.com', webinar_id: 'c1', created_at: '2026-10-09T00:00:00Z', expires_at: '2026-10-13T06:59:59Z', first_seen_at: null, redeemed_at: null, redeemed_email: null },
  { id: 'o4', offer_key: 'reformer-nurture', email: 'six@example.com', webinar_id: 'c1', created_at: '2026-10-12T00:00:00Z', expires_at: '2026-10-16T06:59:59Z', first_seen_at: null, redeemed_at: null, redeemed_email: null },
  { id: 'o0', offer_key: 'reformer-backfill', email: 'old@example.com', webinar_id: 'c1', created_at: '2026-08-01T00:00:00Z', expires_at: '2026-08-05T06:59:59Z', first_seen_at: null, redeemed_at: null, redeemed_email: null },
]

const KIT = {
  tagged: [
    { email: 'three@example.com', tagged_at: '2026-10-05T00:00:00Z' },
    { email: 'seven@example.com', tagged_at: '2026-10-07T00:00:00Z' },
    { email: 'old@example.com', tagged_at: '2026-08-01T00:00:00Z' },
  ],
  new_subscribers: [
    { email: 'two@example.com', created_at: '2026-09-20T00:00:00Z' },
    { email: 'three@example.com', created_at: '2026-10-01T00:00:00Z' },
    { email: 'newsletter@example.com', created_at: '2026-10-02T00:00:00Z' },
    { email: 'ancient@example.com', created_at: '2026-01-01T00:00:00Z' },
  ],
  nurture: {
    entered: 400,
    in_progress: 30,
    unsubscribed: 12,
    emails: [{ position: 1, subject: 'Welcome', recipients: 400, open_rate: 60, click_rate: 10, unsubscribe_rate: 0.5 }],
  },
}

const base = { purchases: PURCHASES, webinars: WEBINARS, offers: OFFERS, entitlements: ENTS, users: USERS, attribution: ATTRIBUTION, kit: KIT, now: NOW }

test('weekStart and offerDay', () => {
  assert.equal(weekStart('2026-10-14T12:00:00Z'), '2026-10-12') // Wednesday -> Monday
  assert.equal(weekStart('2026-10-12T00:00:00Z'), '2026-10-12')
  assert.equal(offerDay('2026-10-01T00:00:00Z', '2026-10-01T20:00:00Z'), 1)
  assert.equal(offerDay('2026-10-01T00:00:00Z', '2026-10-04T23:00:00Z'), 4)
  assert.equal(offerDay('2026-10-01T00:00:00Z', '2026-10-09T00:00:00Z'), 5)
})

test('leads: claims in range, Kit overlap reported beside and never summed', () => {
  const f = buildFunnel({ ...base, range: range30 })
  assert.equal(f.leads.count, 3)
  assert.equal(f.leads.kit_new, 3) // two, three, newsletter (ancient is outside)
  assert.equal(f.leads.kit_overlap, 2)
  assert.equal(f.leads.kit_only, 1)
  assert.deepEqual(f.leads.measured, { n: 1, m: 3 })
  assert.deepEqual(f.leads.sources.first_touch, [
    { label: NO_RECORD, value: 2 },
    { label: 'Instagram', value: 1 },
  ])
  assert.deepEqual(f.leads.sources.last_touch, [
    { label: NO_RECORD, value: 2 },
    { label: 'Google', value: 1 },
  ])
  assert.deepEqual(f.leads.sources.campaigns, [{ label: 'oct-launch', value: 1 }])
  assert.deepEqual(f.leads.sources.landing_paths, [{ label: '/blog/springs', value: 1 }])
})

test('leads without Kit or attribution degrade to nulls', () => {
  const f = buildFunnel({ ...base, kit: null, attribution: null, range: range30 })
  assert.equal(f.leads.kit_new, null)
  assert.equal(f.leads.kit_only, null)
  assert.equal(f.leads.sources, null)
  assert.equal(f.sources, null)
  assert.equal(f.nurture.tagged, null)
  assert.equal(f.nurture.count, 4) // minted only: o1 to o4
})

test('offer window: union of minted and tagged, with overlap and claim-to-mint days', () => {
  const f = buildFunnel({ ...base, range: range30 })
  // minted in range: o1 (two), o2 (three), o3 (four), o4 (six); tagged in range: three, seven
  assert.equal(f.nurture.minted, 4)
  assert.equal(f.nurture.tagged, 2)
  assert.equal(f.nurture.overlap, 1)
  assert.equal(f.nurture.count, 5)
  // two: claimed 09-20, minted 09-24 -> 4; three: 10-01 -> 10-05 -> 4; four: 10-05 -> 10-09 -> 4; six unknown
  assert.equal(f.nurture.claim_to_mint_days, 4)
  assert.deepEqual(f.nurture.claim_to_mint_measured, { n: 3, m: 4 })
  assert.equal(f.nurture.emails.length, 1)
  assert.equal(f.nurture.nurture_unsubscribed, 12)
})

test('tripwire: purchases at offer pricing, standalone against offers that expired in the window', () => {
  const f = buildFunnel({ ...base, range: range30 })
  assert.equal(f.offer.count, 1)
  // expired in range: o1 (redeemed), o2, o3 -> 1 of 3
  assert.deepEqual(f.offer.expired, { n: 1, m: 3 })
  assert.deepEqual(f.offer.stages, { minted: 4, seen: 2, redeemed: 1, forwarded: 0 })
  assert.deepEqual(f.offer.by_day, [
    { label: 'Day 1', value: 0 },
    { label: 'Day 2', value: 0 },
    { label: 'Day 3', value: 1 },
    { label: 'Day 4', value: 0 },
    { label: 'After the window', value: 0 },
  ])
  assert.deepEqual(
    f.offer.by_week.map((w) => [w.week, w.minted, w.redeemed]),
    [
      ['2026-09-21', 1, 1],
      ['2026-10-05', 2, 0],
      ['2026-10-12', 1, 0],
    ],
  )
  // o2 (three) and o3 (four) expired unused; neither bought the course at full price after
  assert.deepEqual(f.offer.expired_then_full, { n: 0, m: 2 })
  assert.equal(f.offers_expiring_soon, 1) // o4
})

test('expired unused who later bought at full price', () => {
  const purchases = [...PURCHASES, order({ id: 'p8', user_id: 'u3', email: 'three@example.com', webinar_id: 'c1', pricing: 'full', at: '2026-10-12T00:00:00Z' })]
  const f = buildFunnel({ ...base, purchases, range: range30 })
  assert.deepEqual(f.offer.expired_then_full, { n: 1, m: 2 })
})

test('core: full and early bird workshop or course orders, by prior status, scholarships aside', () => {
  const f = buildFunnel({ ...base, range: range30 })
  // p3 (u2, early bird, tripwire first), p4 (u4, lead first), p5 (u5, cold), p6 (u1, lead in June -> lead first)
  assert.equal(f.core.count, 4)
  // u2 was a lead AND a tripwire buyer; was_lead counts the claim regardless
  assert.deepEqual(f.core.was_lead, { n: 3, m: 4 })
  // u2: 09-20 -> 10-10 = 20; u4: 10-05 -> 10-11 = 6; u1: 06-01 -> 10-13 = 134 -> median 20
  assert.equal(f.core.lead_to_purchase_days, 20)
  assert.deepEqual(f.core.by_prior_status, [
    { label: PRIOR_STATUS.lead, value: 2 },
    { label: PRIOR_STATUS.tripwire, value: 1 },
    { label: PRIOR_STATUS.cold, value: 1 },
  ])
  assert.deepEqual(f.core.by_pricing, [
    { label: 'Full price', value: 3 },
    { label: 'Early bird', value: 1 },
  ])
  assert.deepEqual(f.core.by_product, [
    { label: 'PP-101', value: 2 },
    { label: 'PP-102', value: 2 },
  ])
  assert.deepEqual(f.core.by_first_touch, [
    { label: 'Instagram', value: 2 },
    { label: NO_RECORD, value: 2 },
  ])
  // u2: 09-18 -> 10-10 = 22; u5: 10-01 -> 10-12 = 11 -> median 16.5
  assert.equal(f.core.first_touch_days, 16.5)
  assert.deepEqual(f.core.first_touch_measured, { n: 2, m: 4 })
  assert.equal(f.core.scholarships, 1)
})

test('product filter narrows steps 5 and 6 but not step 4, and an unknown slug falls back to all', () => {
  const f = buildFunnel({ ...base, range: range30, product: 'pp-102' })
  assert.equal(f.product, 'pp-102')
  assert.equal(f.core.count, 2) // p3, p6
  assert.equal(f.offer.count, 1)
  assert.equal(f.repeat.count, 2) // u2 (offer then pp-102), u1 (pp-101 then pp-102)
  assert.deepEqual(f.products.map((p) => p.slug), ['harw', 'pp-101', 'pp-102'])

  const g = buildFunnel({ ...base, range: range30, product: 'nope' })
  assert.equal(g.product, ALL_PRODUCTS)
  assert.equal(g.core.count, 4)
})

test('bought again: second-or-later purchases in range, prior buyers as the denominator, product matrix', () => {
  const f = buildFunnel({ ...base, range: range30 })
  assert.equal(f.repeat.count, 2) // u2, u1
  assert.deepEqual(f.repeat.matrix, [
    { label: 'How a Reformer Works then PP-102', value: 1 },
    { label: 'PP-101 then PP-102', value: 1 },
  ])
  // u2: 14 days; u1: 124 days -> median 69
  assert.equal(f.repeat.days_between, 69)
  assert.deepEqual(f.repeat.twice_share, { n: 2, m: 5 })
})

test('bought again: prior buyers counts first purchases before the window; all time counts everyone', () => {
  const f = buildFunnel({ ...base, range: range30 })
  // first purchases: u1 June (before), u2 Sept 26 (inside), u4, u5, u3 inside -> 1 prior buyer
  assert.equal(f.repeat.prior_buyers, 1)
  const g = buildFunnel({ ...base, range: rangeAll })
  assert.equal(g.repeat.prior_buyers, 5)
  assert.equal(g.repeat.count, 2)
  assert.equal(g.leads.count, 4)
  assert.equal(g.core.count, 5)
})

test('sources tables count leads, tripwire and core buyers per bucket, only counts', () => {
  const f = buildFunnel({ ...base, range: range30 })
  assert.deepEqual(f.sources.first_touch, [
    { label: 'Instagram', leads: 1, tripwire: 1, core: 2 },
    { label: NO_RECORD, leads: 2, tripwire: 0, core: 2 },
  ])
  assert.deepEqual(f.sources.campaigns, [
    { label: NO_RECORD, leads: 2, tripwire: 0, core: 2 },
    { label: 'oct-launch', leads: 1, tripwire: 1, core: 1 },
    { label: '(no campaign)', leads: 0, tripwire: 0, core: 1 },
  ])
  for (const row of f.sources.last_touch) assert.deepEqual(Object.keys(row), ['label', 'leads', 'tripwire', 'core'])
})

test('without the purchases ledger the purchase steps are null rather than zero', () => {
  const f = buildFunnel({ ...base, purchases: null, range: range30 })
  assert.equal(f.offer.count, null)
  assert.equal(f.core.count, null)
  assert.equal(f.repeat.count, null)
  assert.equal(f.repeat.twice_share, null)
  assert.equal(f.offer.expired_then_full, null)
  assert.deepEqual(f.products, [])
  assert.equal(f.leads.count, 3)
})
