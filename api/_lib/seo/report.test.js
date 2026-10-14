import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildPageRows, buildSearch, groupFindings, narrativeSearch } from './report.js'
import { narrativeCostUsd, normaliseNarrative } from './narrative.js'
import { sitemapLocs } from './crawl.js'

const rows = [
  { date: '2026-10-01', page: '/', query: '', clicks: 2, impressions: 20, position: 10 },
  { date: '2026-10-02', page: '/', query: '', clicks: 1, impressions: 20, position: 6 },
  { date: '2026-10-01', page: '/blog/springs', query: '', clicks: 0, impressions: 5, position: 30 },
  { date: '2026-10-01', page: '/', query: 'pilates physics', clicks: 2, impressions: 15, position: 2 },
  { date: '2026-10-02', page: '/', query: 'pilates physics', clicks: 1, impressions: 5, position: 4 },
  { date: '2026-10-01', page: '/blog/springs', query: 'reformer springs', clicks: 0, impressions: 3, position: 30 },
]

test('buildSearch splits queries, page totals and the daily series', () => {
  const s = buildSearch(rows, [{ id: 7, started_at: '2026-10-02T09:00:00Z' }])
  assert.deepEqual(s.queries.map((q) => q.query), ['pilates physics', 'reformer springs'])
  assert.equal(s.queries[0].impressions, 20)
  assert.equal(s.queries[0].position, 2.5)
  assert.deepEqual(s.pages.map((p) => [p.page, p.impressions]), [['/', 40], ['/blog/springs', 5]])
  assert.equal(s.pages[0].position, 8)
  assert.deepEqual(s.daily, [
    { date: '2026-10-01', clicks: 2, impressions: 25 },
    { date: '2026-10-02', clicks: 1, impressions: 20 },
  ])
  assert.deepEqual(s.runs, [{ id: 7, date: '2026-10-02' }])
})

test('buildPageRows joins sources and leaves missing ones null', () => {
  const out = buildPageRows({
    visitors: [{ page: '/blog/springs', visitors: 9, pageviews: 12 }],
    entries: null,
    leads: { byPage: [{ page: '/blog/springs', leads: 2 }] },
    search: [{ page: '/', clicks: 3, impressions: 40, position: 8 }],
  })
  assert.deepEqual(out.map((r) => r.page), ['/blog/springs', '/'])
  assert.equal(out[0].leads, 2)
  assert.equal(out[0].entries, null)
  assert.equal(out[1].visitors, null)
})

test('groupFindings drops dismissed pairs and sums visitors over every path', () => {
  const groups = groupFindings(
    [
      { rule_id: 'head.title_length', severity: 'warn', path: '/', title: 't', source_files: [] },
      { rule_id: 'head.title_length', severity: 'warn', path: '/about', title: 't', source_files: [] },
      { rule_id: 'prerender.body_empty', severity: 'info', path: null, title: 'b', evidence: { paths: ['/', '/help'] } },
    ],
    [{ rule_id: 'head.title_length', path: '/about' }],
    { '/': 10, '/help': 3, '/about': 50 },
  )
  const byId = Object.fromEntries(groups.map((g) => [g.rule_id, g]))
  assert.deepEqual(byId['head.title_length'].paths, ['/'])
  assert.equal(byId['head.title_length'].visitors_30d, 10)
  assert.equal(byId['prerender.body_empty'].visitors_30d, 13)
})

test('narrativeSearch is null without rows and rounds positions', () => {
  assert.equal(narrativeSearch([], 90), null)
  const s = narrativeSearch(rows, 90)
  assert.equal(s.total_impressions, 45)
  assert.equal(s.queries[0].position, 2.5)
})

test('narrative cost at Opus 5.5 list price and limits enforced', () => {
  assert.equal(narrativeCostUsd({ input_tokens: 10_000, output_tokens: 5_000 }), 0.14)
  const out = normaliseNarrative({ summary: 's', top_changes: [1, 2, 3, 4], rewrites: [], content_ideas: [], caveats: [] })
  assert.equal(out.top_changes.length, 3)
  assert.throws(() => normaliseNarrative({ summary: 's', top_changes: [] }), /no changes/)
})

test('sitemapLocs keeps on-host paths and decodes them', () => {
  const xml = '<urlset><url><loc>https://pilatesphysics.com/</loc></url><url><loc>https://pilatesphysics.com/blog/a%20b</loc></url><url><loc>https://other.test/x</loc></url></urlset>'
  assert.deepEqual(sitemapLocs(xml, 'https://pilatesphysics.com'), {
    urls: ['https://pilatesphysics.com/', 'https://pilatesphysics.com/blog/a%20b', 'https://other.test/x'],
    paths: ['/', '/blog/a b'],
    offHost: ['https://other.test/x'],
  })
})
