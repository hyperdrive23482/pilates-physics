import { NO_RECORD, campaignOf, countBy, touchFromRow, touchSource } from '../attribution.js'
import { dailyFromMap, daysBetween, fraction, inRange, medianDays, utcDay } from './shared.js'

/**
 * Audience tab aggregation: who the accounts are and where they came from.
 *
 *   - Kit subscribers over time from daily_snapshots (migration 063).
 *   - New accounts by how they became known to us (the earliest entitlement).
 *   - Leads (calculator claims) who later bought, with the median gap.
 *   - First touch, last touch and campaign breakdowns from touch_attribution
 *     (migration 061), bucketed by touchSource so every admin page files a
 *     person under the same source. Accounts from before attribution existed
 *     are shown as "No record" rather than dropped.
 *   - The most recent accounts, for a row-expand timeline.
 *
 * Pure. Tested in audience.test.js.
 */

export const ACCOUNT_SOURCES = {
  lead_magnet: 'Calculator lead',
  stripe: 'Purchase',
  bonus: 'Purchase',
  bundle: 'Purchase',
  kit_tag: 'Kit tag',
  manual: 'Manual grant',
  admin: 'Manual grant',
}
export const NO_PRODUCT = 'No product yet'

const ms = (iso) => (iso ? Date.parse(iso) : NaN)

/** How an account became known to us: its earliest entitlement's source. */
export function accountSource(userEntitlements) {
  if (!userEntitlements?.length) return NO_PRODUCT
  const first = [...userEntitlements].sort((a, b) => ms(a.granted_at) - ms(b.granted_at))[0]
  return ACCOUNT_SOURCES[first.source] ?? first.source ?? NO_PRODUCT
}

/**
 * @param users         admin_auth_users_brief rows: id, email, created_at, last_sign_in_at
 * @param entitlements  user_entitlements: user_id, webinar_id, source, granted_at
 * @param attribution   touch_attribution rows, or null when the table is missing
 * @param snapshots     daily_snapshots rows: snapshot_date, kit, users; or null
 * @param webinars      id, title, kind
 * @param kitLive       { subscribers } from a live Kit read, or null
 * @param range         from parseRange()
 * @param recentLimit   how many recent accounts to list
 */
