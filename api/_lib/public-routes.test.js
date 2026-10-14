import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { PUBLIC_ROUTES, isExcludedRoute } from './public-routes.js'

const here = path.dirname(fileURLToPath(import.meta.url))
const appSource = readFileSync(path.join(here, '..', '..', 'src', 'App.jsx'), 'utf8')

// Every string literal passed as a Route path prop.
const routesInApp = [...appSource.matchAll(/path="([^"]+)"/g)].map((m) => m[1])

test('App.jsx declares at least the routes we expect to find', () => {
  assert.ok(routesInApp.includes('/'), 'the root route was not found; did App.jsx change shape?')
  assert.ok(routesInApp.length > 20)
})

test('every route in App.jsx is either public or explicitly excluded', () => {
  const unclassified = routesInApp.filter(
    (p) => !PUBLIC_ROUTES.includes(p) && !isExcludedRoute(p),
  )
  assert.deepEqual(
    unclassified,
    [],
    `Add these to PUBLIC_ROUTES or EXCLUDED_ROUTE_PATTERNS in api/_lib/public-routes.js: ${unclassified.join(', ')}`,
  )
})

test('every PUBLIC_ROUTES entry is a real route in App.jsx', () => {
  const missing = PUBLIC_ROUTES.filter((p) => !routesInApp.includes(p))
  assert.deepEqual(missing, [], `Not routed in App.jsx: ${missing.join(', ')}`)
})

test('no PUBLIC_ROUTES entry is also excluded', () => {
  const both = PUBLIC_ROUTES.filter(isExcludedRoute)
  assert.deepEqual(both, [])
})

test('PUBLIC_ROUTES has no duplicates and no dynamic segments', () => {
  assert.equal(new Set(PUBLIC_ROUTES).size, PUBLIC_ROUTES.length)
  assert.deepEqual(PUBLIC_ROUTES.filter((p) => p.includes(':') || p.includes('*')), [])
})
