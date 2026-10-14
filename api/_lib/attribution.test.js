import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  attributionFromMetadata,
  attributionToMetadata,
  cleanAttribution,
  cleanTouch,
  countBy,
  touchColumns,
  touchFromRow,
  touchSource,
  DIRECT,
  NO_RECORD,
} from './attribution.js'

const AT = '2026-10-01T12:00:00.000Z'

test('cleanTouch keeps a well-formed touch and normalizes the host', () => {
  const t = cleanTouch({
    at: AT,
    referrer_host: 'WWW.Instagram.com',
    landing_path: '/blog/springs-are-not-one-weight',
    utm_source: 'ig',
    utm_campaign: 'oct-launch',
  })
  assert.equal(t.referrer_host, 'instagram.com')
  assert.equal(t.landing_path, '/blog/springs-are-not-one-weight')
  assert.equal(t.utm_source, 'ig')
  assert.equal(t.utm_campaign, 'oct-launch')
  assert.equal(t.utm_medium, null)
  assert.equal(t.at, AT)
})

test('cleanTouch drops sensitive values and strips query strings', () => {
  const t = cleanTouch({
    at: AT,
    referrer_host: 'someone@example.com',
    landing_path: '/offer/reformer?t=AbC123XyZ789LmNoPq',
    utm_source: 'eyJhbGciOi.JIUzI1NiJ9',
    utm_campaign: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  })
  assert.equal(t.referrer_host, null)
  assert.equal(t.landing_path, '/offer/reformer')
  assert.equal(t.utm_source, null)
  assert.equal(t.utm_campaign, null)
})

test('cleanTouch returns null without a usable timestamp', () => {
  assert.equal(cleanTouch(null), null)
  assert.equal(cleanTouch({}), null)
  assert.equal(cleanTouch({ at: 'yesterday' }), null)
  assert.equal(cleanTouch({ at: '2099-01-01T00:00:00Z' }), null)
})

test('cleanAttribution tolerates garbage', () => {
  assert.deepEqual(cleanAttribution(undefined), { first: null, last: null })
  assert.deepEqual(cleanAttribution('nope'), { first: null, last: null })
  assert.deepEqual(cleanAttribution({ first: 7, last: [] }), { first: null, last: null })
})

test('touchColumns flattens both touches with nulls for missing ones', () => {
  const cols = touchColumns({ first: cleanTouch({ at: AT, referrer_host: 'google.com' }), last: null })
  assert.equal(cols.first_referrer_host, 'google.com')
  assert.equal(cols.first_seen_at, AT)
  assert.equal(cols.last_seen_at, null)
  assert.equal(cols.last_utm_source, null)
})

test('metadata round-trips through Stripe-safe keys', () => {
  const attribution = cleanAttribution({
    first: { at: AT, referrer_host: 'instagram.com', landing_path: '/', utm_campaign: 'reel-14' },
    last: { at: AT, utm_source: 'kit', utm_medium: 'email', landing_path: '/pilates-physics-101' },
  })
  const meta = attributionToMetadata(attribution)
  assert.equal(meta.attr_first_ref, 'instagram.com')
  assert.equal(meta.attr_last_src, 'kit')
  for (const v of Object.values(meta)) assert.ok(String(v).length <= 500)
  assert.deepEqual(attributionFromMetadata(meta), attribution)
})

test('touchSource buckets utm first, then host, then Direct', () => {
  assert.equal(touchSource(null), NO_RECORD)
  assert.equal(touchSource({ at: null }), NO_RECORD)
  assert.equal(touchSource({ at: AT }), DIRECT)
  assert.equal(touchSource({ at: AT, utm_source: 'IG', referrer_host: 'google.com' }), 'Instagram')
  assert.equal(touchSource({ at: AT, referrer_host: 'l.instagram.com' }), 'Instagram')
  assert.equal(touchSource({ at: AT, referrer_host: 'www.google.co.uk' }), 'Google')
  assert.equal(touchSource({ at: AT, referrer_host: 'kaleen.substack.com' }), 'Substack')
  assert.equal(touchSource({ at: AT, referrer_host: 'example.org' }), 'example.org')
  assert.equal(touchSource({ at: AT, utm_source: 'broadcast' }), 'Email')
})

test('touchFromRow reads a touch_attribution row', () => {
  const row = { first_referrer_host: 'instagram.com', first_seen_at: AT, first_utm_source: '' }
  const t = touchFromRow(row, 'first')
  assert.equal(t.referrerHost, 'instagram.com')
  assert.equal(t.utmSource, null)
  assert.equal(touchSource(t), 'Instagram')
  assert.equal(touchSource(touchFromRow(row, 'last')), NO_RECORD)
})

test('countBy sorts by count then label and caps the list', () => {
  const rows = countBy(['b', 'a', 'a', 'c', 'c'], (x) => x, 2)
  assert.deepEqual(rows, [
    { label: 'a', value: 2 },
    { label: 'c', value: 2 },
  ])
})
