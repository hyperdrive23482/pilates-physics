/**
 * The PostHog query client and the filters every marketing-traffic number in
 * the admin shares. The Funnel page is the first reader; the SEO Pages tab
 * (Phase 3b) is the second, so the two can never disagree about what "a
 * visitor" or "a content page" means over the same window.
 *
 * Ported from pilates-session-coach/supabase/functions/_shared/posthog.ts.
 * Imports only public-routes.js, so the HogQL fragments can be unit-tested
 * with node --test and the live queries exercised from a script.
 *
 * WHY EVERY QUERY IS FILTERED (remo measured this on 2026-09-17 and the same
 * two facts hold here):
 *
 * 1. Prod, stage and localhost could share one PostHog project, because
 *    VITE_POSTHOG_KEY is one value in Vercel. Hence the $host filter.
 * 2. The app is a SPA and every react-router navigation is a $pageview, so a
 *    signed-in buyer working through a course outweighs real visitors. Hence
 *    the pathname filter: only public content pages count as web traffic.
 *
 * PostHog's own Web Analytics shows the unfiltered number, so the Funnel page
 * disagrees with that dashboard on purpose and says so in the UI.
 *
 * Two HogQL details that cost a round trip each: the sessions column is
 * `$entry_hostname`, not `$entry_host`, and the `sessions` table has no
 * `person_id`, so count sessions there or go through `events`.
 */

import { PUBLIC_ROUTES } from './public-routes.js'

/** The production marketing host. Everything else in the project is stage or
 *  somebody's laptop and must not reach a number. */
export const DEFAULT_PROD_HOST = 'pilatesphysics.com'

/**
 * Paths that are no longer routes but were landing pages once. A RETIRED PAGE
 * STAYS IN THE LIST: these filter history as well as today, so dropping a
 * path the day its route goes deletes every visit it ever earned from any
 * range that reaches back past that day.
 */
export const RETIRED_PATHS = [
  '/springs-101', // redirects to /spring-calculator since the calculator launch
  '/courses', // legacy listing, redirects to /workshops
  '/courses/PP-101-May-2026', // the first workshop's original URL
]

/**
 * The public content pages: the only pageviews that count as web traffic.
 * Derived from PUBLIC_ROUTES, the same list that feeds the sitemap, so the
 * routes, the sitemap and this filter cannot drift (public-routes.test.js
 * fails when App.jsx gains a route that is classified nowhere).
 *
 * /workshops is the generic listing: public, not in the sitemap because the
 * branded pages are, but still a marketing surface people land on.
 *
 * /login, /signup and the portal are deliberately absent. Someone whose only
 * pageview is /login is a returning buyer, not top-of-funnel traffic.
 */
export const CONTENT_PATHS = [...PUBLIC_ROUTES, '/workshops', ...RETIRED_PATHS]

/** Dynamic public pages, matched by prefix: blog posts, workshop and legacy
 *  course sales pages. The post-purchase /success pages are excluded below. */
export const CONTENT_PREFIXES = ['/blog/', '/workshops/', '/courses/']

/**
 * PostHog runs at most 3 queries at once per project and answers the fourth
 * with a 429 ("Queries are a little too busy right now"). The Funnel route
 * alone asks for 8 in parallel, so the client queues past MAX_CONCURRENT and
 * retries a 429 with backoff, which also covers a second admin tab or the SEO
 * page holding slots at the same moment.
 */
const MAX_CONCURRENT = 3
const RETRY_DELAYS_MS = [1000, 2500, 5000]
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export class PostHogClient {
  constructor(host, projectId, apiKey) {
    this.host = host
    this.projectId = projectId
    this.apiKey = apiKey
    this.active = 0
    this.waiting = []
  }

  async acquire() {
    if (this.active < MAX_CONCURRENT) {
      this.active++
      return
    }
    // The releasing query hands its slot straight over, so active stays put.
    await new Promise((resolve) => this.waiting.push(resolve))
  }

  release() {
    const next = this.waiting.shift()
    if (next) next()
    else this.active--
  }

  /** Runs one HogQL query and returns its rows (arrays of cells). */
  async query(name, sql) {
    await this.acquire()
    try {
      for (let attempt = 0; ; attempt++) {
        const res = await fetch(`${this.host}/api/projects/${this.projectId}/query/`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: { kind: 'HogQLQuery', query: sql }, name }),
        })
        const body = await res.json().catch(() => ({}))
        if (res.ok) return body?.results ?? []
        if (res.status === 429 && attempt < RETRY_DELAYS_MS.length) {
          const retryAfter = Number(res.headers.get('retry-after'))
          await sleep(Number.isFinite(retryAfter) && retryAfter > 0 ? Math.min(retryAfter * 1000, 10000) : RETRY_DELAYS_MS[attempt])
          continue
        }
        const detail = body?.detail ?? body?.error ?? `HTTP ${res.status}`
        throw new Error(`PostHog query "${name}" failed: ${detail}`)
      }
    } finally {
      this.release()
    }
  }
}

