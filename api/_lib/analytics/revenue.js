import { dailyFromMap, dayRange, grossCents, inRange, netCents, utcDay } from './shared.js'

/**
 * Revenue tab aggregation over the purchases ledger (migration 062).
 *
 * Every amount is attributed to the order's purchase day, refunds and lost
 * disputes included, so the by-product and by-tier tables for a range always
 * add up to the headline for that range. A refund issued this month on an
 * order from last month therefore lands in last month; the tab says so.
 *
 * Pure. Tested in revenue.test.js.
 */

export const PRICING_ORDER = ['full', 'early_bird', 'offer', 'scholarship', 'bundle']
export const PRICING_LABELS = {
  full: 'Full price',
  early_bird: 'Early bird',
  offer: '$39 offer',
  scholarship: 'Scholarship',
  bundle: 'Bundle',
}

const buyerKey = (p) => p.user_id ?? (p.email ? p.email.toLowerCase() : null) ?? p.id

function emptyDay(date) {
  return {
    date,
    orders: 0,
    gross: 0,
    discounts: 0,
    refunds: 0,
    disputes: 0,
    net: 0,
    fees: 0,
    buyers: new Set(),
    repeat_buyers: new Set(),
  }
}

/**
 * Walks the ledger oldest first, flagging each order as a repeat when the same
 * person had bought before, and accumulates one row per UTC day.
 */
function walk(purchases) {
  const sorted = [...purchases].sort((a, b) => Date.parse(a.purchased_at) - Date.parse(b.purchased_at))
  const seen = new Set()
  const days = new Map()
  const flagged = []
  for (const p of sorted) {
    const key = buyerKey(p)
    const repeat = seen.has(key)
    seen.add(key)
    const gross = grossCents(p)
    const lost = p.dispute_status === 'lost' ? gross : 0
    const refund = p.refund_usd_cents ?? 0
    const day = utcDay(p.purchased_at)
    const d = days.get(day) ?? emptyDay(day)
    d.orders += 1
    d.gross += gross
    d.discounts += p.discount_cents ?? 0
    d.refunds += refund
    d.disputes += lost
    d.net += gross - refund - lost
    d.fees += p.stripe_fee_cents ?? 0
    d.buyers.add(key)
    if (repeat) d.repeat_buyers.add(key)
    days.set(day, d)
    flagged.push({ ...p, repeat, key, gross, refund, lost, net: gross - refund - lost })
  }
  const daily = dailyFromMap(days).map(({ buyers, repeat_buyers, ...rest }) => ({
    ...rest,
    buyers: buyers.size,
    repeat_buyers: repeat_buyers.size,
  }))
  return { flagged, daily }
}

function groupRows(rows, keyOf) {
  const acc = new Map()
  for (const r of rows) {
    const k = keyOf(r)
    const g = acc.get(k) ?? { key: k, orders: 0, gross_cents: 0, discount_cents: 0, refund_cents: 0, net_cents: 0 }
    g.orders += 1
    g.gross_cents += r.gross
    g.discount_cents += r.discount_cents ?? 0
    g.refund_cents += r.refund + r.lost
    g.net_cents += r.net
    acc.set(k, g)
  }
  return acc
}

function withShare(groups, totalNet) {
  return groups.map((g) => ({
    ...g,
    share: totalNet > 0 ? g.net_cents / totalNet : null,
    aov_cents: g.orders > 0 ? Math.round(g.net_cents / g.orders) : null,
  }))
}

/** Daily orders for one product from its first order to the workshop day. */
export function launchSeries(purchases, webinar, { maxDays = 180 } = {}) {
  const rows = purchases.filter((p) => p.webinar_id === webinar.id)
  if (rows.length === 0) return []
  const byDay = new Map()
  for (const p of rows) {
    const day = utcDay(p.purchased_at)
    const d = byDay.get(day) ?? { orders: 0, net: 0, early_bird: 0 }
    d.orders += 1
    d.net += netCents(p)
    if (p.pricing === 'early_bird') d.early_bird += 1
    byDay.set(day, d)
  }
  const days = [...byDay.keys()].sort()
  const first = days[0]
  const scheduledDay = webinar.scheduled_at ? utcDay(webinar.scheduled_at) : null
  let last = days[days.length - 1]
  if (scheduledDay && scheduledDay > last) last = scheduledDay
  return dayRange(first, last, maxDays).map((date) => ({
    date,
    ...(byDay.get(date) ?? { orders: 0, net: 0, early_bird: 0 }),
  }))
}

