import { test } from 'node:test'
import assert from 'node:assert/strict'
import { dayRange, inRange, median, medianDays, netCents, parseRange } from './shared.js'

const NOW = new Date('2026-10-14T12:34:56Z')

test('parseRange anchors to UTC midnight and defaults to 30d', () => {
  const r = parseRange({ range: '7d' }, NOW)
  assert.equal(r.from, '2026-10-07T00:00:00.000Z')
  assert.equal(r.from_day, '2026-10-07')
  assert.equal(r.to, NOW.toISOString())
  assert.equal(parseRange({}, NOW).range, '30d')
  assert.equal(parseRange({ range: 'bogus' }, NOW).range, '30d')
  assert.equal(parseRange({ range: '12m' }, NOW).from, '2025-10-14T00:00:00.000Z')
  assert.equal(parseRange({ range: 'all' }, NOW).from, null)
})

test('inRange handles postgres timestamps and all time', () => {
  const r = parseRange({ range: '30d' }, NOW)
  assert.equal(inRange('2026-10-01T00:00:00+00:00', r), true)
  assert.equal(inRange('2026-09-01T00:00:00+00:00', r), false)
  assert.equal(inRange(null, r), false)
  assert.equal(inRange('2020-01-01T00:00:00Z', parseRange({ range: 'all' }, NOW)), true)
})

test('median and medianDays', () => {
  assert.equal(median([]), null)
  assert.equal(median([3, 1, 2]), 2)
  assert.equal(median([4, 1, 2, 3]), 2.5)
  assert.equal(medianDays([1.26, 1.24, 1.25]), 1.3)
})

test('netCents prefers settled USD and subtracts refunds and lost disputes', () => {
  assert.equal(
    netCents({ settled_usd_cents: 6500, presentment_currency: 'eur', presentment_amount_cents: 6000, refund_usd_cents: 0 }),
    6500,
  )
  assert.equal(
    netCents({ settled_usd_cents: null, presentment_currency: 'eur', presentment_amount_cents: 6000, refund_usd_cents: 0 }),
    0,
  )
  assert.equal(
    netCents({ settled_usd_cents: null, presentment_currency: 'usd', presentment_amount_cents: 6900, refund_usd_cents: 1000 }),
    5900,
  )
  assert.equal(netCents({ settled_usd_cents: 6900, refund_usd_cents: 0, dispute_status: 'lost' }), 0)
})

test('dayRange is inclusive and capped', () => {
  assert.deepEqual(dayRange('2026-10-01', '2026-10-03'), ['2026-10-01', '2026-10-02', '2026-10-03'])
  assert.equal(dayRange('2026-01-01', '2027-01-01', 10).length, 10)
})
