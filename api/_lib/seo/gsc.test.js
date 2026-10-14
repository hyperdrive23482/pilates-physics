import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createVerify, generateKeyPairSync } from 'node:crypto'
import {
  dayOffset,
  indexFindings,
  parseServiceAccount,
  signAssertion,
  toDailyRows,
  toIndexStatusRow,
  toPath,
  windows,
} from './gsc.js'

// The pure half of the Search Console module, ported from remo's gsc.test.ts,
// plus the Node JWT signing that replaced WebCrypto.

const ORIGIN = 'https://pilatesphysics.com'

test('toPath strips host, query and trailing slash', () => {
  assert.equal(toPath('https://pilatesphysics.com/'), '/')
  assert.equal(toPath('https://www.pilatesphysics.com/about/'), '/about')
  assert.equal(toPath('https://pilatesphysics.com/blog/x?utm=1'), '/blog/x')
  assert.equal(toPath('nonsense'), 'nonsense')
})

test('toDailyRows merges apex and www rows, weighting position by impressions', () => {
  const rows = toDailyRows(
    [
      { keys: ['2026-10-01', 'https://pilatesphysics.com/', 'pilates physics'], clicks: 3, impressions: 10, ctr: 0.3, position: 4 },
      { keys: ['2026-10-01', 'https://www.pilatesphysics.com/', 'pilates physics'], clicks: 1, impressions: 30, ctr: 0.03, position: 8 },
      { keys: ['2026-10-02', 'https://pilatesphysics.com/', 'pilates physics'], clicks: 0, impressions: 1, ctr: 0, position: 61 },
    ],
    ['date', 'page', 'query'],
  )
  assert.equal(rows.length, 2)
  const merged = rows.find((r) => r.date === '2026-10-01')
  assert.equal(merged.page, '/')
  assert.equal(merged.url, 'https://pilatesphysics.com/')
  assert.equal(merged.clicks, 4)
  assert.equal(merged.impressions, 40)
  assert.equal(merged.ctr, 0.1)
  assert.equal(merged.position, 7)
})

test('toDailyRows writes page totals with an empty query', () => {
  const [row] = toDailyRows([{ keys: ['2026-10-01', 'https://pilatesphysics.com/blog'], clicks: 0, impressions: 2, ctr: 0, position: 12 }], ['date', 'page'])
  assert.equal(row.query, '')
  assert.equal(row.page, '/blog')
})

test('windows cover a range exactly; dayOffset counts back in UTC', () => {
  assert.deepEqual(windows('2026-01-01', '2026-01-10', 4), [
    ['2026-01-01', '2026-01-04'],
    ['2026-01-05', '2026-01-08'],
    ['2026-01-09', '2026-01-10'],
  ])
  assert.deepEqual(windows('2026-01-01', '2026-01-01', 30), [['2026-01-01', '2026-01-01']])
  assert.equal(dayOffset(1, new Date('2026-09-24T03:00:00Z')), '2026-09-23')
  assert.equal(dayOffset(3, new Date('2026-09-01T00:00:00Z')), '2026-08-29')
})

test('indexFindings: silent when indexed, error on FAIL, Substack canonical named', () => {
  const at = new Date('2026-10-14T00:00:00Z')
  const ok = toIndexStatusRow('/blog', `${ORIGIN}/blog`, { indexStatusResult: { verdict: 'PASS' } }, at)
  assert.deepEqual(indexFindings([ok], ORIGIN), [])

  const fail = toIndexStatusRow('/x', `${ORIGIN}/x`, { indexStatusResult: { verdict: 'FAIL', coverageState: 'Not found (404)' } }, at)
  assert.equal(indexFindings([fail], ORIGIN)[0].severity, 'error')

  const mirror = toIndexStatusRow('/blog/springs', `${ORIGIN}/blog/springs`, {
    indexStatusResult: { verdict: 'NEUTRAL', coverageState: 'Alternate page with proper canonical tag', googleCanonical: 'https://kaleen.substack.com/p/springs' },
  }, at)
  const [f] = indexFindings([mirror], ORIGIN)
  assert.equal(f.severity, 'warn')
  assert.match(f.detail, /a different host/)
  assert.match(f.fix, /Substack/)
})

test('parseServiceAccount validates and unescapes the key', () => {
  assert.throws(() => parseServiceAccount('{'), /not valid JSON/)
  assert.throws(() => parseServiceAccount('{"client_email":"a"}'), /missing/)
  const sa = parseServiceAccount(JSON.stringify({ client_email: 'a@b', private_key: 'line1\\nline2' }))
  assert.equal(sa.private_key, 'line1\nline2')
})

test('signAssertion produces an RS256 JWT the public key verifies', () => {
  const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
  const pem = privateKey.export({ type: 'pkcs8', format: 'pem' })
  const jwt = signAssertion({ client_email: 'svc@example.iam.gserviceaccount.com', private_key: pem }, 1_000)
  const [h, c, s] = jwt.split('.')
  assert.deepEqual(JSON.parse(Buffer.from(h, 'base64url')), { alg: 'RS256', typ: 'JWT' })
  const claims = JSON.parse(Buffer.from(c, 'base64url'))
  assert.equal(claims.iss, 'svc@example.iam.gserviceaccount.com')
  assert.equal(claims.exp - claims.iat, 3600)
  const ok = createVerify('RSA-SHA256').update(`${h}.${c}`).verify(publicKey, Buffer.from(s, 'base64url'))
  assert.equal(ok, true)
})
