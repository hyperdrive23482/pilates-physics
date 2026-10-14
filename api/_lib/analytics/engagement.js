import { fraction, sum } from './shared.js'

/**
 * Engagement tab aggregation over the activity log views and functions.
 *
 *   dailyRows  admin_engagement_daily (063): day, event_type, webinar_id, events, distinct_users
 *   items      per-item opens and distinct people: admin_engagement_items(p_since)
 *              (064) for the range, or admin_engagement_by_item (063) all time
 *   hourly     admin_engagement_hourly(p_since, tz) (064): dow, hour, event_type, events
 *
 * Pure. Tested in engagement.test.js.
 */

export const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
export const SESSION_EVENTS = ['login', 'portal_view', 'dashboard_view']

/**
 * Rank items by distinct people, then opens. Distinct people across event
 * types of the same item cannot be summed exactly; the larger is the honest
 * lower bound.
 */
export function rankItems(items, types, limit = 25) {
  const acc = new Map()
  for (const it of items ?? []) {
    if (!types.includes(it.event_type)) continue
    const entry = acc.get(it.item_key) ?? { key: it.item_key, label: it.label, opens: 0, distinct_users: 0 }
    entry.opens += it.opens ?? 0
    entry.distinct_users = Math.max(entry.distinct_users, it.distinct_users ?? 0)
    acc.set(it.item_key, entry)
  }
  return [...acc.values()]
    .sort((a, b) => b.distinct_users - a.distinct_users || b.opens - a.opens)
    .slice(0, limit)
}

/** Daily `{date, value}` for one event type, from admin_engagement_daily rows. */
export function dailySeries(rows, eventTypes) {
  const map = new Map()
  for (const r of rows ?? []) {
    if (!eventTypes.includes(r.event_type)) continue
    map.set(r.day, (map.get(r.day) ?? 0) + (r.events ?? 0))
  }
  return [...map.entries()].map(([date, value]) => ({ date, value })).sort((a, b) => a.date.localeCompare(b.date))
}

/** Seven weekday bars and twenty-four hour bars from the hourly rows. */
export function timeOfDay(hourly, eventTypes) {
  const weekday = WEEKDAYS.map((label, dow) => ({ dow, label, value: 0 }))
  const hour = Array.from({ length: 24 }, (_, h) => ({ hour: h, label: hourLabel(h), value: 0 }))
  for (const r of hourly ?? []) {
    if (!eventTypes.includes(r.event_type)) continue
    if (r.dow >= 0 && r.dow < 7) weekday[r.dow].value += r.events ?? 0
    if (r.hour >= 0 && r.hour < 24) hour[r.hour].value += r.events ?? 0
  }
  return { weekday, hour }
}

function hourLabel(h) {
  if (h === 0) return '12am'
  if (h === 12) return '12pm'
  return h < 12 ? `${h}am` : `${h - 12}pm`
}

/**
 * Buyers who have never signed in, split by how long ago they first bought.
 * Counted from auth.users.last_sign_in_at, not the activity log, because the
 * log starts in Aug 2026 and would call every earlier customer a stranger.
 */
export function buyersNeverSignedIn(users, entitlements, now = new Date()) {
  const firstPurchase = new Map()
  for (const e of entitlements ?? []) {
    if (e.source !== 'stripe') continue
    const t = Date.parse(e.granted_at)
    if (Number.isNaN(t)) continue
    const prev = firstPurchase.get(e.user_id)
    if (prev === undefined || t < prev) firstPurchase.set(e.user_id, t)
  }
  const byId = new Map((users ?? []).map((u) => [u.id, u]))
  const buckets = [
    { key: 'under_30', label: 'Bought under 30 days ago', min: 0, max: 30, value: 0 },
    { key: '30_60', label: '30 to 60 days ago', min: 30, max: 60, value: 0 },
    { key: '60_90', label: '60 to 90 days ago', min: 60, max: 90, value: 0 },
    { key: 'over_90', label: 'Over 90 days ago', min: 90, max: Infinity, value: 0 },
  ]
  let buyers = 0
  let never = 0
  for (const [userId, t] of firstPurchase) {
    const u = byId.get(userId)
    if (!u) continue
    buyers += 1
    if (u.last_sign_in_at) continue
    never += 1
    const days = (now.getTime() - t) / 86400000
    const b = buckets.find((x) => days >= x.min && days < x.max)
    if (b) b.value += 1
  }
  return { buyers, never: fraction(never, buyers), by_age: buckets.map(({ key, label, value }) => ({ key, label, value })) }
}

/**
 * @param dailyRows    admin_engagement_daily rows (all time), or null
 * @param items        per-item rows, or null
 * @param itemsScope   'range' | 'all' describing `items`
 * @param hourly       admin_engagement_hourly rows, or null
 * @param activeUsers  count_active_users(range) result, or null
 * @param users        admin_auth_users_brief rows, or null
 * @param entitlements user_entitlements rows
 * @param fromDay      range start as YYYY-MM-DD, or null for all time
 */
export function buildEngagement({ dailyRows, items, itemsScope, hourly, activeUsers, users, entitlements, fromDay, now = new Date() }) {
  const inRangeRows = dailyRows ? dailyRows.filter((r) => !fromDay || r.day >= fromDay) : null
  const kpis = {
    active_users: activeUsers ?? null,
    logins: inRangeRows ? sum(inRangeRows.filter((r) => r.event_type === 'login'), (r) => r.events) : null,
    portal_views: inRangeRows ? sum(inRangeRows.filter((r) => r.event_type === 'portal_view'), (r) => r.events) : null,
    events: inRangeRows ? sum(inRangeRows, (r) => r.events) : null,
    tool_opens: inRangeRows ? sum(inRangeRows.filter((r) => r.event_type === 'tool_open'), (r) => r.events) : null,
    content_opens: inRangeRows
      ? sum(inRangeRows.filter((r) => r.event_type === 'content_click' || r.event_type === 'download'), (r) => r.events)
      : null,
  }
  const daily = dailyRows
    ? {
        logins: dailySeries(dailyRows, ['login']),
        portal_views: dailySeries(dailyRows, ['portal_view']),
        events: dailySeries(dailyRows, [...new Set(dailyRows.map((r) => r.event_type))]),
        tool_opens: dailySeries(dailyRows, ['tool_open']),
        content_opens: dailySeries(dailyRows, ['content_click', 'download']),
      }
    : null
  return {
    kpis,
    daily,
    rankings: items
      ? {
          scope: itemsScope,
          tools: rankItems(items, ['tool_open']),
          content: rankItems(items, ['content_click', 'download']),
        }
      : null,
    time_of_day: hourly
      ? { sessions: timeOfDay(hourly, SESSION_EVENTS), all: timeOfDay(hourly, [...new Set(hourly.map((r) => r.event_type))]) }
      : null,
    buyers: users ? buyersNeverSignedIn(users, entitlements, now) : null,
  }
}
