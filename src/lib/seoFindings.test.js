import { test } from 'node:test'
import assert from 'node:assert/strict'
import { formatDuration, groupFindings, timeAgo } from './seoFindings.js'

const f = (rule_id, severity, path, extra = {}) => ({ id: Math.random(), rule_id, severity, path, title: rule_id, ...extra })

test('groups by rule and ranks traffic-weighted', () => {
  const groups = groupFindings(
    [
      f('head.title_length', 'warn', '/terms'),
      f('head.title_length', 'warn', '/'),
      f('structure.img_alt', 'warn', '/privacy'),
      f('prerender.body_empty', 'info', null, { evidence: { paths: ['/', '/about'] } }),
    ],
    [],
    { '/': 100, '/about': 20 },
  )
  assert.deepEqual(groups.map((g) => g.rule_id), ['head.title_length', 'prerender.body_empty', 'structure.img_alt'])
  assert.deepEqual(groups[0].paths, ['/', '/terms'])
  assert.equal(groups[0].visitors, 100)
  assert.deepEqual(groups[1].paths, ['/', '/about'])
})

test('a group is dismissed only when every finding is', () => {
  const findings = [f('head.title_length', 'warn', '/'), f('head.title_length', 'warn', '/about'), f('robots.missing', 'error', null)]
  const some = groupFindings(findings, [{ rule_id: 'head.title_length', path: '/' }, { rule_id: 'robots.missing', path: '' }])
  const byId = Object.fromEntries(some.map((g) => [g.rule_id, g]))
  assert.equal(byId['head.title_length'].dismissed, false)
  assert.equal(byId['robots.missing'].dismissed, true, "a site-level dismissal is stored with path ''")
})

test('timeAgo and formatDuration', () => {
  const now = Date.parse('2026-10-14T12:00:00Z')
  assert.equal(timeAgo('2026-10-14T11:59:30Z', now), 'just now')
  assert.equal(timeAgo('2026-10-14T09:00:00Z', now), '3 hours ago')
  assert.equal(timeAgo('2026-10-13T12:00:00Z', now), '1 day ago')
  assert.equal(timeAgo(null, now), '—')
  assert.equal(formatDuration(65), '1m 05s')
  assert.equal(formatDuration(42), '42s')
  assert.equal(formatDuration(null), '—')
})
