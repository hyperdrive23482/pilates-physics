import { createSign } from 'node:crypto'
import { sourcesFor } from './rules.js'

// Google Search Console through a service account. Ported from remo's
// supabase/functions/_shared/gsc.ts, with the JWT signed by Node's crypto
// instead of WebCrypto.
//
// WHY A SERVICE ACCOUNT. No consent screen and no refresh token to expire:
// sign a JWT with the account's private key, swap it for a one-hour bearer.
// The account's email must be a Full user on the Search Console property
// (Restricted users cannot call URL Inspection).
//
// WHY PAGES ARE KEYED BY PATH. Google can report the same page under the apex
// and www hosts while it settles on one. Stripping the host merges them; `url`
// keeps whichever raw value Google sent first.

export const SCOPE = 'https://www.googleapis.com/auth/webmasters.readonly'
const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const API = 'https://searchconsole.googleapis.com/webmasters/v3'
const INSPECT_URL = 'https://searchconsole.googleapis.com/v1/urlInspection/index:inspect'
/** The API's own maximum per request. */
export const PAGE_SIZE = 25_000

// ─── Auth ───────────────────────────────────────────────────────────────────

const b64url = (input) => Buffer.from(input).toString('base64url')

export function parseServiceAccount(raw) {
  let sa
  try {
    sa = JSON.parse(raw)
  } catch {
    throw new Error('GSC_SERVICE_ACCOUNT_JSON is not valid JSON')
  }
  if (!sa?.client_email || !sa?.private_key) {
    throw new Error('GSC_SERVICE_ACCOUNT_JSON is missing client_email or private_key')
  }
  // Pasted through a dashboard, the key's newlines sometimes arrive escaped.
  return { client_email: sa.client_email, private_key: sa.private_key.replace(/\\n/g, '\n') }
}

/** The signed assertion, exported for the unit test. */
export function signAssertion(sa, now = Math.floor(Date.now() / 1000)) {
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const claims = b64url(JSON.stringify({ iss: sa.client_email, scope: SCOPE, aud: TOKEN_URL, iat: now, exp: now + 3600 }))
  const unsigned = `${header}.${claims}`
  const signature = createSign('RSA-SHA256').update(unsigned).sign(sa.private_key).toString('base64url')
  return `${unsigned}.${signature}`
}

/** A one-hour bearer for the service account. */
export async function getAccessToken(sa) {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: signAssertion(sa),
    }),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok || !body.access_token) {
    throw new Error(`Search Console token exchange failed: HTTP ${res.status} ${body.error ?? ''} ${body.error_description ?? ''}`.trim())
  }
  return body.access_token
}

/** Env check plus token, in one place for the route and the crons. */
export async function searchConsoleFromEnv(env = process.env) {
  if (!env.GSC_SERVICE_ACCOUNT_JSON) return { error: 'GSC_SERVICE_ACCOUNT_JSON is not configured' }
  if (!env.GSC_PROPERTY) return { error: 'GSC_PROPERTY is not configured (sc-domain:pilatesphysics.com)' }
  const token = await getAccessToken(parseServiceAccount(env.GSC_SERVICE_ACCOUNT_JSON))
  return { gsc: new SearchConsole(token, env.GSC_PROPERTY) }
}

// ─── API ────────────────────────────────────────────────────────────────────

export class SearchConsole {
  constructor(token, property) {
    this.token = token
    this.property = property
  }