export function buildAudience({ users, entitlements, attribution, snapshots, webinars, kitLive, range, recentLimit = 40 }) {
  const titles = new Map((webinars ?? []).map((w) => [w.id, w]))
  const entsByUser = new Map()
  for (const e of entitlements ?? []) {
    if (!entsByUser.has(e.user_id)) entsByUser.set(e.user_id, [])
    entsByUser.get(e.user_id).push(e)
  }

  // ---- New accounts ----
  const allUsers = users ?? []
  const newInRange = allUsers.filter((u) => inRange(u.created_at, range))
  const newBySource = countBy(newInRange, (u) => accountSource(entsByUser.get(u.id)), 20)
  const dayMap = new Map()
  for (const u of allUsers) {
    const day = utcDay(u.created_at)
    dayMap.set(day, (dayMap.get(day) ?? 0) + 1)
  }
  const newDaily = dailyFromMap(dayMap)

  // ---- Leads who became buyers ----
  // A lead is an account holding a calculator (lead_magnet) entitlement. They
  // became a buyer when a stripe entitlement was granted after that claim.
  let leads = 0
  let leadsBought = 0
  const gaps = []
  let buyers = 0
  let buyersNeverLeads = 0
  for (const [, ents] of entsByUser) {
    const lead = ents.filter((e) => e.source === 'lead_magnet').sort((a, b) => ms(a.granted_at) - ms(b.granted_at))[0]
    const purchase = ents.filter((e) => e.source === 'stripe').sort((a, b) => ms(a.granted_at) - ms(b.granted_at))[0]
    if (purchase) buyers += 1
    if (lead) {
      leads += 1
      if (purchase && ms(purchase.granted_at) >= ms(lead.granted_at)) {
        leadsBought += 1
        const d = daysBetween(lead.granted_at, purchase.granted_at)
        if (d !== null) gaps.push(d)
      } else if (purchase) {
        buyersNeverLeads += 1
      }
    } else if (purchase) {
      buyersNeverLeads += 1
    }
  }

  // ---- Attribution ----
  let sources = null
  if (attribution) {
    const rows = attribution.filter((r) => inRange(r.created_at, range))
    const recordedUsers = new Set(rows.map((r) => r.user_id).filter(Boolean))
    const unrecorded = newInRange.filter((u) => !recordedUsers.has(u.id)).length
    const withNoRecord = (list) => {
      if (unrecorded <= 0) return list
      const existing = list.find((r) => r.label === NO_RECORD)
      if (existing) existing.value += unrecorded
      else list.push({ label: NO_RECORD, value: unrecorded })
      return list.sort((a, b) => b.value - a.value || a.label.localeCompare(b.label))
    }
    sources = {
      recorded: rows.length,
      unrecorded,
      first_touch: withNoRecord(countBy(rows, (r) => touchSource(touchFromRow(r, 'first')))),
      last_touch: withNoRecord(countBy(rows, (r) => touchSource(touchFromRow(r, 'last')))),
      campaigns: countBy(rows, (r) => campaignOf(r)),
      landing_paths: countBy(
        rows.filter((r) => r.first_landing_path),
        (r) => r.first_landing_path,
      ),
      by_via: countBy(rows, (r) => r.recorded_via ?? 'unknown'),
    }
  }

  // ---- Kit subscribers ----
  const snapshotSeries = (snapshots ?? [])
    .filter((s) => s.snapshot_date)
    .map((s) => ({
      date: s.snapshot_date,
      subscribers: s.kit?.subscribers ?? null,
      total_accounts: s.users?.total_accounts ?? null,
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
  const latestWithKit = [...snapshotSeries].reverse().find((s) => typeof s.subscribers === 'number') ?? null
  const kit = kitLive?.subscribers != null
    ? { subscribers: kitLive.subscribers, as_of: null, from: 'live' }
    : latestWithKit
    ? { subscribers: latestWithKit.subscribers, as_of: latestWithKit.date, from: 'snapshot' }
    : null

  // ---- Recent accounts ----
  const attrByUser = new Map((attribution ?? []).filter((r) => r.user_id).map((r) => [r.user_id, r]))
  const recent = [...allUsers]
    .sort((a, b) => ms(b.created_at) - ms(a.created_at))
    .slice(0, recentLimit)
    .map((u) => {
      const ents = entsByUser.get(u.id) ?? []
      const attr = attrByUser.get(u.id) ?? null
      return {
        id: u.id,
        email: u.email,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at ?? null,
        source: accountSource(ents),
        first_touch: attr ? touchSource(touchFromRow(attr, 'first')) : NO_RECORD,
        last_touch: attr ? touchSource(touchFromRow(attr, 'last')) : NO_RECORD,
        campaign: attr ? campaignOf(attr) : null,
        is_buyer: ents.some((e) => e.source === 'stripe'),
        products: ents
          .filter((e) => titles.get(e.webinar_id)?.kind === 'webinar' || titles.get(e.webinar_id)?.kind === 'course')
          .map((e) => titles.get(e.webinar_id)?.title)
          .filter(Boolean),
      }
    })

  return {
    kpis: {
      kit,
      new_accounts: newInRange.length,
      total_accounts: allUsers.length,
      leads,
      leads_bought: fraction(leadsBought, leads),
      lead_to_purchase_days: medianDays(gaps),
      buyers,
      buyers_never_leads: fraction(buyersNeverLeads, buyers),
    },
    new_by_source: newBySource,
    new_daily: newDaily,
    snapshots: snapshotSeries,
    sources,
    recent,
  }
}