/**
 * Reads the POSTHOG_* server vars, or explains which one is missing. Every
 * caller treats PostHog as best effort, so this returns rather than throws.
 *
 *   POSTHOG_API_KEY      personal API key with the "Query: Read" scope
 *   POSTHOG_PROJECT_ID   the numeric project id
 *   POSTHOG_API_HOST     defaults to https://us.posthog.com
 *   POSTHOG_PROD_HOST    defaults to pilatesphysics.com
 */
export function postHogFromEnv(env = process.env) {
  const key = env.POSTHOG_API_KEY
  const project = env.POSTHOG_PROJECT_ID
  const host = (env.POSTHOG_API_HOST ?? 'https://us.posthog.com').replace(/\/$/, '')
  if (!key || !project) {
    return { error: 'PostHog is not configured (POSTHOG_API_KEY / POSTHOG_PROJECT_ID are not set).' }
  }
  return { client: new PostHogClient(host, String(project), key), prodHost: env.POSTHOG_PROD_HOST ?? DEFAULT_PROD_HOST }
}

/**
 * Everything interpolated into HogQL comes from these modules or from ids read
 * out of our own database, never from a request body. Callers only supply
 * dates, which are re-formatted here. These helpers exist so that stays true
 * by construction rather than by care.
 */
export const quote = (s) => `'${String(s).replace(/\\/g, '\\\\').replace(/'/g, "''")}'`
export const pathList = CONTENT_PATHS.map(quote).join(', ')

const prefixTests = (column) =>
  CONTENT_PREFIXES.map((p) => `startsWith(${column}, ${quote(p)})`).join('\n  OR ')

/** A qualifying pageview on the events table: a public content page. Shared
 *  by every traffic number so "a page view" can never come to mean two
 *  different things on two admin screens. */
export const CONTENT_EVENT = `(
  properties.$pathname IN (${pathList})
  OR ((${prefixTests('properties.$pathname')})
      AND NOT endsWith(properties.$pathname, '/success'))
)`

/** The same test on the sessions table, by where the session ENTERED. */
export const CONTENT_ENTRY = `(
  $entry_pathname IN (${pathList})
  OR ((${prefixTests('$entry_pathname')})
      AND NOT endsWith($entry_pathname, '/success'))
)`

/** A UUID from our own database. Anything else is dropped rather than
 *  escaped: there is no legitimate case for a non-UUID reaching a query. */
export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** `2026-09-17T12:34:56.000Z` to `2026-09-17 12:34:56`, which is what
 *  ClickHouse wants and what toDateTime() parses. PostHog timestamps are UTC. */
export const toClickHouse = (iso) => String(iso).slice(0, 19).replace('T', ' ')

export const num = (v) => Number(v) || 0
export const str = (v, fallback) => {
  const s = v == null ? '' : String(v)
  return s.length > 0 ? s : fallback
}

/**
 * Maps Supabase user ids to PostHog person ids. They connect because
 * AnalyticsIdentity calls identifyUser(user.id), so our identified
 * distinct_id IS the user id. Non-UUID inputs are dropped before the query.
 */
export async function mapUsersToPersons(ph, userIds) {
  const valid = [...new Set(userIds.filter((id) => UUID_RE.test(id)))]
  const out = new Map()
  if (valid.length === 0) return out
  const rows = await ph.query(
    'person_map',
    `SELECT distinct_id, person_id FROM events
    WHERE distinct_id IN (${valid.map(quote).join(', ')})
    GROUP BY distinct_id, person_id`,
  )
  for (const row of rows) {
    const distinctId = String(row[0] ?? '')
    const personId = String(row[1] ?? '')
    if (UUID_RE.test(personId) && distinctId) out.set(distinctId, personId)
  }
  return out
}