  async call(url, body) {
    const res = await fetch(url, {
      method: body === undefined ? 'GET' : 'POST',
      headers: { Authorization: `Bearer ${this.token}`, 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(`Search Console: ${json?.error?.message ?? `HTTP ${res.status}`}`)
    return json
  }

  /** Every row for the window and dimensions, paging past the 25,000-row cap. */
  async searchAnalytics(startDate, endDate, dimensions) {
    const out = []
    const site = encodeURIComponent(this.property)
    for (let startRow = 0; ; startRow += PAGE_SIZE) {
      const r = await this.call(`${API}/sites/${site}/searchAnalytics/query`, {
        startDate,
        endDate,
        dimensions,
        rowLimit: PAGE_SIZE,
        startRow,
      })
      const rows = r.rows ?? []
      out.push(...rows)
      if (rows.length < PAGE_SIZE) break
    }
    return out
  }

  async inspect(url) {
    const r = await this.call(INSPECT_URL, { inspectionUrl: url, siteUrl: this.property })
    return r.inspectionResult ?? {}
  }
}

// ─── Pure helpers (unit-tested) ─────────────────────────────────────────────

/** Strip the host (and any query) so apex and www rows for one page merge. */
export function toPath(url) {
  try {
    const u = new URL(url)
    let p = decodeURIComponent(u.pathname)
    if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1)
    return p || '/'
  } catch {
    return url
  }
}

/**
 * API rows to seo_search_daily rows. `dims` names the columns in `keys`.
 * Rows that collapse onto one (date, page, query) after host stripping are
 * summed, position weighted by impressions, so the upsert never sees a
 * duplicate key.
 */
export function toDailyRows(rows, dims) {
  const di = dims.indexOf('date')
  const pi = dims.indexOf('page')
  const qi = dims.indexOf('query')
  if (di < 0 || pi < 0) throw new Error('toDailyRows needs date and page dimensions')
  const merged = new Map()
  for (const r of rows) {
    const date = r.keys[di]
    const url = r.keys[pi]
    const page = toPath(url)
    const query = qi >= 0 ? r.keys[qi] : ''
    const key = `${date}\u0000${page}\u0000${query}`
    const cur = merged.get(key) ?? { date, page, query, url, clicks: 0, impressions: 0, ctr: 0, position: 0, posWeighted: 0 }
    cur.clicks += r.clicks
    cur.impressions += r.impressions
    cur.posWeighted += r.position * r.impressions
    merged.set(key, cur)
  }
  return [...merged.values()].map(({ posWeighted, ...row }) => ({
    ...row,
    ctr: row.impressions > 0 ? row.clicks / row.impressions : 0,
    position: row.impressions > 0 ? posWeighted / row.impressions : 0,
  }))
}

/** ISO date (UTC) `days` before `from`. */
export function dayOffset(days, from = new Date()) {
  const d = new Date(from)
  d.setUTCDate(d.getUTCDate() - days)
  return d.toISOString().slice(0, 10)
}

/** Consecutive [start, end] windows of at most `span` days covering the range. */
export function windows(startDate, endDate, span) {
  const out = []
  let cur = new Date(`${startDate}T00:00:00Z`)
  const end = new Date(`${endDate}T00:00:00Z`)
  while (cur <= end) {
    const next = new Date(cur)
    next.setUTCDate(next.getUTCDate() + span - 1)
    const stop = next > end ? end : next
    out.push([cur.toISOString().slice(0, 10), stop.toISOString().slice(0, 10)])
    cur = new Date(stop)
    cur.setUTCDate(cur.getUTCDate() + 1)
  }
  return out
}

export function toIndexStatusRow(path, url, r, at = new Date()) {
  const s = r.indexStatusResult ?? {}
  return {
    path,
    url,
    inspected_at: at.toISOString(),
    verdict: s.verdict ?? null,
    coverage_state: s.coverageState ?? null,
    indexing_state: s.indexingState ?? null,
    google_canonical: s.googleCanonical ?? null,
    last_crawl: s.lastCrawlTime ?? null,
    raw: r,
  }
}

/**
 * Findings from index status for the pages the sitemap asks Google to index.
 * PASS is indexed; anything else is a listed page Google is not showing, and
 * the coverage state says why in Google's words.
 */
export function indexFindings(rows, origin) {
  const out = []
  for (const r of rows) {
    if (r.verdict === 'PASS' || r.verdict === null) continue
    const canonicalElsewhere = r.google_canonical && toPath(r.google_canonical) !== r.path
    const canonicalOtherHost = r.google_canonical && !r.google_canonical.startsWith(origin)
    const substack = r.google_canonical && /substack\.com/i.test(r.google_canonical)
    let fix =
      'Fix the on-page findings for this path first (canonical, metadata), then request indexing in Search Console.'
    if (substack) {
      fix =
        'Google still treats the Substack copy as the original. The page now declares itself canonical; request indexing in Search Console and give it a few weeks.'
    } else if (canonicalOtherHost) {
      fix = 'Google prefers another host for this page. Check that host redirects here with a 308, then request indexing.'
    }
    out.push({
      ruleId: 'index.not_indexed',
      severity: r.verdict === 'FAIL' ? 'error' : 'warn',
      path: r.path,
      title: `${r.path} is not indexed: ${r.coverage_state ?? r.verdict}`,
      detail: [
        `Google's verdict is ${r.verdict}.`,
        r.google_canonical
          ? `Google's chosen canonical is ${r.google_canonical}${canonicalOtherHost ? ' (a different host)' : canonicalElsewhere ? ' (a different page)' : ''}.`
          : 'Google has not chosen a canonical.',
        r.last_crawl ? `Last crawled ${String(r.last_crawl).slice(0, 10)}.` : 'Never crawled.',
      ].join(' '),
      evidence: {
        verdict: r.verdict,
        coverage_state: r.coverage_state,
        indexing_state: r.indexing_state,
        google_canonical: r.google_canonical,
        last_crawl: r.last_crawl,
      },
      fix,
      sourceFiles: sourcesFor(r.path),
    })
  }
  return out
}
