import { CONTENT_ENTRY, CONTENT_EVENT, num, quote, str, toClickHouse } from '../posthog.js'

// PostHog numbers for the SEO page: per-page visitors, entries, organic
// entries, and the page each lead first landed on. Ported from remo's
// admin-seo visitorsByPath / entriesByPath / signupFirstPage; the "conversion"
// here is the spring calculator claim (lead_claimed), not an account signup.
//
// Nothing from a request reaches HogQL except dates, re-formatted by
// toClickHouse; the host comes from the environment.

const range = (column, fromIso, toIso) =>
  `${fromIso ? `${column} >= toDateTime(${quote(toClickHouse(fromIso))}) AND ` : ''}${column} < toDateTime(${quote(toClickHouse(toIso))})`

/** Unique visitors and pageviews per content path. */
export async function visitorsByPath(ph, host, fromIso, toIso) {
  const rows = await ph.query(
    'seo_visitors_by_path',
    `SELECT properties.$pathname AS page, uniq(person_id) AS visitors, count() AS pageviews
    FROM events
    WHERE event = '$pageview'
      AND ${range('timestamp', fromIso, toIso)}
      AND properties.$host = ${quote(host)}
      AND ${CONTENT_EVENT}
    GROUP BY page ORDER BY visitors DESC LIMIT 300`,
  )
  return rows.map((r) => ({ page: str(r[0], '/'), visitors: num(r[1]), pageviews: num(r[2]) }))
}

/** Sessions that entered on each content path, with the organic share. */
export async function entriesByPath(ph, host, fromIso, toIso) {
  const rows = await ph.query(
    'seo_entries_by_path',
    `SELECT $entry_pathname AS page,
           count() AS entries,
           countIf($channel_type = 'Organic Search') AS organic,
           countIf($is_bounce) AS bounces,
           round(avg($session_duration)) AS avg_seconds
    FROM sessions
    WHERE ${range('$start_timestamp', fromIso, toIso)}
      AND $entry_hostname = ${quote(host)}
      AND ${CONTENT_ENTRY}
    GROUP BY page ORDER BY entries DESC LIMIT 300`,
  )
  return rows.map((r) => ({
    page: str(r[0], '/'),
    entries: num(r[1]),
    organic: num(r[2]),
    bounces: num(r[3]),
    avgSeconds: num(r[4]),
  }))
}

/**
 * For each person who claimed the calculator in the window, the first content
 * page they ever viewed before claiming, counted per page. Sums to the number
 * of measurable leads and names the page that actually brought them in.
 */
export async function leadFirstPage(ph, host, fromIso, toIso) {
  const claims = await ph.query(
    'seo_lead_claims',
    `SELECT person_id, min(timestamp) AS claimed_at FROM events
    WHERE event = 'lead_claimed'
      AND ${range('timestamp', fromIso, toIso)}
      AND properties.$host = ${quote(host)}
    GROUP BY person_id`,
  )
  const people = claims.map((r) => ({ person: String(r[0] ?? ''), at: String(r[1] ?? '') })).filter((p) => p.person && p.at)
  if (people.length === 0) return { measured: 0, byPage: [] }

  const personList = people.map((p) => quote(p.person)).join(', ')
  const cutoffs = people.map((p) => `person_id = ${quote(p.person)}, toDateTime(${quote(toClickHouse(p.at))})`).join(', ')
  const rows = await ph.query(
    'seo_lead_first_page',
    `SELECT first_page, count() AS leads FROM (
      SELECT person_id, argMin(properties.$pathname, timestamp) AS first_page
      FROM events
      WHERE event = '$pageview'
        AND person_id IN (${personList})
        AND properties.$host = ${quote(host)}
        AND ${CONTENT_EVENT}
        AND timestamp <= multiIf(${cutoffs}, toDateTime('1970-01-01 00:00:00'))
      GROUP BY person_id
    ) GROUP BY first_page ORDER BY leads DESC`,
  )
  return { measured: people.length, byPage: rows.map((r) => ({ page: str(r[0], '/'), leads: num(r[1]) })) }
}
