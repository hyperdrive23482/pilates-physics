import { test } from 'node:test'
import assert from 'node:assert/strict'
import { EMPTY_TRAFFIC, fetchPreLead, fetchTraffic, stat } from './funnel-traffic.js'

function fakeClient(answers) {
  const calls = []
  return {
    calls,
    async query(name, sql) {
      calls.push({ name, sql })
      const a = answers[name]
      if (a instanceof Error) throw a
      return a ?? []
    },
  }
}

test('stat: median and mean to one decimal, zeros when empty', () => {
  assert.deepEqual(stat([]), { median: 0, mean: 0 })
  assert.deepEqual(stat([1, 2, 10]), { median: 2, mean: 4.3 })
  assert.deepEqual(stat([1, 2, 3, 10]), { median: 2.5, mean: 4 })
})

test('fetchTraffic parses the six queries and fills the fallbacks', async () => {
  const ph = fakeClient({
    funnel_traffic_headline: [[166, 240, 427]],
    funnel_traffic_channels: [
      ['Organic Search', 90],
      [null, 5],
    ],
    funnel_traffic_referrers: [['instagram.com', 40]],
    funnel_traffic_campaigns: [['ig · bio', 39]],
    funnel_traffic_countries: [['United States', 120]],
    funnel_traffic_us_states: [['California', 30]],
  })
  const t = await fetchTraffic(ph, 'pilatesphysics.com', '2026-09-14T00:00:00.000Z', '2026-10-14T12:00:00.000Z')
  assert.equal(t.visitors, 166)
  assert.equal(t.visits, 240)
  assert.equal(t.pageviews, 427)
  assert.deepEqual(t.channels, [
    { label: 'Organic Search', value: 90 },
    { label: 'Unknown', value: 5 },
  ])
  assert.deepEqual(t.referrers, [{ label: 'instagram.com', value: 40 }])
  assert.deepEqual(t.us_states, [{ label: 'California', value: 30 }])
  assert.equal(ph.calls.length, 6)

  const headline = ph.calls.find((c) => c.name === 'funnel_traffic_headline').sql
  assert.ok(headline.includes("properties.$host = 'pilatesphysics.com'"))
  assert.ok(headline.includes("timestamp >= toDateTime('2026-09-14 00:00:00')"))
  assert.ok(headline.includes("'/spring-calculator'"))
  const sessions = ph.calls.find((c) => c.name === 'funnel_traffic_channels').sql
  assert.ok(sessions.includes('$entry_hostname'))
  assert.ok(sessions.includes('$start_timestamp >= toDateTime'))
})

test('fetchTraffic: all time drops the lower bound and an empty answer is all zeros', async () => {
  const ph = fakeClient({})
  const t = await fetchTraffic(ph, 'pilatesphysics.com', null, '2026-10-14T12:00:00.000Z')
  assert.deepEqual(t, EMPTY_TRAFFIC)
  for (const c of ph.calls) assert.ok(!c.sql.includes('>= toDateTime'), `${c.name} has a lower bound`)
})

test('fetchPreLead: no claims in PostHog means two queries, zero stats and every db claim unseen', async () => {
  const ph = fakeClient({ funnel_prelead_landing: [[12]] })
  const r = await fetchPreLead(ph, 'pilatesphysics.com', '2026-09-14T00:00:00.000Z', '2026-10-14T12:00:00.000Z', { claimsInDb: 3 })
  assert.equal(ph.calls.length, 2)
  assert.equal(r.measured, 0)
  assert.equal(r.unseen, 3)
  assert.equal(r.landing_visitors, 12)
  assert.equal(r.landing_claimed, 0)
  assert.deepEqual(r.pages, { median: 0, mean: 0 })
  assert.deepEqual(r.top_pages, [])
})

test('fetchPreLead: per-person cutoffs, zero-page claimers counted, unseen clamped at zero', async () => {
  const ph = fakeClient({
    funnel_prelead_claims: [
      ['p1', '2026-10-01T10:00:00.000Z'],
      ['p2', '2026-10-02T10:00:00.000Z'],
      ['p3', '2026-10-03T10:00:00.000Z'],
    ],
    funnel_prelead_landing: [[40]],
    funnel_prelead_counts: [
      ['p1', 4, 2],
      ['p2', 1, 1],
    ],
    funnel_prelead_pages: [
      ['/', 2],
      ['/blog/springs', 1],
    ],
  })
  const r = await fetchPreLead(ph, 'pilatesphysics.com', null, '2026-10-14T12:00:00.000Z', { claimsInDb: 2 })
  assert.equal(ph.calls.length, 4)
  assert.equal(r.measured, 3)
  assert.equal(r.unseen, 0)
  assert.equal(r.landing_visitors, 40)
  assert.equal(r.landing_claimed, 3)
  // pages: 4, 1, 0 -> median 1, mean 1.7; visits: 2, 1, 0 -> median 1, mean 1
  assert.deepEqual(r.pages, { median: 1, mean: 1.7 })
  assert.deepEqual(r.visits, { median: 1, mean: 1 })
  assert.deepEqual(r.top_pages, [
    { label: '/', value: 2 },
    { label: '/blog/springs', value: 1 },
  ])
  const counts = ph.calls.find((c) => c.name === 'funnel_prelead_counts').sql
  assert.ok(counts.includes("person_id = 'p1', toDateTime('2026-10-01 10:00:00')"))
  assert.ok(counts.includes("person_id IN ('p1', 'p2', 'p3')"))
})

test('fetchPreLead without a db count reports unseen as null', async () => {
  const ph = fakeClient({ funnel_prelead_landing: [[0]] })
  const r = await fetchPreLead(ph, 'pilatesphysics.com', null, '2026-10-14T12:00:00.000Z')
  assert.equal(r.unseen, null)
})
