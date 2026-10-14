// Pure shaping for the SEO page: Search Console aggregation, the per-page
// report card, and the finding groups the narrative reads. Import free so
// node --test covers it.

const SEP = '\u0000'

function addTo(map, key, r) {
  const a = map.get(key) ?? { clicks: 0, impressions: 0, posWeighted: 0 }
  a.clicks += r.clicks
  a.impressions += r.impressions
  a.posWeighted += r.position * r.impressions
  map.set(key, a)
}

const finish = (a) => ({
  clicks: a.clicks,
  impressions: a.impressions,
  ctr: a.impressions > 0 ? a.clicks / a.impressions : 0,
  position: a.impressions > 0 ? a.posWeighted / a.impressions : 0,
})

/** Per-page Search Console totals from the query = '' rows. */
export function pageTotals(rows) {
  const byPage = new Map()
  for (const r of rows) if (r.query === '') addTo(byPage, r.page, r)
  return [...byPage.entries()].map(([page, a]) => ({ page, ...finish(a) })).sort((a, b) => b.impressions - a.impressions)
}

/**
 * The Search tab: top queries (with the page they rank), per-page totals and
 * a daily series. `runs` are finished audit runs in the window, so the chart
 * can mark them.
 */
export function buildSearch(rows, runs = [], { maxQueries = 500 } = {}) {
  const byQuery = new Map()
  const byDate = new Map()
  for (const r of rows) {
    if (r.query === '') addTo(byDate, r.date, r)
    else addTo(byQuery, `${r.query}${SEP}${r.page}`, r)
  }
  const queries = [...byQuery.entries()]
    .map(([k, a]) => {
      const [query, page] = k.split(SEP)
      return { query, page, ...finish(a) }
    })
    .sort((a, b) => b.impressions - a.impressions || b.clicks - a.clicks)
    .slice(0, maxQueries)
  const daily = [...byDate.entries()]
    .map(([date, a]) => ({ date, clicks: a.clicks, impressions: a.impressions }))
    .sort((a, b) => a.date.localeCompare(b.date))
  return {
    queries,
    pages: pageTotals(rows),
    daily,
    runs: runs.map((r) => ({ id: r.id, date: String(r.started_at).slice(0, 10) })),
  }
}

/**
 * The Pages tab: one row per path, joining PostHog traffic and leads to
 * Search Console totals. Any input may be null when its source is down; the
 * matching columns stay null and the UI shows a dash.
 */
export function buildPageRows({ visitors, entries, leads, search }) {
  const byPage = new Map()
  const row = (page) => {
    let r = byPage.get(page)
    if (!r) {
      r = { page, visitors: null, pageviews: null, entries: null, organic: null, bounces: null, avg_seconds: null, leads: null, clicks: null, impressions: null, position: null }
      byPage.set(page, r)
    }
    return r
  }
  for (const v of visitors ?? []) Object.assign(row(v.page), { visitors: v.visitors, pageviews: v.pageviews })
  for (const e of entries ?? []) {
    Object.assign(row(e.page), { entries: e.entries, organic: e.organic, bounces: e.bounces, avg_seconds: e.avgSeconds })
  }
  for (const l of leads?.byPage ?? []) Object.assign(row(l.page), { leads: l.leads })
  for (const s of search ?? []) Object.assign(row(s.page), { clicks: s.clicks, impressions: s.impressions, position: s.position })
  const n = (v) => Number(v) || 0
  return [...byPage.values()].sort((a, b) => n(b.visitors) - n(a.visitors) || n(b.impressions) - n(a.impressions))
}

/**
 * Open findings grouped by rule, each with every path it touches and the
 * 30-day visitors across them. Shared by the Recommendations ranking (in the
 * browser, the same idea) and the narrative input.
 */
export function groupFindings(findings, dismissals, visitorsByPage = {}) {
  const dismissed = new Set((dismissals ?? []).map((d) => `${d.rule_id}${SEP}${d.path ?? ''}`))
  const groups = new Map()
  for (const f of findings ?? []) {
    if (dismissed.has(`${f.rule_id}${SEP}${f.path ?? ''}`)) continue
    const g = groups.get(f.rule_id) ?? {
      rule_id: f.rule_id,
      severity: f.severity,
      title: f.title,
      detail: f.detail,
      fix: f.fix,
      source_files: f.source_files ?? [],
      paths: [],
      visitors_30d: 0,
    }
    const paths = new Set(g.paths)
    if (f.path) paths.add(f.path)
    const ev = f.evidence?.paths
    if (Array.isArray(ev)) for (const p of ev) if (typeof p === 'string') paths.add(p)
    g.paths = [...paths].sort()
    g.visitors_30d = g.paths.reduce((s, p) => s + (visitorsByPage[p] ?? 0), 0)
    groups.set(f.rule_id, g)
  }
  return [...groups.values()]
}

/** The search block of the narrative input: totals, top queries, per page. */
export function narrativeSearch(rows, days, maxQueries = 40) {
  if (!rows?.length) return null
  const s = buildSearch(rows, [], { maxQueries })
  const round = (x) => Math.round(x * 10) / 10
  return {
    days,
    total_clicks: s.pages.reduce((t, p) => t + p.clicks, 0),
    total_impressions: s.pages.reduce((t, p) => t + p.impressions, 0),
    queries: s.queries.map(({ query, page, clicks, impressions, position }) => ({ query, page, clicks, impressions, position: round(position) })),
    pages: s.pages.map(({ page, clicks, impressions, position }) => ({ page, clicks, impressions, position: round(position) })),
  }
}

/** Counts by severity. */
export function countSeverities(findings) {
  const c = { errors: 0, warnings: 0, infos: 0 }
  for (const f of findings) {
    if (f.severity === 'error') c.errors++
    else if (f.severity === 'warn') c.warnings++
    else c.infos++
  }
  return c
}

/** The per-page rows a run stores: everything the Audit tab needs, no HTML. */
export function pageRows(site) {
  return site.pages.map((p) => ({
    path: p.path,
    status: p.status,
    redirects: p.redirects,
    ms: Math.round(p.ms),
    bytes: p.bytes,
    source: p.source,
    error: p.error ?? null,
    xRobotsTag: p.xRobotsTag,
    title: p.parsed?.title ?? null,
    description: p.parsed?.description ?? null,
    canonical: p.parsed?.canonical ?? null,
    ogImage: p.parsed?.ogImage ?? null,
    ogUrl: p.parsed?.ogUrl ?? null,
    robotsMeta: p.parsed?.robotsMeta ?? null,
    h1Count: p.parsed?.h1Count ?? 0,
    headings: p.parsed?.headings ?? [],
    jsonLd: p.parsed ? { count: p.parsed.jsonLd.count, parsed: p.parsed.jsonLd.parsed, types: p.parsed.jsonLd.types } : null,
    images: p.parsed?.images ?? null,
    internalLinks: p.parsed?.internalLinks.length ?? 0,
    isShell: p.parsed?.isShell ?? false,
    hasOwnHead: p.parsed?.hasOwnHead ?? false,
    inSitemap: site.sitemap.paths.includes(p.path),
  }))
}

export function findingRows(runId, findings, mode) {
  return findings.map((f) => ({
    run_id: runId,
    rule_id: f.ruleId,
    severity: f.severity,
    path: f.path,
    title: f.title,
    detail: f.detail,
    evidence: f.evidence ?? null,
    fix: f.fix,
    source_files: f.sourceFiles,
    mode,
  }))
}
