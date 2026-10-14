import { test } from 'node:test'
import assert from 'node:assert/strict'
import { NO_RECORD } from '../attribution.js'
import { NO_PRODUCT, accountSource, buildAudience } from './audience.js'
import { parseRange } from './shared.js'

const NOW = new Date('2026-10-14T12:00:00Z')
const range = parseRange({ range: '30d' }, NOW)

const USERS = [
  { id: 'u1', email: 'one@example.com', created_at: '2026-06-01T00:00:00Z', last_sign_in_at: '2026-10-01T00:00:00Z' },
  { id: 'u2', email: 'two@example.com', created_at: '2026-10-01T00:00:00Z', last_sign_in_at: null },
  { id: 'u3', email: 'three@example.com', created_at: '2026-10-05T00:00:00Z', last_sign_in_at: null },
  { id: 'u4', email: 'four@example.com', created_at: '2026-10-06T00:00:00Z', last_sign_in_at: null },
]
const ENTS = [
  { user_id: 'u1', webinar_id: 't1', source: 'lead_magnet', granted_at: '2026-06-01T00:00:00Z' },
  { user_id: 'u1', webinar_id: 'w1', source: 'stripe', granted_at: '2026-06-11T00:00:00Z' },
  { user_id: 'u2', webinar_id: 'w1', source: 'stripe', granted_at: '2026-10-01T00:00:00Z' },
  { user_id: 'u3', webinar_id: 't1', source: 'lead_magnet', granted_at: '2026-10-05T00:00:00Z' },
]
const WEBINARS = [
  { id: 't1', title: 'Calculator', kind: 'tool' },
  { id: 'w1', title: 'PP-101', kind: 'webinar' },
]
const ATTRIBUTION = [
  { user_id: 'u2', created_at: '2026-10-01T00:00:00Z', recorded_via: 'checkout', first_utm_source: 'ig', first_seen_at: '2026-09-20T00:00:00Z', first_landing_path: '/blog/springs', last_referrer_host: 'google.com', last_seen_at: '2026-09-30T00:00:00Z', first_utm_campaign: 'oct-launch' },
  { user_id: 'u3', created_at: '2026-10-05T00:00:00Z', recorded_via: 'lead_claim', first_seen_at: null, last_seen_at: null },
]
const SNAPSHOTS = [
  { snapshot_date: '2026-10-13', kit: { subscribers: 1200 }, users: { total_accounts: 4 } },
  { snapshot_date: '2026-10-12', kit: null, users: { total_accounts: 4 } },
]

test('accountSource uses the earliest entitlement', () => {
  assert.equal(accountSource([]), NO_PRODUCT)
  assert.equal(accountSource(ENTS.filter((e) => e.user_id === 'u1')), 'Calculator lead')
  assert.equal(accountSource(ENTS.filter((e) => e.user_id === 'u2')), 'Purchase')
})

test('kpis: new accounts in range, leads who bought, buyers never leads', () => {
  const a = buildAudience({ users: USERS, entitlements: ENTS, attribution: ATTRIBUTION, snapshots: SNAPSHOTS, webinars: WEBINARS, kitLive: null, range })
  assert.equal(a.kpis.new_accounts, 3)
  assert.equal(a.kpis.total_accounts, 4)
  assert.equal(a.kpis.leads, 2)
  assert.deepEqual(a.kpis.leads_bought, { n: 1, m: 2 })
  assert.equal(a.kpis.lead_to_purchase_days, 10)
  assert.equal(a.kpis.buyers, 2)
  assert.deepEqual(a.kpis.buyers_never_leads, { n: 1, m: 2 })
  assert.deepEqual(a.kpis.kit, { subscribers: 1200, as_of: '2026-10-13', from: 'snapshot' })
  assert.deepEqual(a.new_by_source, [
    { label: 'Calculator lead', value: 1 },
    { label: NO_PRODUCT, value: 1 },
    { label: 'Purchase', value: 1 },
  ])
  assert.deepEqual(a.new_daily[0], { date: '2026-06-01', value: 1 })
})

test('attribution breakdowns bucket by source and add No record for unrecorded accounts', () => {
  const a = buildAudience({ users: USERS, entitlements: ENTS, attribution: ATTRIBUTION, snapshots: [], webinars: WEBINARS, kitLive: { subscribers: 1250 }, range })
  assert.equal(a.sources.recorded, 2)
  assert.equal(a.sources.unrecorded, 1)
  // u2 via Instagram, u3 stored an empty record, u4 has no row at all.
  assert.deepEqual(a.sources.first_touch, [
    { label: NO_RECORD, value: 2 },
    { label: 'Instagram', value: 1 },
  ])
  assert.deepEqual(a.sources.last_touch, [
    { label: NO_RECORD, value: 2 },
    { label: 'Google', value: 1 },
  ])
  assert.deepEqual(a.sources.campaigns[0], { label: '(no campaign)', value: 1 })
  assert.deepEqual(a.sources.landing_paths, [{ label: '/blog/springs', value: 1 }])
  assert.deepEqual(a.kpis.kit, { subscribers: 1250, as_of: null, from: 'live' })
})

test('recent accounts carry source, touch and products; missing attribution table leaves sources null', () => {
  const a = buildAudience({ users: USERS, entitlements: ENTS, attribution: null, snapshots: null, webinars: WEBINARS, kitLive: null, range, recentLimit: 2 })
  assert.equal(a.sources, null)
  assert.equal(a.kpis.kit, null)
  assert.deepEqual(
    a.recent.map((r) => [r.email, r.source, r.first_touch, r.products, r.is_buyer]),
    [
      ['four@example.com', NO_PRODUCT, NO_RECORD, [], false],
      ['three@example.com', 'Calculator lead', NO_RECORD, [], false],
    ],
  )
})
