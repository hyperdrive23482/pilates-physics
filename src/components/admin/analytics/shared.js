/**
 * Shared helpers for the admin analytics pages: the one date range every page
 * offers, period-comparison bucketing, and formatting.
 *
 * Ported from pilates-session-coach/src/components/admin/analytics/shared.ts
 * (types dropped). The Funnel and SEO pages import from here rather than
 * redefining a range, so no two admin screens can offer different windows.
 */

// ─── Date range ─────────────────────────────────────────────────────────────

export const DATE_RANGES = ['7d', '30d', '90d', '12m', 'all']

export const DATE_RANGE_LABELS = {
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
  '90d': 'Last 90 days',
  '12m': 'Last 12 months',
  all: 'All time',
}

export const DEFAULT_RANGE = '30d'

export function isDateRange(value) {
  return DATE_RANGES.includes(value)
}

/** Local-midnight start of the range, or null for all time. */
export function getStartDate(range) {
  if (range === 'all') return null
  const now = new Date()
  switch (range) {
    case '7d':
      return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7)
    case '30d':
      return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30)
    case '90d':
      return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 90)
    case '12m':
      return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
    default:
      return null
  }
}

/** The range as `{from, to}` ISO strings for an API call. `from` is null for all time. */
export function rangeBounds(range) {
  const start = getStartDate(range)
  return { from: start ? start.toISOString() : null, to: new Date().toISOString() }
}

/** Keep the rows whose `date` (YYYY-MM-DD) falls inside the range. */
export function filterByDate(rows, range, key = 'date') {
  const start = getStartDate(range)
  if (!start) return rows
  const startStr = start.toISOString().split('T')[0]
  return rows.filter((r) => r[key] >= startStr)
}

// ─── Formatting ─────────────────────────────────────────────────────────────

/** Shown for anything that could not be computed. */
export const NO_VALUE = '—'

export function formatCount(n) {
  return typeof n === 'number' && Number.isFinite(n) ? n.toLocaleString('en-US') : NO_VALUE
}

export function formatCents(cents, { fraction = false } = {}) {
  if (typeof cents !== 'number' || !Number.isFinite(cents)) return NO_VALUE
  return (cents / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: fraction ? 2 : 0,
  })
}

/**
 * A fraction, always shown with the raw numbers beside it. At this volume a
 * bare percentage misleads: "50%" reads very differently from "1 of 2".
 */
export function formatFraction(part, whole) {
  if (!whole || whole <= 0) return NO_VALUE
  return `${formatCount(part)} of ${formatCount(whole)} · ${Math.round((part / whole) * 100)}%`
}

export function formatPercent(rate) {
  return typeof rate === 'number' && Number.isFinite(rate) ? `${Math.round(rate * 100)}%` : NO_VALUE
}

export function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/** The drop from the step above, as a share of it. Null when the step above is zero. */
export function stepRate(current, previous) {
  if (previous === null || previous === undefined || previous <= 0) return null
  return current / previous
}

// ─── Chart colors ───────────────────────────────────────────────────────────
//
// The design system's accent at descending opacity, so the current period is
// the full accent and prior periods recede. Hard-coded rather than read from
// CSS variables because recharts paints SVG fills, which do not inherit them.

export const COLORS = {
  primary: '#f09f26',
  secondary: 'rgba(240, 159, 38, 0.72)',
  tertiary: 'rgba(240, 159, 38, 0.42)',
  quaternary: 'rgba(240, 159, 38, 0.24)',
  muted: 'rgba(227, 227, 227, 0.35)',
  grid: 'rgba(227, 227, 227, 0.08)',
  axis: 'rgba(227, 227, 227, 0.55)',
  success: '#4A7C59',
  warning: '#e0a458',
  danger: '#ff7d7d',
  module1: '#2B4C6F',
  module2: '#4A7C59',
  module3: '#8B5E3C',
}

// ─── Period-comparison bucketing ────────────────────────────────────────────
//
// A KPI box drives a chart that compares the selected range to previous
// periods of the same length: the current period is the rightmost bar and the
// x-axis steps back one period at a time. "Flow" metrics sum the events in
// each period; "stock" metrics show the cumulative total as of each period's
// end, so the rightmost bar matches the box's headline number.

const BUCKET_SPECS = {
  '7d': { periodDays: 7, bucketCount: 12 },
  '30d': { periodDays: 30, bucketCount: 12 },
  '90d': { periodDays: 90, bucketCount: 8 },
  '12m': { periodDays: 365, bucketCount: 5 },
}

