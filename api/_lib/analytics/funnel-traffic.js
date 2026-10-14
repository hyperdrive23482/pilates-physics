import { CONTENT_ENTRY, CONTENT_EVENT, num, quote, str, toClickHouse } from '../posthog.js'

/**
 * PostHog queries behind step 1 (web traffic) and the lead step's "what they
 * looked at before claiming" panel of /admin/funnel.
 *
 * Ported from pilates-session-coach/supabase/functions/admin-funnel-traffic/
 * traffic.ts, without remo's plan split. Every query is host- and
 * content-filtered (see api/_lib/posthog.js for why), so these numbers sit
 * below PostHog's own Web Analytics on purpose.
 *
 * Both functions take the client as an argument so a fake `{ query }` can
 * exercise the parsing in funnel-traffic.test.js. Every PostHog read is best
 * effort: the route catches and reports, the page renders a dash.
 */

const rows = (result, fallback) => result.map((r) => ({ label: str(r[0], fallback), value: num(r[1]) }))

/** Median and mean of a list, one decimal, zeros when empty. */
export function stat(values) {
  if (values.length === 0) return { median: 0, mean: 0 }
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  const median = sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
  const mean = values.reduce((s, v) => s + v, 0) / values.length
  return { median: Math.round(median * 10) / 10, mean: Math.round(mean * 10) / 10 }
}

export const EMPTY_TRAFFIC = {
  visitors: 0,
  visits: 0,
  pageviews: 0,
  channels: [],
  referrers: [],
  campaigns: [],
  countries: [],
  us_states: [],
}

// ─── Step 1: web traffic ────────────────────────────────────────────────────

/**
 * Unique visitors, visits and pageviews on content pages inside the window,
 * with the session-level breakdowns (channel, referrer, campaign) by where
 * the session ENTERED, which is also the right semantic for attribution: the
 * channel that brought someone in owns the landing page, not wherever they
 * ended up. Geography is per person from the events table.
 *
 * `from` is null for all time; PostHog keeps a year by default, so "all" is
 * really "as far back as PostHog has".
 */
export async function fetchTraffic(ph, host, fromIso, toIso) {
  const to = quote(toClickHouse(toIso))
  const hostLit = quote(host)
  const from = fromIso ? quote(toClickHouse(fromIso)) : null

  const eventWhere = [
    `event = '$pageview'`,
    from ? `timestamp >= toDateTime(${from})` : null,
    `timestamp < toDateTime(${to})`,
    `properties.$host = ${hostLit}`,
    CONTENT_EVENT,
  ]
    .filter(Boolean)
    .join('\n    AND ')

  // A qualifying session, by where it ENTERED.
  const sessionWhere = [
    from ? `$start_timestamp >= toDateTime(${from})` : null,
    `$start_timestamp < toDateTime(${to})`,
    `$entry_hostname = ${hostLit}`,
    CONTENT_ENTRY,
  ]
    .filter(Boolean)
    .join('\n    AND ')

  const [headline, channels, referrers, campaigns, countries, usStates] = await Promise.all([
    ph.query(
      'funnel_traffic_headline',
      `SELECT uniq(person_id) AS visitors, uniq($session_id) AS visits, count() AS pageviews
      FROM events WHERE ${eventWhere}`,
    ),
    ph.query(
      'funnel_traffic_channels',
      `SELECT coalesce($channel_type, 'Unknown') AS channel, count() AS sessions
      FROM sessions WHERE ${sessionWhere}
      GROUP BY channel ORDER BY sessions DESC LIMIT 12`,
    ),
    ph.query(
      'funnel_traffic_referrers',
      `SELECT coalesce($entry_referring_domain, '$direct') AS referrer, count() AS sessions
      FROM sessions WHERE ${sessionWhere}
      GROUP BY referrer ORDER BY sessions DESC LIMIT 10`,
    ),
    // Rendered only when non-empty, because most sessions carry no UTM at all.
    ph.query(
      'funnel_traffic_campaigns',
      `SELECT concat(
               coalesce($entry_utm_source, '(no source)'),
               if($entry_utm_campaign IS NULL, '', concat(' · ', $entry_utm_campaign))
             ) AS campaign,
             count() AS sessions
      FROM sessions
      WHERE ${sessionWhere} AND ($entry_utm_source IS NOT NULL OR $entry_utm_campaign IS NOT NULL)
      GROUP BY campaign ORDER BY sessions DESC LIMIT 10`,
    ),
    ph.query(
      'funnel_traffic_countries',
      `SELECT coalesce(properties.$geoip_country_name, 'Unknown') AS country, uniq(person_id) AS visitors
      FROM events WHERE ${eventWhere}
      GROUP BY country ORDER BY visitors DESC LIMIT 10`,
    ),
    ph.query(
      'funnel_traffic_us_states',
      `SELECT coalesce(properties.$geoip_subdivision_1_name, 'Unknown') AS state, uniq(person_id) AS visitors
      FROM events WHERE ${eventWhere} AND properties.$geoip_country_code = 'US'
      GROUP BY state ORDER BY visitors DESC LIMIT 10`,
    ),
  ])

  const head = headline[0] ?? []
  return {
    visitors: num(head[0]),
    visits: num(head[1]),
    pageviews: num(head[2]),
    channels: rows(channels, 'Unknown'),
    referrers: rows(referrers, '$direct'),
    campaigns: rows(campaigns, '(no source)'),
    countries: rows(countries, 'Unknown'),
    us_states: rows(usStates, 'Unknown'),
  }
}

