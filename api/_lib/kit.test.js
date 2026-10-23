import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildSubscriberFilter } from './kit.js'

const PP = 24917743
const brand = { type: 'tag', ids: [PP] }

test('no tags picked still scopes to pp-emails, never the whole account', () => {
  assert.deepEqual(buildSubscriberFilter([], 'any', PP), [{ all: [brand], any: null, none: null }])
  assert.deepEqual(buildSubscriberFilter(undefined, undefined, PP), [{ all: [brand], any: null, none: null }])
})

test('"any" match ANDs pp-emails with any of the picked tags', () => {
  assert.deepEqual(buildSubscriberFilter([1, '2'], 'any', PP), [
    { all: [brand], any: [{ type: 'tag', ids: [1, 2] }], none: null },
  ])
})

test('"all" match requires pp-emails and every picked tag', () => {
  assert.deepEqual(buildSubscriberFilter([1, 2], 'all', PP), [
    { all: [brand, { type: 'tag', ids: [1, 2] }], any: null, none: null },
  ])
})
