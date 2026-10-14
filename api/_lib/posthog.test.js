import { test } from 'node:test'
import assert from 'node:assert/strict'
import { PUBLIC_ROUTES } from './public-routes.js'
import {
  CONTENT_ENTRY,
  CONTENT_EVENT,
  CONTENT_PATHS,
  RETIRED_PATHS,
  mapUsersToPersons,
  postHogFromEnv,
  quote,
  toClickHouse,
} from './posthog.js'

test('CONTENT_PATHS carries every public route, so the sitemap and the traffic filter cannot drift', () => {
  for (const route of PUBLIC_ROUTES) assert.ok(CONTENT_PATHS.includes(route), `${route} missing from CONTENT_PATHS`)
  for (const route of RETIRED_PATHS) assert.ok(CONTENT_PATHS.includes(route), `${route} missing from CONTENT_PATHS`)
  assert.ok(CONTENT_PATHS.includes('/workshops'))
  assert.ok(!CONTENT_PATHS.includes('/login'))
  assert.ok(!CONTENT_PATHS.includes('/portal'))
})

test('the HogQL fragments quote every path and exclude post-purchase success pages', () => {
  assert.ok(CONTENT_EVENT.includes("'/spring-calculator'"))
  assert.ok(CONTENT_EVENT.includes("startsWith(properties.$pathname, '/blog/')"))
  assert.ok(CONTENT_EVENT.includes("NOT endsWith(properties.$pathname, '/success')"))
  assert.ok(CONTENT_ENTRY.includes("startsWith($entry_pathname, '/workshops/')"))
  assert.ok(!CONTENT_ENTRY.includes('properties.$pathname'))
})

test('quote escapes single quotes and backslashes; toClickHouse drops the T and millis', () => {
  assert.equal(quote("o'neil"), "'o''neil'")
  assert.equal(quote('a\\b'), "'a\\\\b'")
  assert.equal(toClickHouse('2026-09-17T12:34:56.000Z'), '2026-09-17 12:34:56')
})

test('postHogFromEnv explains a missing key rather than throwing', () => {
  assert.deepEqual(postHogFromEnv({}), {
    error: 'PostHog is not configured (POSTHOG_API_KEY / POSTHOG_PROJECT_ID are not set).',
  })
  const ok = postHogFromEnv({ POSTHOG_API_KEY: 'phx_1', POSTHOG_PROJECT_ID: 123, POSTHOG_API_HOST: 'https://eu.posthog.com/' })
  assert.equal(ok.prodHost, 'pilatesphysics.com')
  assert.equal(ok.client.host, 'https://eu.posthog.com')
  assert.equal(ok.client.projectId, '123')
})

test('mapUsersToPersons drops non-UUID ids before the query and keeps only UUID persons', async () => {
  const calls = []
  const fake = {
    async query(name, sql) {
      calls.push({ name, sql })
      return [
        ['11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222'],
        ['11111111-1111-4111-8111-111111111111', 'not-a-uuid'],
      ]
    },
  }
  const map = await mapUsersToPersons(fake, ['11111111-1111-4111-8111-111111111111', "x'); DROP TABLE events; --"])
  assert.equal(calls.length, 1)
  assert.ok(!calls[0].sql.includes('DROP'))
  assert.equal(map.get('11111111-1111-4111-8111-111111111111'), '22222222-2222-4222-8222-222222222222')

  assert.equal((await mapUsersToPersons(fake, ['nope'])).size, 0)
  assert.equal(calls.length, 1)
})
