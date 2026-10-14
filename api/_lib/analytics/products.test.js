import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildProducts, npsOf, npsSummary } from './products.js'
import { parseRange } from './shared.js'

const NOW = new Date('2026-10-14T12:00:00Z')
const range = parseRange({ range: '30d' }, NOW)

const CONFIG = { questions: [{ id: 'q_nps', type: 'nps' }, { id: 'q_text', type: 'long_text' }] }

const WEBINARS = [
  { id: 'w1', title: 'PP-101', slug: 'pp-101', kind: 'webinar', status: 'complete', scheduled_at: '2026-09-01T17:00:00Z', survey_config: CONFIG },
  { id: 'w2', title: 'Reformer', slug: 'harw', kind: 'course', status: 'live', scheduled_at: null, survey_config: null },
  { id: 't1', title: 'Calculator', slug: 'calc', kind: 'tool', status: 'live', scheduled_at: null },
]

const ENTS = [
  { user_id: 'u1', webinar_id: 'w1', source: 'stripe' },
  { user_id: 'u2', webinar_id: 'w1', source: 'stripe' },
  { user_id: 'u3', webinar_id: 'w1', source: 'manual' },
  { user_id: 'u4', webinar_id: 'w1', source: 'bonus' },
  { user_id: 'u1', webinar_id: 'w2', source: 'stripe' },
  { user_id: 'u9', webinar_id: 't1', source: 'lead_magnet' },
]

const PURCHASES = [
  { id: 'a', webinar_id: 'w1', purchased_at: '2026-08-01T00:00:00Z', settled_usd_cents: 6900, presentment_currency: 'usd', presentment_amount_cents: 6900, refund_usd_cents: 0 },
  { id: 'b', webinar_id: 'w1', purchased_at: '2026-10-01T00:00:00Z', settled_usd_cents: 6900, presentment_currency: 'usd', presentment_amount_cents: 6900, refund_usd_cents: 0 },
  { id: 'c', webinar_id: 'w2', purchased_at: '2026-10-02T00:00:00Z', settled_usd_cents: 3900, presentment_currency: 'usd', presentment_amount_cents: 3900, refund_usd_cents: 0 },
]

const ITEMS = [
  { event_type: 'portal_view', item_key: 'pp-101', label: 'pp-101', webinar_id: 'w1', opens: 9, distinct_users: 3 },
  { event_type: 'content_click', item_key: 'c1', label: 'Recording', webinar_id: 'w1', opens: 5, distinct_users: 2 },
  { event_type: 'download', item_key: 'c1', label: 'Recording', webinar_id: 'w1', opens: 1, distinct_users: 1 },
  { event_type: 'download', item_key: 'gone', label: 'Old worksheet', webinar_id: 'w1', opens: 2, distinct_users: 2 },
  { event_type: 'certificate_download', item_key: 'pp-101', label: 'pp-101', webinar_id: 'w1', opens: 4, distinct_users: 2 },
]

const CONTENT = [
  { id: 'c1', webinar_id: 'w1', title: 'Recording', type: 'recording' },
  { id: 'c2', webinar_id: 'w1', title: 'Slides', type: 'slide_deck' },
]

const FEEDBACK = [
  { webinar_id: 'w1', nps_score: 10, responses: null },
  { webinar_id: 'w1', nps_score: null, responses: { q_nps: 7 } },
  { webinar_id: 'w1', nps_score: null, responses: { q_nps: '9' } },
  { webinar_id: 'w1', nps_score: null, responses: { q_text: 'great' } },
]

test('npsOf reads the typed column first, then the configured nps question', () => {
  assert.equal(npsOf(FEEDBACK[0], CONFIG), 10)
  assert.equal(npsOf(FEEDBACK[1], CONFIG), 7)
  assert.equal(npsOf(FEEDBACK[2], CONFIG), 9)
  assert.equal(npsOf(FEEDBACK[3], CONFIG), null)
  assert.equal(npsOf(FEEDBACK[1], null), null)
})

test('npsSummary', () => {
  assert.equal(npsSummary([]), null)
  assert.deepEqual(npsSummary([10, 7, 9]), { count: 3, avg: 8.7, promoters: 2, detractors: 0, score: 67 })
})

test('one row per sellable product with enrollment, revenue, engagement and feedback', () => {
  const { products } = buildProducts({
    webinars: WEBINARS,
    entitlements: ENTS,
    purchases: PURCHASES,
    questions: [
      { webinar_id: 'w1', is_answered: true },
      { webinar_id: 'w1', is_answered: false },
    ],
    feedback: FEEDBACK,
    items: ITEMS,
    content: CONTENT,
    scholarships: [{ user_id: 'u2', webinar_id: 'w1' }],
    range,
  })
  assert.deepEqual(
    products.map((p) => p.id),
    ['w1', 'w2'],
  )
  const w1 = products[0]
  assert.equal(w1.enrolled, 4)
  assert.equal(w1.paid, 2)
  assert.equal(w1.scholarship, 1)
  assert.equal(w1.granted.manual, 1)
  assert.equal(w1.granted.bonus, 1)
  assert.equal(w1.granted_total, 2)
  assert.equal(w1.orders_in_range, 1)
  assert.equal(w1.net_cents_in_range, 6900)
  assert.equal(w1.orders_all_time, 2)
  assert.deepEqual(w1.portal_viewers, { n: 3, m: 4 })
  assert.deepEqual(w1.recording_watchers, { n: 2, m: 4 })
  assert.deepEqual(w1.certificates, { downloads: 4, people: { n: 2, m: 4 } })
  assert.equal(w1.nps.count, 3)
  assert.equal(w1.questions, 2)
  assert.equal(w1.unanswered_questions, 1)
  // Content ranked by distinct openers; removed items keep their label.
  assert.deepEqual(
    w1.content.map((c) => [c.title, c.distinct_users, c.opens]),
    [
      ['Recording', 2, 6],
      ['Old worksheet', 2, 2],
      ['Slides', 0, 0],
    ],
  )
  assert.equal(w1.content[1].removed, true)
})

test('missing ledger and view leave those columns null rather than zero', () => {
  const { products } = buildProducts({
    webinars: WEBINARS,
    entitlements: ENTS,
    purchases: null,
    questions: [],
    feedback: [],
    items: null,
    content: CONTENT,
    scholarships: null,
    range,
  })
  const w1 = products[0]
  assert.equal(w1.orders_in_range, null)
  assert.equal(w1.net_cents_in_range, null)
  assert.equal(w1.portal_viewers, null)
  assert.equal(w1.certificates, null)
  assert.equal(w1.scholarship, null)
  assert.equal(w1.nps, null)
  assert.equal(w1.content[0].opens, 0)
})