// ─── Lead step: what leads did before they claimed ──────────────────────────

/**
 * Per-lead behaviour strictly before that person's own claim, from PostHog
 * alone: the calculator page fires `lead_claimed` in the browser that
 * claimed, so the person behind the claim is known without a join to our
 * database. (A join via identify would only see leads who later signed in
 * from the same browser, which is a smaller set.)
 *
 * Two queries, because each claim has a different cutoff: the first finds
 * every person with a `lead_claimed` in the window and the moment of their
 * first one, the second counts content pageviews per person before that
 * moment with a `multiIf` of per-person cutoffs.
 *
 * Also reports the calculator landing page's own conversion: people who
 * viewed /spring-calculator in the window against people who claimed. The
 * plan asked for "calculator interactions that never claimed"; the landing
 * page has no interactive calculator (the tool is gated), so the pageview is
 * the interaction there is.
 *
 * `claimsInDb` is the lead count from our own database for the same window,
 * so the caller can say "measured n of m"; the difference is ad blockers, a
 * blocked PostHog script, or claims from before PostHog existed.
 */
export async function fetchPreLead(ph, host, fromIso, toIso, { claimsInDb = null } = {}) {
  const to = quote(toClickHouse(toIso))
  const hostLit = quote(host)
  const fromClause = fromIso ? `AND timestamp >= toDateTime(${quote(toClickHouse(fromIso))})` : ''

  const [claims, landing] = await Promise.all([
    ph.query(
      'funnel_prelead_claims',
      `SELECT person_id, min(timestamp) AS claimed_at FROM events
      WHERE event = 'lead_claimed'
        ${fromClause}
        AND timestamp < toDateTime(${to})
        AND properties.$host = ${hostLit}
      GROUP BY person_id`,
    ),
    ph.query(
      'funnel_prelead_landing',
      `SELECT uniq(person_id) AS visitors FROM events
      WHERE event = '$pageview'
        ${fromClause}
        AND timestamp < toDateTime(${to})
        AND properties.$host = ${hostLit}
        AND properties.$pathname = '/spring-calculator'`,
    ),
  ])

  const people = claims
    .map((r) => ({ person: String(r[0] ?? ''), at: String(r[1] ?? '') }))
    .filter((p) => p.person && p.at)
  const landingVisitors = num(landing[0]?.[0])

  const base = {
    measured: people.length,
    unseen: claimsInDb === null ? null : Math.max(0, claimsInDb - people.length),
    landing_visitors: landingVisitors,
    landing_claimed: people.length,
    pages: { median: 0, mean: 0 },
    visits: { median: 0, mean: 0 },
    top_pages: [],
  }
  if (people.length === 0) return base

  const personList = people.map((p) => quote(p.person)).join(', ')
  const cutoffs = people.map((p) => `person_id = ${quote(p.person)}, toDateTime(${quote(toClickHouse(p.at))})`).join(', ')

  const where = `
    event = '$pageview'
    AND person_id IN (${personList})
    AND properties.$host = ${hostLit}
    AND ${CONTENT_EVENT}
    AND timestamp < multiIf(${cutoffs}, toDateTime('1970-01-01 00:00:00'))`

  const [counted, byPage] = await Promise.all([
    ph.query(
      'funnel_prelead_counts',
      `SELECT person_id, count() AS pages, uniq($session_id) AS visits
      FROM events WHERE ${where}
      GROUP BY person_id`,
    ),
    ph.query(
      'funnel_prelead_pages',
      `SELECT properties.$pathname AS page, uniq(person_id) AS people
      FROM events WHERE ${where}
      GROUP BY page ORDER BY people DESC, page ASC LIMIT 10`,
    ),
  ])

  const pages = []
  const visits = []
  const seen = new Set()
  for (const row of counted) {
    seen.add(String(row[0] ?? ''))
    pages.push(num(row[1]))
    visits.push(num(row[2]))
  }
  // A person with a claim but no earlier content pageview still counts as
  // measured, with zeroes. That is a real case: they landed straight on the
  // calculator page from a link and read nothing first.
  for (const p of people) {
    if (!seen.has(p.person)) {
      pages.push(0)
      visits.push(0)
    }
  }

  return {
    ...base,
    pages: stat(pages),
    visits: stat(visits),
    top_pages: byPage.map((r) => ({ label: str(r[0], '(unknown)'), value: num(r[1]) })),
  }
}