export const PERIOD_NOUN = {
  '7d': '7-day periods',
  '30d': '30-day periods',
  '90d': '90-day periods',
  '12m': '12-month periods',
  all: 'month',
}

/** Calendar date (YYYY-MM-DD) to an integer day count, UTC-anchored to line
 *  up with the date-only strings the views return. */
export function dayNumber(dateStr) {
  return Math.floor(new Date(dateStr + 'T00:00:00Z').getTime() / 86400000)
}

function todayDayNumber() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return dayNumber(`${y}-${m}-${d}`)
}

function formatDayNumber(dn) {
  return new Date(dn * 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
}

export function minDate(points) {
  let min
  for (const p of points) if (!min || p.date < min) min = p.date
  return min
}

/** Bucket boundaries: rightmost ends today, stepping back one period at a
 *  time. For 'all' there is no fixed period, so one bar per calendar month
 *  from firstDate. */
export function getBuckets(range, firstDate) {
  if (range !== 'all') {
    const { periodDays, bucketCount } = BUCKET_SPECS[range] ?? BUCKET_SPECS['30d']
    const today = todayDayNumber()
    const defs = []
    for (let i = 0; i < bucketCount; i++) {
      const fromEnd = bucketCount - 1 - i
      const endDn = today - fromEnd * periodDays
      const startDn = endDn - periodDays + 1
      defs.push({
        startDn,
        endDn,
        label: formatDayNumber(startDn),
        rangeLabel: `${formatDayNumber(startDn)} to ${formatDayNumber(endDn)}`,
      })
    }
    return defs
  }
  if (!firstDate) return []
  const now = new Date()
  const lastY = now.getFullYear()
  const lastM = now.getMonth() + 1
  let y = Number(firstDate.slice(0, 4))
  let m = Number(firstDate.slice(5, 7))
  const defs = []
  while (y < lastY || (y === lastY && m <= lastM)) {
    const startDn = Math.floor(Date.UTC(y, m - 1, 1) / 86400000)
    const endDn = Math.floor(Date.UTC(y, m, 1) / 86400000) - 1
    const labelDate = new Date(Date.UTC(y, m - 1, 1))
    defs.push({
      startDn,
      endDn,
      label: labelDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit', timeZone: 'UTC' }),
      rangeLabel: labelDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }),
    })
    m++
    if (m > 12) {
      m = 1
      y++
    }
    if (defs.length > 600) break
  }
  return defs
}

/** Sum of daily `{date, value}` points per bucket. */
export function fillFlow(defs, daily) {
  const values = defs.map(() => 0)
  for (const p of daily) {
    const dn = dayNumber(p.date)
    for (let i = 0; i < defs.length; i++) {
      if (dn >= defs[i].startDn && dn <= defs[i].endDn) {
        values[i] += p.value
        break
      }
    }
  }
  return defs.map((d, i) => ({ label: d.label, rangeLabel: d.rangeLabel, value: values[i] }))
}

/** Cumulative total of daily points as of each bucket's end. */
export function fillStock(defs, daily) {
  const sorted = [...daily].sort((a, b) => a.date.localeCompare(b.date))
  return defs.map((d) => {
    let cum = 0
    for (const p of sorted) {
      if (dayNumber(p.date) <= d.endDn) cum += p.value
      else break
    }
    return { label: d.label, rangeLabel: `as of ${formatDayNumber(d.endDn)}`, value: cum }
  })
}

/** Period bars for a flow metric from daily points. */
export function flowSeries(daily, range) {
  return fillFlow(getBuckets(range, minDate(daily)), daily)
}

/** Period bars for a stock metric from daily points. */
export function stockSeries(daily, range) {
  return fillStock(getBuckets(range, minDate(daily)), daily)
}

/** Sum of daily points inside the selected range. */
export function sumInRange(daily, range) {
  return filterByDate(daily, range).reduce((acc, p) => acc + p.value, 0)
}

/** Daily snapshot rows (point-in-time values) as a trend, filtered by range. */
export function snapshotSeries(rows, range, pick) {
  const start = getStartDate(range)
  const startStr = start ? start.toISOString().split('T')[0] : null
  return rows
    .filter((r) => !startStr || r.date >= startStr)
    .map((r) => ({
      label: formatDate(r.date),
      rangeLabel: new Date(r.date + 'T00:00:00').toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      value: Number(pick(r)) || 0,
    }))
}
