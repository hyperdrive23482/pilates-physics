import Anthropic from '@anthropic-ai/sdk'
import { postHogFromEnv } from '../posthog.js'
import { crawlSite, sitemapLocs } from './crawl.js'
import { psiFindings, psiSummary, runRules } from './rules.js'
import { dayOffset, indexFindings, toDailyRows, toIndexStatusRow, windows } from './gsc.js'
import {
  NARRATIVE_MODEL,
  NARRATIVE_SCHEMA,
  NARRATIVE_SYSTEM,
  buildNarrativeUserMessage,
  narrativeCostUsd,
  normaliseNarrative,
} from './narrative.js'
import { entriesByPath, leadFirstPage, visitorsByPath } from './traffic.js'
import {
  buildPageRows,
  buildSearch,
  countSeverities,
  findingRows,
  groupFindings,
  narrativeSearch,
  pageRows,
  pageTotals,
} from './report.js'

// Everything the SEO page and its crons do against the database. Ported from
// remo's admin-seo, seo-audit and seo-search-sync edge functions, collapsed
// into one module because here they all run as Vercel functions with the
// service role: api/admin/seo.js (admin gated) and api/cron/seo-*.js.
//
// Every job runs inline. The slowest (a PageSpeed run, a 16 month backfill,
// the written recommendations) fits the 300 s maxDuration both routes get.

export const DEFAULT_ORIGIN = 'https://pilatesphysics.com'
export const siteOrigin = (env = process.env) => (env.SEO_SITE_ORIGIN ?? DEFAULT_ORIGIN).replace(/\/$/, '')

const RUN_COLUMNS =
  'id, started_at, finished_at, triggered_by, site_origin, status, error, pages_crawled, errors, warnings, infos, psi_pages, narrative_cost_usd'
/** Runs older than this are dropped after each crawl; findings cascade. */
const RETENTION_DAYS = 180
/** Search Console keeps 16 months; the cache never reads more than this. */
const SEARCH_ROW_CAP = 50_000
const PSI_TIMEOUT_MS = 150_000
const SYNC_DEFAULT_DAYS = 3
const SYNC_MAX_DAYS = 120
const BACKFILL_DAYS = 16 * 30
const BACKFILL_WINDOW = 30
/** Google's data ends two to three days back; asking up to yesterday is safe. */
const LAG_DAYS = 1
const UPSERT_CHUNK = 500
const INSPECT_MAX = 80
const NARRATIVE_SEARCH_DAYS = 90
const NARRATIVE_MAX_TOKENS = 16000

const DAY_MS = 86_400_000
const day = (iso) => iso.slice(0, 10)

function must({ data, error }, what) {
  if (error) throw new Error(`${what}: ${error.message}`)
  return data
}

async function latestDoneRun(supabase, columns = 'id') {
  const { data } = await supabase
    .from('seo_audit_runs')
    .select(columns)
    .eq('status', 'done')
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  return data ?? null
}

// ─── Crawl ──────────────────────────────────────────────────────────────────

export async function runCrawl(supabase, origin, trigger) {
  const t0 = performance.now()
  const run = must(
    await supabase.from('seo_audit_runs').insert({ triggered_by: trigger, site_origin: origin, status: 'running' }).select('id').single(),
    'Could not start a run',
  )
  const runId = run.id

  try {
    const site = await crawlSite(origin)
    const findings = runRules(site)
    const counts = countSeverities(findings)
    if (findings.length) must(await supabase.from('seo_audit_findings').insert(findingRows(runId, findings, 'raw')), 'Could not store findings')

    must(
      await supabase
        .from('seo_audit_runs')
        .update({
          status: 'done',
          finished_at: new Date().toISOString(),
          pages_crawled: site.pages.length,
          ...counts,
          site: {
            robotsOk: site.robotsTxt !== null,
            sitemapOk: site.sitemap.ok,
            sitemapCount: site.sitemap.urls.length,
            offHost: site.sitemap.offHost,
            imageChecks: site.imageChecks,
          },
          pages: pageRows(site),
        })
        .eq('id', runId),
      'Could not finish the run',
    )

    const cutoff = new Date(Date.now() - RETENTION_DAYS * DAY_MS).toISOString()
    await supabase.from('seo_audit_runs').delete().lt('started_at', cutoff)

    return { ok: true, run_id: runId, pages: site.pages.length, ...counts, ms: Math.round(performance.now() - t0) }
  } catch (e) {
    // A failed run never stays `running`.
    await supabase
      .from('seo_audit_runs')
      .update({ status: 'failed', finished_at: new Date().toISOString(), error: e.message ?? String(e) })
      .eq('id', runId)
    throw e
  }
}

