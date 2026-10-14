import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildSitemap } from './sitemap.js'
import { PUBLIC_ROUTES, SITE_URL } from './public-routes.js'

test('lists every public route and every post', () => {
  const xml = buildSitemap([
    { slug: 'a-spring-is-not-one-weight', published_at: '2026-09-01T12:00:00Z', updated_at: '2026-10-02T08:30:00Z' },
    { slug: 'no-updated', published_at: '2026-08-15T12:00:00Z', updated_at: null },
  ])
  assert.ok(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>'))
  for (const route of PUBLIC_ROUTES) {
    assert.ok(xml.includes(`<loc>${SITE_URL}${route}</loc>`), `missing ${route}`)
  }
  assert.ok(xml.includes(`<loc>${SITE_URL}/blog/a-spring-is-not-one-weight</loc>`))
  assert.ok(xml.includes('<lastmod>2026-10-02</lastmod>'), 'lastmod prefers updated_at')
  assert.ok(xml.includes('<lastmod>2026-08-15</lastmod>'), 'lastmod falls back to published_at')
  assert.equal((xml.match(/<url>/g) ?? []).length, PUBLIC_ROUTES.length + 2)
})

test('escapes XML special characters in locations', () => {
  const xml = buildSitemap([{ slug: 'a&b', published_at: '2026-01-01T00:00:00Z' }])
  assert.ok(!xml.includes('a&b<'), 'raw ampersand leaked into XML')
  assert.ok(xml.includes('a%26b'))
})

test('works with no posts at all', () => {
  const xml = buildSitemap([])
  assert.equal((xml.match(/<url>/g) ?? []).length, PUBLIC_ROUTES.length)
})