/**
 * @param purchases  purchases rows (every column the tab reads)
 * @param webinars   webinars rows: id, title, slug, kind, scheduled_at, early_bird_ends_at
 * @param range      from parseRange()
 */
export function buildRevenue({ purchases, webinars, range }) {
  const byId = new Map((webinars ?? []).map((w) => [w.id, w]))
  const { flagged, daily } = walk(purchases ?? [])
  const rows = flagged.filter((p) => inRange(p.purchased_at, range))

  const net = rows.reduce((acc, r) => acc + r.net, 0)
  const buyers = new Set(rows.map((r) => r.key))
  const repeatBuyers = new Set(rows.filter((r) => r.repeat).map((r) => r.key))
  const feeKnown = rows.filter((r) => typeof r.stripe_fee_cents === 'number')

  const kpis = {
    net_cents: net,
    gross_cents: rows.reduce((acc, r) => acc + r.gross, 0),
    discount_cents: rows.reduce((acc, r) => acc + (r.discount_cents ?? 0), 0),
    orders: rows.length,
    aov_cents: rows.length ? Math.round(net / rows.length) : null,
    buyers: buyers.size,
    repeat_buyers: repeatBuyers.size,
    refund_cents: rows.reduce((acc, r) => acc + r.refund, 0),
    refunds: rows.filter((r) => r.refunded_at || (r.refund_usd_cents ?? 0) > 0).length,
    dispute_lost_cents: rows.reduce((acc, r) => acc + r.lost, 0),
    disputes: rows.filter((r) => r.disputed_at || r.dispute_status).length,
    disputes_open: rows.filter((r) => r.dispute_status && !['won', 'lost'].includes(r.dispute_status)).length,
    fee_cents: feeKnown.reduce((acc, r) => acc + r.stripe_fee_cents, 0),
    fee_known_orders: feeKnown.length,
    unsettled_orders: rows.filter((r) => r.needs_settlement_lookup).length,
    non_usd_orders: rows.filter((r) => (r.presentment_currency ?? 'usd') !== 'usd').length,
  }

  const byProduct = withShare(
    [...groupRows(rows, (r) => r.webinar_id ?? 'unknown').values()].map((g) => {
      const w = byId.get(g.key)
      return {
        webinar_id: g.key === 'unknown' ? null : g.key,
        title: w?.title ?? rows.find((r) => r.webinar_id === g.key)?.webinar_slug ?? 'Unknown product',
        slug: w?.slug ?? null,
        kind: w?.kind ?? null,
        ...g,
      }
    }),
    net,
  ).sort((a, b) => b.net_cents - a.net_cents || b.orders - a.orders)

  const tierGroups = groupRows(rows, (r) => (PRICING_ORDER.includes(r.pricing) ? r.pricing : 'full'))
  const byPricing = withShare(
    PRICING_ORDER.map(
      (pricing) =>
        tierGroups.get(pricing) ?? {
          key: pricing,
          orders: 0,
          gross_cents: 0,
          discount_cents: 0,
          refund_cents: 0,
          net_cents: 0,
        },
    ).map((g) => ({ pricing: g.key, label: PRICING_LABELS[g.key], ...g })),
    net,
  )

  const launches = (webinars ?? [])
    .filter((w) => w.kind === 'webinar' && w.scheduled_at)
    .map((w) => ({
      webinar_id: w.id,
      title: w.title,
      slug: w.slug,
      scheduled_at: w.scheduled_at,
      scheduled_day: utcDay(w.scheduled_at),
      early_bird_ends_at: w.early_bird_ends_at ?? null,
      early_bird_day: w.early_bird_ends_at ? utcDay(w.early_bird_ends_at) : null,
      orders: (purchases ?? []).filter((p) => p.webinar_id === w.id).length,
      daily: launchSeries(purchases ?? [], w),
    }))
    .filter((l) => l.orders > 0)
    .sort((a, b) => b.scheduled_at.localeCompare(a.scheduled_at))

  return { kpis, daily, by_product: byProduct, by_pricing: byPricing, launches }
}
