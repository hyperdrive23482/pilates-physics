import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildEngagement, buyersNeverSignedIn, dailySeries, rankItems, timeOfDay } from './engagement.js'

const NOW = new Date('2026-10-14T12:00:00Z')

const DAILY = [
  { day: '2026-09-01', event_type: 'login', webinar_id: null, events: 3, distinct_users: 2 },
  { day: '2026-10-01', event_type: 'login', webinar_id: null, events: 5, distinct_users: 4 },
  { day: '2026-10-01', event_type: 'portal_view', webinar_id: 'w1', events: 7, distinct_users: 4 },
  { day: '2026-10-02', event_type: 'tool_open', webinar_id: null, events: 2, distinct_users: 1 },
  { day: '2026-10-02', event_type: 'download', webinar_id: 'w1', events: 1, distinct_users: 1 },
]
const ITEMS = [
  { event_type: 'tool_open', item_key: 'springs-101', label: 'Springs 101', opens: 10, distinct_users: 6 },
  { event_type: 'tool_open', item_key: 'class-simulator', label: 'Class Simulator', opens: 20, distinct_users: 3 },
  { event_type: 'content_click', item_key: 'c1', label: 'Recording', opens: 4, distinct_users: 2 },
  { event_type: 'download', item_key: 'c1', label: 'Recording', opens: 2, distinct_users: 1 },
]
const HOURLY = [
  { dow: 1, hour: 9, event_type: 'login', events: 4, distinct_users: 3 },
  { dow: 1, hour: 20, event_type: 'portal_view', events: 2, distinct_users: 2 },
  { dow: 6, hour: 9, event_type: 'tool_open', events: 8, distinct_users: 1 },
]
const USERS = [
  { id: 'u1', last_sign_in_at: '2026-10-01T00:00:00Z' },
  { id: 'u2', last_sign_in_at: null },
  { id: 'u3', last_sign_in_at: null },
  { id: 'u4', last_sign_in_at: null },
]
const ENTS = [
  { user_id: 'u1', source: 'stripe', granted_at: '2026-10-10T00:00:00Z' },
  { user_id: 'u2', source: 'stripe', granted_at: '2026-10-10T00:00:00Z' },
  { user_id: 'u3', source: 'stripe', granted_at: '2026-08-01T00:00:00Z' },
  { user_id: 'u3', source: 'stripe', granted_at: '2026-06-01T00:00:00Z' },
  { user_id: 'u4', source: 'manual', granted_at: '2026-06-01T00:00:00Z' },
]

test('rankItems merges event types and ranks by people then opens', () => {
  assert.deepEqual(rankItems(ITEMS, ['tool_open']), [
    { key: 'springs-101', label: 'Springs 101', opens: 10, distinct_users: 6 },
    { key: 'class-simulator', label: 'Class Simulator', opens: 20, distinct_users: 3 },
  ])
  assert.deepEqual(rankItems(ITEMS, ['content_click', 'download']), [
    { key: 'c1', label: 'Recording', opens: 6, distinct_users: 2 },
  ])
})

test('dailySeries sums events per day for the chosen types', () => {
  assert.deepEqual(dailySeries(DAILY, ['login']), [
    { date: '2026-09-01', value: 3 },
    { date: '2026-10-01', value: 5 },
  ])
})

test('timeOfDay fills seven weekdays and twenty-four hours', () => {
  const t = timeOfDay(HOURLY, ['login', 'portal_view'])
  assert.equal(t.weekday.length, 7)
  assert.equal(t.hour.length, 24)
  assert.equal(t.weekday[1].value, 6)
  assert.equal(t.weekday[6].value, 0)
  assert.equal(t.hour[9].value, 4)
  assert.equal(t.hour[9].label, '9am')
  assert.equal(t.hour[20].label, '8pm')
})

test('buyersNeverSignedIn splits by age of first purchase', () => {
  const b = buyersNeverSignedIn(USERS, ENTS, NOW)
  assert.equal(b.buyers, 3)
  assert.deepEqual(b.never, { n: 2, m: 3 })
  assert.deepEqual(
    b.by_age.map((x) => [x.key, x.value]),
    [
      ['under_30', 1],
      ['30_60', 0],
      ['60_90', 0],
      ['over_90', 1],
    ],
  )
})

test('buildEngagement respects the range for kpis and keeps daily series whole', () => {
  const e = buildEngagement({
    dailyRows: DAILY,
    items: ITEMS,
    itemsScope: 'range',
    hourly: HOURLY,
    activeUsers: 5,
    users: USERS,
    entitlements: ENTS,
    fromDay: '2026-09-14',
    now: NOW,
  })
  assert.equal(e.kpis.active_users, 5)
  assert.equal(e.kpis.logins, 5)
  assert.equal(e.kpis.portal_views, 7)
  assert.equal(e.kpis.events, 15)
  assert.equal(e.daily.logins.length, 2)
  assert.equal(e.rankings.scope, 'range')
  assert.equal(e.time_of_day.sessions.weekday[1].value, 6)
  assert.equal(e.time_of_day.all.weekday[6].value, 8)
  assert.equal(e.buyers.buyers, 3)
})

test('missing views leave blocks null', () => {
  const e = buildEngagement({ dailyRows: null, items: null, hourly: null, activeUsers: null, users: null, entitlements: [], fromDay: null, now: NOW })
  assert.equal(e.kpis.logins, null)
  assert.equal(e.daily, null)
  assert.equal(e.rankings, null)
  assert.equal(e.time_of_day, null)
  assert.equal(e.buyers, null)
})
