/**
 * Helpers shared by the five analytics tab routes (api/admin/analytics/*)
 * and their pure builders in this folder.
 *
 * Everything here is import-free so the builders can be unit-tested with
 * node --test and no database.
 */

export const RANGES = ['7d', '30d', '90d', '12m', 'all']
export const DEFAULT_RANGE = '30d'

const DAY_MS = 86400000

/**
 * The selected range as UTC instants. The client keeps its own local-midnight
 * version for chart bucketing; the server filters in UTC, which is also how
 * the SQL views bucket days. `from` is null for all time.
 */
export function parseRange(query, now = new Date()) {
  const range = RANGES.includes(query?.range) ? query.range : DEFAULT_RANGE
  const dayStart = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  let fromMs = null
  if (range === '7d') fromMs = dayStart - 7 * DAY_MS
  else if (range === '30d') fromMs = dayStart - 30 * DAY_MS
  else if (range === '90d') fromMs = dayStart - 90 * DAY_MS
  else if (range === '12m') fromMs = Date.UTC(now.getUTCFullYear() - 1, now.getUTCMonth(), now.getUTCDate())
  const toMs = now.getTime()
  return {
    range,
    from: fromMs === null ? null : new Date(fromMs).toISOString(),
    to: new Date(toMs).toISOString(),
    from_day: fromMs === null ? null : new Date(fromMs).toISOString().slice(0, 10),
    fromMs,
    toMs,
  }
}

/** Is this timestamp inside the range? Null timestamps never are. */
export function inRange(iso, range) {
  if (!iso) return false
  const t = typeof iso === 'number' ? iso : Date.parse(iso)
  if (Number.isNaN(t)) return false
  if (range.fromMs !== null && t < range.fromMs) return false
  return t <= range.toMs
}

export const utcDay = (iso) => new Date(iso).toISOString().slice(0, 10)

export function daysBetween(fromIso, toIso) {
  const a = Date.parse(fromIso)
  const b = Date.parse(toIso)
  if (Number.isNaN(a) || Number.isNaN(b)) return null
  return (b - a) / DAY_MS
}

/** Median of a list of numbers, or null when empty. */
export function median(values) {
  const xs = values.filter((v) => typeof v === 'number' && Number.isFinite(v)).sort((a, b) => a - b)
  if (xs.length === 0) return null
  const mid = Math.floor(xs.length / 2)
  return xs.length % 2 ? xs[mid] : (xs[mid - 1] + xs[mid]) / 2
}

/** Median rounded to one decimal, for "days" figures. */
export function medianDays(values) {
  const m = median(values)
  return m === null ? null : Math.round(m * 10) / 10
}

export const sum = (rows, pick) => rows.reduce((acc, r) => acc + (Number(pick(r)) || 0), 0)

/** `{ n, m }` so the UI can always print "n of m · p%". */
export const fraction = (n, m) => ({ n, m })

/** Net USD cents for one purchases row: settled, less refunds and lost disputes. */
export function grossCents(p) {
  return p.settled_usd_cents ?? (p.presentment_currency === 'usd' ? p.presentment_amount_cents : 0) ?? 0
}

export function netCents(p) {
  const gross = grossCents(p)
  const lost = p.dispute_status === 'lost' ? gross : 0
  return gross - (p.refund_usd_cents ?? 0) - lost
}

/** Runs one block and turns a failure into an error string instead of a 500. */
export async function soft(name, errors, fn) {
  try {
    return await fn()
  } catch (err) {
    console.error(`admin/analytics ${name}:`, err)
    errors[name] = err.message ?? String(err)
    return null
  }
}

export const unwrap = ({ data, error }) => {
  if (error) throw error
  return data
}

/** One `{date, value}` list from a map of day -> number, oldest first. */
export function dailyFromMap(map, key = 'value') {
  return [...map.entries()]
    .map(([date, v]) => (typeof v === 'number' ? { date, [key]: v } : { date, ...v }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

/** Every day from `fromDay` to `toDay` inclusive (YYYY-MM-DD), capped. */
export function dayRange(fromDay, toDay, cap = 400) {
  const out = []
  let t = Date.parse(fromDay + 'T00:00:00Z')
  const end = Date.parse(toDay + 'T00:00:00Z')
  while (t <= end && out.length < cap) {
    out.push(new Date(t).toISOString().slice(0, 10))
    t += DAY_MS
  }
  return out
}