// ─── PageSpeed ──────────────────────────────────────────────────────────────

async function fetchPsi(origin, path, key) {
  const params = new URLSearchParams({ url: `${origin}${path}`, strategy: 'mobile' })
  if (key) params.set('key', key)
  for (const c of ['performance', 'accessibility', 'best-practices', 'seo']) params.append('category', c)
  const res = await fetch(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${params}`, {
    signal: AbortSignal.timeout(PSI_TIMEOUT_MS),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(body?.error?.message ?? `PageSpeed HTTP ${res.status}`)
  return body
}

/** One path per call: a single PageSpeed run can take over a minute. */
export async function runPsi(supabase, origin, rawPath, env = process.env) {
  const path = typeof rawPath === 'string' && /^\/[^\s?#]*$/.test(rawPath) ? rawPath : null
  if (!path) throw new Error('path must be one root-relative path')
  const run = await latestDoneRun(supabase, 'id, psi')
  if (!run) throw new Error('No finished audit run to attach PageSpeed results to. Run the audit first.')

  const t0 = performance.now()
  // PAGESPEED_API_KEY is optional; without one Google applies a low shared quota.
  const response = await fetchPsi(origin, path, env.PAGESPEED_API_KEY)
  const findings = psiFindings(path, response)
  const summary = psiSummary(response)

  await supabase.from('seo_audit_findings').delete().eq('run_id', run.id).eq('mode', 'psi').eq('path', path)
  if (findings.length) must(await supabase.from('seo_audit_findings').insert(findingRows(run.id, findings, 'psi')), 'Could not store PageSpeed findings')
  const merged = { ...(run.psi ?? {}), [path]: { ...summary, checkedAt: new Date().toISOString() } }
  must(await supabase.from('seo_audit_runs').update({ psi: merged, psi_pages: Object.keys(merged).length }).eq('id', run.id), 'Could not store the PageSpeed summary')

  return { ok: true, run_id: run.id, path, summary, findings: findings.length, ms: Math.round(performance.now() - t0) }
}

// ─── Search Console ─────────────────────────────────────────────────────────

async function upsertSearchRows(supabase, rows) {
  const syncedAt = new Date().toISOString()
  for (let i = 0; i < rows.length; i += UPSERT_CHUNK) {
    const chunk = rows.slice(i, i + UPSERT_CHUNK).map((r) => ({ ...r, synced_at: syncedAt }))
    must(await supabase.from('seo_search_daily').upsert(chunk, { onConflict: 'date,page,query' }), 'seo_search_daily upsert failed')
  }
}

/** Last `days` days (default 3: Google restates recent days), or 16 months. */
export async function runSync(supabase, gsc, { days, backfill = false } = {}) {
  const t0 = performance.now()
  const n = backfill
    ? BACKFILL_DAYS
    : Math.min(Math.max(Math.floor(typeof days === 'number' ? days : SYNC_DEFAULT_DAYS), 1), SYNC_MAX_DAYS)
  const endDate = dayOffset(LAG_DAYS)
  const startDate = dayOffset(LAG_DAYS + n - 1)
  const spans = windows(startDate, endDate, BACKFILL_WINDOW)

  let queryRows = 0
  let totalRows = 0
  let newest = null
  for (const [start, end] of spans) {
    const [byQuery, byPage] = await Promise.all([
      gsc.searchAnalytics(start, end, ['date', 'page', 'query']),
      gsc.searchAnalytics(start, end, ['date', 'page']),
    ])
    const rows = [...toDailyRows(byQuery, ['date', 'page', 'query']), ...toDailyRows(byPage, ['date', 'page'])]
    for (const r of rows) if (!newest || r.date > newest) newest = r.date
    queryRows += byQuery.length
    totalRows += byPage.length
    await upsertSearchRows(supabase, rows)
  }
  return {
    ok: true,
    backfill,
    window: { start: startDate, end: endDate },
    windows: spans.length,
    query_rows: queryRows,
    total_rows: totalRows,
    newest_date: newest,
    ms: Math.round(performance.now() - t0),
  }
}

async function sitemapPaths(supabase, origin) {
  const run = await latestDoneRun(supabase, 'id, pages')
  if (run?.pages?.length) return { runId: run.id, paths: run.pages.filter((p) => p.inSitemap).map((p) => p.path) }
  const res = await fetch(`${origin}/sitemap.xml`)
  if (!res.ok) throw new Error(`No audit run to take sitemap paths from, and ${origin}/sitemap.xml answered ${res.status}`)
  return { runId: null, paths: sitemapLocs(await res.text(), origin).paths }
}

/** URL Inspection for every sitemap path; not-indexed pages become findings. */
export async function runInspect(supabase, gsc, origin) {
  const t0 = performance.now()
  const { runId, paths } = await sitemapPaths(supabase, origin)
  const targets = [...new Set(paths)].slice(0, INSPECT_MAX)

  const rows = []
  const failures = []
  // Four at a time keeps a full pass inside the function limit and well under
  // Google's per-minute quota.
  for (let i = 0; i < targets.length; i += 4) {
    await Promise.all(
      targets.slice(i, i + 4).map(async (path) => {
        const url = `${origin}${path === '/' ? '/' : encodeURI(path)}`
        try {
          rows.push(toIndexStatusRow(path, url, await gsc.inspect(url)))
        } catch (e) {
          failures.push({ path, error: e.message ?? String(e) })
        }
      }),
    )
  }
  if (rows.length) must(await supabase.from('seo_index_status').upsert(rows, { onConflict: 'path' }), 'seo_index_status upsert failed')

  let findings = 0
  if (runId !== null) {
    const list = indexFindings(rows, origin)
    await supabase.from('seo_audit_findings').delete().eq('run_id', runId).eq('mode', 'gsc')
    if (list.length) must(await supabase.from('seo_audit_findings').insert(findingRows(runId, list, 'gsc')), 'Could not store index findings')
    findings = list.length
  }
  const indexed = rows.filter((r) => r.verdict === 'PASS').length
  return {
    ok: true,
    run_id: runId,
    inspected: rows.length,
    indexed,
    not_indexed: rows.length - indexed,
    findings,
    failures,
    ms: Math.round(performance.now() - t0),
  }
}

// ─── Reads ──────────────────────────────────────────────────────────────────

async function searchRows(supabase, fromDay, toDay, onlyTotals) {
  let q = supabase
    .from('seo_search_daily')
    .select('date, page, query, url, clicks, impressions, ctr, position')
    .lte('date', toDay)
    .limit(SEARCH_ROW_CAP)
  if (fromDay) q = q.gte('date', fromDay)
  if (onlyTotals) q = q.eq('query', '')
  return must(await q, 'Search Console cache read failed') ?? []
}

async function searchState(supabase) {
  const [{ data: newest }, { data: oldest }, { count }, { count: inspected }] = await Promise.all([
    supabase.from('seo_search_daily').select('date, synced_at').order('date', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('seo_search_daily').select('date').order('date', { ascending: true }).limit(1).maybeSingle(),
    supabase.from('seo_search_daily').select('date', { count: 'exact', head: true }),
    supabase.from('seo_index_status').select('path', { count: 'exact', head: true }),
  ])
  return {
    newest_date: newest?.date ?? null,
    oldest_date: oldest?.date ?? null,
    last_synced_at: newest?.synced_at ?? null,
    rows: count ?? 0,
    inspected_paths: inspected ?? 0,
  }
}

export function configState(env = process.env) {
  return {
    gsc: Boolean(env.GSC_SERVICE_ACCOUNT_JSON && env.GSC_PROPERTY),
    posthog: Boolean(env.POSTHOG_API_KEY && env.POSTHOG_PROJECT_ID),
    pagespeed_key: Boolean(env.PAGESPEED_API_KEY),
    anthropic: Boolean(env.ANTHROPIC_API_KEY),
  }
}

export async function overview(supabase) {
  const [{ data: latest }, latestDone, search] = await Promise.all([
    supabase.from('seo_audit_runs').select(RUN_COLUMNS).order('started_at', { ascending: false }).limit(1).maybeSingle(),
    latestDoneRun(supabase, RUN_COLUMNS),
    searchState(supabase),
  ])
  return { ok: true, latest: latest ?? null, latest_done: latestDone, search, config: configState() }
}

/** PostHog context, or the reason it is unavailable. */
function posthog() {
  const r = postHogFromEnv()
  return r.error ? { error: r.error } : { ph: r.client, host: r.prodHost }
}

async function visitors30d() {
  const ctx = posthog()
  if (ctx.error) return { visitors: {}, error: ctx.error }
  try {
    const to = new Date()
    const rows = await visitorsByPath(ctx.ph, ctx.host, new Date(to.getTime() - 30 * DAY_MS).toISOString(), to.toISOString())
    return { visitors: Object.fromEntries(rows.map((r) => [r.page, r.visitors])), error: null }
  } catch (e) {
    return { visitors: {}, error: e.message ?? String(e) }
  }
}

export async function findings(supabase, runIdRaw) {
  const runId = Number.isInteger(runIdRaw) ? runIdRaw : null
  const q = supabase.from('seo_audit_runs').select(`${RUN_COLUMNS}, site, pages, psi, narrative`)
  const { data: run } =
    runId !== null
      ? await q.eq('id', runId).maybeSingle()
      : await q.eq('status', 'done').order('started_at', { ascending: false }).limit(1).maybeSingle()
  if (!run) return { ok: true, run: null, findings: [], dismissals: [], index_status: {}, visitors: {}, posthog_error: null }

  const [rows, dismissals, indexRows, traffic] = await Promise.all([
    supabase
      .from('seo_audit_findings')
      .select('id, rule_id, severity, path, title, detail, evidence, fix, source_files, mode')
      .eq('run_id', run.id)
      .then((r) => must(r, 'Findings read failed')),
    supabase.from('seo_finding_dismissals').select('rule_id, path, reason, dismissed_at').then((r) => r.data ?? []),
    supabase
      .from('seo_index_status')
      .select('path, inspected_at, verdict, coverage_state, indexing_state, google_canonical, last_crawl')
      .then((r) => r.data ?? []),
    visitors30d(),
  ])
  return {
    ok: true,
    run,
    findings: rows ?? [],
    dismissals,
    index_status: Object.fromEntries(indexRows.map((r) => [r.path, r])),
    visitors: traffic.visitors,
    posthog_error: traffic.error,
  }
}

export async function pages(supabase, range) {
  const ctx = posthog()
  let posthogError = ctx.error ?? null
  let visitors = null
  let entries = null
  let leads = null
  if (!ctx.error) {
    try {
      ;[visitors, entries, leads] = await Promise.all([
        visitorsByPath(ctx.ph, ctx.host, range.from, range.to),
        entriesByPath(ctx.ph, ctx.host, range.from, range.to),
        leadFirstPage(ctx.ph, ctx.host, range.from, range.to),
      ])
    } catch (e) {
      posthogError = e.message ?? String(e)
    }
  }
  let search = null
  let searchError = null
  try {
    search = pageTotals(await searchRows(supabase, range.from_day, day(range.to), true))
  } catch (e) {
    searchError = e.message ?? String(e)
  }
  return {
    ok: true,
    range: { range: range.range, from: range.from, to: range.to },
    rows: buildPageRows({ visitors, entries, leads, search }),
    leads_measured: leads?.measured ?? null,
    posthog_error: posthogError,
    search_error: searchError,
    search_available: (search?.length ?? 0) > 0,
  }
}

export async function search(supabase, range) {
  const rows = await searchRows(supabase, range.from_day, day(range.to), false)
  let runsQ = supabase.from('seo_audit_runs').select('id, started_at').eq('status', 'done').lt('started_at', range.to)
  if (range.from) runsQ = runsQ.gte('started_at', range.from)
  const { data: runs } = await runsQ
  return {
    ok: true,
    range: { range: range.range, from: range.from, to: range.to },
    ...buildSearch(rows, runs ?? []),
    state: await searchState(supabase),
    capped: rows.length >= SEARCH_ROW_CAP,
  }
}

export async function setDismissal(supabase, body, userId, on) {
  const ruleId = typeof body.rule_id === 'string' ? body.rule_id.trim() : ''
  const path = typeof body.path === 'string' ? body.path : ''
  if (!ruleId || ruleId.length > 100 || path.length > 500) throw new Error('rule_id is required')
  if (on) {
    const reason = typeof body.reason === 'string' ? body.reason.trim().slice(0, 500) || null : null
    must(
      await supabase
        .from('seo_finding_dismissals')
        .upsert({ rule_id: ruleId, path, reason, dismissed_by: userId, dismissed_at: new Date().toISOString() }),
      'Could not save the dismissal',
    )
  } else {
    must(await supabase.from('seo_finding_dismissals').delete().eq('rule_id', ruleId).eq('path', path), 'Could not remove the dismissal')
  }
  return { ok: true }
}

// ─── Written recommendations ────────────────────────────────────────────────

/**
 * Assembles everything the model sees, calls it, stores the answer on the
 * latest run. Not a cron: it costs money, and its most useful input (queries)
 * only changes daily.
 */
export async function recommend(supabase, origin, userId, env = process.env) {
  if (!env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY is not configured')
  const t0 = performance.now()
  const run = await latestDoneRun(supabase, 'id, site_origin, pages')
  if (!run) throw new Error('No finished audit run to write recommendations for. Run the audit first.')

  const now = new Date()
  const from30 = new Date(now.getTime() - 30 * DAY_MS).toISOString()
  const from90 = day(new Date(now.getTime() - NARRATIVE_SEARCH_DAYS * DAY_MS).toISOString())

  const [rows, dismissals, indexRows] = await Promise.all([
    supabase.from('seo_audit_findings').select('rule_id, severity, path, title, detail, evidence, fix, source_files').eq('run_id', run.id).then((r) => r.data ?? []),
    supabase.from('seo_finding_dismissals').select('rule_id, path').then((r) => r.data ?? []),
    supabase.from('seo_index_status').select('path, verdict, coverage_state, google_canonical').then((r) => r.data ?? []),
  ])

  // Traffic is best effort, as everywhere else on the page.
  const ctx = posthog()
  let visitors = []
  let entries = []
  let leads = { byPage: [] }
  let trafficAvailable = false
  if (!ctx.error) {
    try {
      ;[visitors, entries, leads] = await Promise.all([
        visitorsByPath(ctx.ph, ctx.host, from30, now.toISOString()),
        entriesByPath(ctx.ph, ctx.host, from30, now.toISOString()),
        leadFirstPage(ctx.ph, ctx.host, from30, now.toISOString()),
      ])
      trafficAvailable = true
    } catch (e) {
      console.error('seo recommend: PostHog', e)
    }
  }
  const visitorsOf = Object.fromEntries(visitors.map((v) => [v.page, v.visitors]))

  const pageList = (run.pages ?? []).map((p) => ({
    path: p.path,
    title: p.title,
    description: p.description,
    body_in_html: !p.isShell,
    in_sitemap: p.inSitemap,
  }))
  const traffic = trafficAvailable
    ? pageList
        .map((p) => ({
          page: p.path,
          visitors: visitorsOf[p.path] ?? 0,
          entries: entries.find((e) => e.page === p.path)?.entries ?? 0,
          organic_entries: entries.find((e) => e.page === p.path)?.organic ?? 0,
          leads_first_page: leads.byPage.find((l) => l.page === p.path)?.leads ?? 0,
        }))
        .filter((t) => t.visitors > 0 || t.entries > 0)
    : null

  let searchBlock = null
  try {
    searchBlock = narrativeSearch(await searchRows(supabase, from90, day(now.toISOString()), false), NARRATIVE_SEARCH_DAYS)
  } catch (e) {
    console.error('seo recommend: search cache', e)
  }

  const input = {
    origin: run.site_origin ?? origin,
    generatedAt: day(now.toISOString()),
    findings: groupFindings(rows, dismissals, visitorsOf),
    pages: pageList,
    traffic,
    search: searchBlock,
    index_status: indexRows,
  }

  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })
  // Opus 5.5 rejects forced tool_choice, so the JSON comes from structured
  // output. Refusal fallback is on: a classifier false positive reruns on the
  // model the API picks instead of failing the button.
  const response = await client.messages.create(
    {
      model: NARRATIVE_MODEL,
      max_tokens: NARRATIVE_MAX_TOKENS,
      system: NARRATIVE_SYSTEM,
      messages: [{ role: 'user', content: buildNarrativeUserMessage(input) }],
      output_config: { effort: 'high', format: { type: 'json_schema', schema: NARRATIVE_SCHEMA } },
      fallbacks: 'default',
    },
    { headers: { 'anthropic-beta': 'server-side-fallback-2026-07-01' }, timeout: 280_000 },
  )

  if (response.stop_reason === 'refusal') {
    const d = response.stop_details
    throw new Error(`The model declined to answer${d?.category ? ` (${d.category})` : ''}${d?.explanation ? `: ${d.explanation}` : '.'}`)
  }
  if (response.stop_reason === 'max_tokens') throw new Error('The recommendations were cut off (max_tokens). Try again.')

  const text = response.content.filter((b) => b.type === 'text').map((b) => b.text).join('')
  let parsed
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error('The model answered with something other than the expected JSON.')
  }
  const output = normaliseNarrative(parsed)

  const costUsd = narrativeCostUsd(response.usage)
  const narrative = {
    generated_at: now.toISOString(),
    generated_by: userId,
    model: response.model ?? NARRATIVE_MODEL,
    run_id: run.id,
    input_counts: {
      findings: input.findings.length,
      pages: pageList.length,
      traffic_rows: traffic?.length ?? 0,
      queries: searchBlock?.queries.length ?? 0,
    },
    usage: response.usage,
    cost_usd: costUsd,
    output,
  }
  must(await supabase.from('seo_audit_runs').update({ narrative, narrative_cost_usd: costUsd }).eq('id', run.id), 'Could not store the recommendations')
  return { ok: true, run_id: run.id, narrative, ms: Math.round(performance.now() - t0) }
}
