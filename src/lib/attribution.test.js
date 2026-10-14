import { test } from 'node:test'
import assert from 'node:assert/strict'
import { cleanValue, parseTouch, redactPath, referrerHost, touchFromPageLoad } from './attribution.js'

const NOW = new Date('2026-10-14T18:00:00Z')

test('redactPath keeps slugs and redacts tokens, emails and uuids', () => {
  assert.equal(redactPath('/blog/springs-are-not-one-weight-2026'), '/blog/springs-are-not-one-weight-2026')
  assert.equal(redactPath('/auth/AbC123XyZ789LmNoPq'), '/auth/:redacted')
  assert.equal(redactPath('/x/someone@example.com'), '/x/:redacted')
  assert.equal(redactPath('/u/3fa85f64-5717-4562-b3fc-2c963f66afa6'), '/u/:redacted')
  assert.equal(redactPath(''), '/')
})

test('cleanValue drops empties, credentials and long ids', () => {
  assert.equal(cleanValue('  '), null)
  assert.equal(cleanValue('oct-launch'), 'oct-launch')
  assert.equal(cleanValue('eyJhbGciOi.JIUzI1NiJ9'), null)
  assert.equal(cleanValue('Ab1'.repeat(12)), null)
})

test('referrerHost strips www and rejects non-http schemes', () => {
  assert.equal(referrerHost('https://www.instagram.com/p/abc'), 'instagram.com')
  assert.equal(referrerHost('android-app://com.google.android.gm'), null)
  assert.equal(referrerHost('not a url'), null)
  assert.equal(referrerHost(''), null)
})

test('touchFromPageLoad treats our own hosts and flow hosts as no source', () => {
  const own = touchFromPageLoad('https://pilatesphysics.com/blog', 'https://www.pilatesphysics.com/', NOW)
  assert.equal(own.touch.referrer_host, null)
  assert.equal(own.hasSource, false)

  const stripe = touchFromPageLoad('https://pilatesphysics.com/workshops/x/success', 'https://checkout.stripe.com/', NOW)
  assert.equal(stripe.hasSource, false)

  const kit = touchFromPageLoad('https://pilatesphysics.com/subscription-confirmed', 'https://pilates-physics.kit.com/', NOW)
  assert.equal(kit.hasSource, false)
})

test('touchFromPageLoad records an external referrer or any utm as a source', () => {
  const ig = touchFromPageLoad('https://pilatesphysics.com/spring-calculator', 'https://l.instagram.com/', NOW)
  assert.equal(ig.touch.referrer_host, 'l.instagram.com')
  assert.equal(ig.touch.landing_path, '/spring-calculator')
  assert.equal(ig.hasSource, true)

  const utm = touchFromPageLoad('https://pilatesphysics.com/?utm_source=kit&utm_campaign=cart-close&t=SECRET', '', NOW)
  assert.equal(utm.touch.utm_source, 'kit')
  assert.equal(utm.touch.utm_campaign, 'cart-close')
  assert.equal(utm.touch.landing_path, '/')
  assert.equal(utm.hasSource, true)
  assert.equal(utm.touch.at, NOW.toISOString())
})

test('parseTouch re-validates user-editable storage', () => {
  assert.equal(parseTouch(null), null)
  assert.equal(parseTouch('{'), null)
  assert.equal(parseTouch(JSON.stringify({ at: 'bad', landing_path: '/' })), null)
  assert.equal(parseTouch(JSON.stringify({ at: NOW.toISOString(), landing_path: 'nope' })), null)
  const ok = parseTouch(
    JSON.stringify({ at: NOW.toISOString(), landing_path: '/blog', referrer_host: 'Google.com', utm_source: 'x' }),
  )
  assert.equal(ok.referrer_host, 'google.com')
  assert.equal(ok.utm_source, 'x')
  assert.equal(ok.utm_term, null)
})
