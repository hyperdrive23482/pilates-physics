import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildRevenue, launchSeries } from './revenue.js'
import { parseRange } from './shared.js'

const NOW = new Date('2026-10-14T12:00:00Z')
const range30 = parseRange({ range: '30d' }, NOW)
const rangeAll = parseRange({ range: 'all' }, NOW)

const W1 = {
  id: 'w1',
  title: 'PP-101',
  slug: 'pp-101',
  kind: 'webinar',
  scheduled_at: '2026-10-20T17:00:00Z',
  early_bird_ends_at: '2026-10-11T06:59:59Z',
}
const W2 = { id: 'w2', title: 'Reformer course', slug: 'harw', kind: 'course', scheduled_at: null }

function order(over) {
  return {
    id: over.id,
    user_id: over.user_id ?? null,
    email: over.email ?? null,
    webinar_id: over.webinar_id ?? 'w1',
    webinar_slug: 'pp-101',
    pricing: over.pricing ?? 'full',
    presentment_currency: over.presentment_currency ?? 'usd',
    presentment_amount_cents: over.amount ?? 6900,
    settled_usd_cents: over.settled === undefined ? over.amount ?? 6900 : over.settled,
    stripe_fee_cents: over.fee ?? null,
    discount_cents: over.discount ?? 0,
    refund_usd_cents: over.refund ?? 0,
    refunded_at: over.refund ? '2026-10-12T00:00:00Z' : null,
    dispute_status: over.dispute ?? null,
    disputed_at: over.dispute ? '2026-10-12T00:00:00Z' : null,
    needs_settlement_lookup: over.unsettled ?? false,
    purchased_at: over.at,
  }
}

const PURCHASES = [
  order({ id: 'a', user_id: 'u1', at: '2026-08-01T10:00:00Z', amount: 6900, fee: 230 }),
  order({ id: 'b', user_id: 'u1', at: '2026-10-05T10:00:00Z', amount: 3900, pricing: 'offer', webinar_id: 'w2', fee: 143 }),
  order({ id: 'c', user_id: 'u2', at: '2026-10-06T10:00:00Z', amount: 4900, pricing: 'early_bird', discount: 2000 }),
  order({ id: 'd', user_id: 'u3', at: '2026-10-08T10:00:00Z', amount: 6900, refund: 6900 }),
  order({ id: 'e', email: 'Eve@Example.com', at: '2026-10-09T10:00:00Z', amount: 6000, presentment_currency: 'eur', settled: 6500 }),
  order({ id: 'f', user_id: 'u4', at: '2026-10-10T10:00:00Z', amount: 6900, dispute: 'lost' }),
]

test('kpis cover only the range and net out refunds and lost disputes', () => {
  const { kpis } = buildRevenue({ purchases: PURCHASES, webinars: [W1, W2], range: range30 })
  assert.equal(kpis.orders, 5)
  // 3900 + 4900 + (6900 - 6900) + 6500 + (6900 - 6900)
  assert.equal(kpis.net_cents, 15300)
  assert.equal(kpis.aov_cents, Math.round(15300 / 5))
  assert.equal(kpis.buyers, 5)
  // u1 bought in August, so the October order is a repeat.
  assert.equal(kpis.repeat_buyers, 1)
  assert.equal(kpis.refund_cents, 6900)
  assert.equal(kpis.refunds, 1)
  assert.equal(kpis.dispute_lost_cents, 6900)
  assert.equal(kpis.disputes, 1)
  assert.equal(kpis.fee_cents, 143)
  assert.equal(kpis.fee_known_orders, 1)
  assert.equal(kpis.non_usd_orders, 1)
})

test('all time includes the August order and counts no repeat buyers twice', () => {
  const { kpis, daily } = buildRevenue({ purchases: PURCHASES, webinars: [W1, W2], range: rangeAll })
  assert.equal(kpis.orders, 6)
  assert.equal(kpis.buyers, 5)
  assert.equal(kpis.repeat_buyers, 1)
  assert.equal(daily.length, 6)
  assert.deepEqual(daily[0], {
    date: '2026-08-01',
    orders: 1,
    gross: 6900,
    discounts: 0,
    refunds: 0,
    disputes: 0,
    net: 6900,
    fees: 230,
    buyers: 1,
    repeat_buyers: 0,
  })
  assert.equal(daily[1].repeat_buyers, 1)
})

test('by product and by tier add up to the headline and carry shares', () => {
  const { kpis, by_product, by_pricing } = buildRevenue({ purchases: PURCHASES, webinars: [W1, W2], range: range30 })
  assert.equal(by_product.reduce((a, r) => a + r.net_cents, 0), kpis.net_cents)
  assert.equal(by_pricing.reduce((a, r) => a + r.net_cents, 0), kpis.net_cents)
  assert.equal(by_product[0].title, 'PP-101')
  assert.equal(by_product[0].net_cents, 11400)
  const offer = by_pricing.find((t) => t.pricing === 'offer')
  assert.equal(offer.orders, 1)
  assert.equal(offer.label, '$39 offer')
  assert.equal(Math.round(offer.share * 100), Math.round((3900 / 15300) * 100))
  // Every canonical tier is present, zeros included.
  assert.deepEqual(
    by_pricing.map((t) => t.pricing),
    ['full', 'early_bird', 'offer', 'scholarship', 'bundle'],
  )
  assert.equal(by_pricing.find((t) => t.pricing === 'bundle').orders, 0)
})

test('launch series runs from the first order to the workshop day with zero-filled gaps', () => {
  const series = launchSeries(PURCHASES, W1)
  assert.equal(series[0].date, '2026-08-01')
  assert.equal(series[series.length - 1].date, '2026-10-20')
  assert.equal(series.find((d) => d.date === '2026-10-06').early_bird, 1)
  assert.equal(series.find((d) => d.date === '2026-09-15').orders, 0)
  const { launches } = buildRevenue({ purchases: PURCHASES, webinars: [W1, W2], range: range30 })
  assert.equal(launches.length, 1)
  assert.equal(launches[0].early_bird_day, '2026-10-11')
  assert.equal(launches[0].scheduled_day, '2026-10-20')
})

test('an empty ledger yields zeros, not NaN', () => {
  const { kpis, by_pricing, launches } = buildRevenue({ purchases: [], webinars: [W1], range: range30 })
  assert.equal(kpis.net_cents, 0)
  assert.equal(kpis.aov_cents, null)
  assert.equal(by_pricing[0].share, null)
  assert.deepEqual(launches, [])
})
