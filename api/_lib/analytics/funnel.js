import { NO_RECORD, campaignOf, countBy, touchFromRow, touchSource } from '../attribution.js'
import { daysBetween, fraction, inRange, medianDays } from './shared.js'

/**
 * Funnel page aggregation (docs/admin-analytics-engine-plan.md, section 6),
 * steps 2 to 6 and the sources section. Step 1 (web traffic) and the lead
 * step's PostHog panel live in funnel-traffic.js and arrive by a separate
 * route, so a slow PostHog never holds up the numbers from our own tables.
 *
 * Period funnel: each step counts events inside the window. Steps 4 to 6 are
 * standalone and carry their own denominator in words; the UI never divides
 * them by the step above (src/lib/funnelSteps.js enforces the shape and is
 * tested for it).
 *
 * Pure. Tested in funnel.test.js.
 *
 * @param purchases     purchases rows (migration 062), or null when missing
 * @param webinars      id, slug, title, kind
 * @param offers        subscriber_offers rows, or null
 * @param entitlements  user_entitlements: user_id, webinar_id, source, granted_at
 * @param users         admin_auth_users_brief rows (id, email, created_at), or null
 * @param attribution   touch_attribution rows, or null when the table is missing
 * @param kit           { tagged: [{email, tagged_at}] | null,
 *                        new_subscribers: [{email, created_at}] | null,
 *                        nurture: the Nurture funnel from kit-metrics.js | null }
 * @param range         from parseRange()
 * @param product       a webinar slug, or 'all'
 * @param now           injectable clock for the offer expiry test
 */

export const CORE_KINDS = new Set(['webinar', 'course'])
export const CORE_PRICINGS = new Set(['full', 'early_bird', 'bundle'])
export const PRICING_LABELS = {
  full: 'Full price',
  early_bird: 'Early bird',
  offer: '$39 offer',
  scholarship: 'Scholarship',
  bundle: 'Bundle',
}
export const PRIOR_STATUS = {
  tripwire: 'Bought the $39 offer first',
  lead: 'Was a lead first',
  cold: 'Cold',
}
export const ALL_PRODUCTS = 'all'

const DAY_MS = 86400000
const lower = (s) => (typeof s === 'string' && s ? s.toLowerCase() : null)
const ms = (iso) => (iso ? Date.parse(iso) : NaN)
const buyerKey = (p) => p.user_id ?? lower(p.email) ?? p.id

/** Monday of the ISO week holding `iso`, as YYYY-MM-DD. */
export function weekStart(iso) {
  const d = new Date(iso)
  const day = (d.getUTCDay() + 6) % 7
  const monday = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - day)
  return new Date(monday).toISOString().slice(0, 10)
}

/** Which day of the offer window a redemption fell on: 1 to 4, or 5 for after. */
export function offerDay(createdAt, redeemedAt) {
  const diff = ms(redeemedAt) - ms(createdAt)
  if (!Number.isFinite(diff) || diff < 0) return 1
  return Math.min(5, Math.floor(diff / DAY_MS) + 1)
}

export function buildFunnel({ purchases, webinars, offers, entitlements, users, attribution, kit, range, product = ALL_PRODUCTS, now = new Date() }) {
  const nowMs = now.getTime()
  const all = purchases ?? []
  const webinarById = new Map((webinars ?? []).map((w) => [w.id, w]))
  const productOf = (p) => webinarById.get(p.webinar_id) ?? (p.webinar_slug ? { slug: p.webinar_slug, title: p.webinar_slug, kind: null } : null)
  const products = (webinars ?? [])
    .filter((w) => CORE_KINDS.has(w.kind) && all.some((p) => p.webinar_id === w.id))
    .map((w) => ({ slug: w.slug, title: w.title, kind: w.kind }))
    .sort((a, b) => a.title.localeCompare(b.title))
  const productSlug = products.some((p) => p.slug === product) ? product : ALL_PRODUCTS
  const matchesProduct = (p) => productSlug === ALL_PRODUCTS || productOf(p)?.slug === productSlug

  // ---- Identity helpers ----
  const emailByUser = new Map()
  const userByEmail = new Map()
  for (const u of users ?? []) {
    const e = lower(u.email)
    if (!e) continue
    emailByUser.set(u.id, e)
    userByEmail.set(e, u.id)
  }
  const attrByUser = new Map()
  for (const row of attribution ?? []) {
    if (row.user_id) attrByUser.set(row.user_id, row)
    const e = lower(row.email)
    if (e && row.user_id && !userByEmail.has(e)) userByEmail.set(e, row.user_id)
    if (row.user_id && e && !emailByUser.has(row.user_id)) emailByUser.set(row.user_id, e)
  }
  for (const p of purchases ?? []) {
    const e = lower(p.email)
    if (p.user_id && e) {
      if (!emailByUser.has(p.user_id)) emailByUser.set(p.user_id, e)
      if (!userByEmail.has(e)) userByEmail.set(e, p.user_id)
    }
  }
  const userIdFor = (p) => p.user_id ?? (lower(p.email) ? userByEmail.get(lower(p.email)) ?? null : null)
  const firstTouchOf = (userId) => touchSource(touchFromRow(attrByUser.get(userId) ?? null, 'first'))
  const lastTouchOf = (userId) => touchSource(touchFromRow(attrByUser.get(userId) ?? null, 'last'))
  // A row with neither touch is the empty record a browser with storage
  // blocked sends: No record, not "(no campaign)".
  const campaignOfUser = (userId) => {
    const row = attrByUser.get(userId)
    return row && (row.first_seen_at || row.last_seen_at) ? campaignOf(row) : NO_RECORD
  }

  // ---- Step 2: leads (calculator claims) ----
  const claimAt = new Map()
  for (const e of entitlements ?? []) {
    if (e.source !== 'lead_magnet' || !e.user_id) continue
    const t = ms(e.granted_at)
    if (!Number.isFinite(t)) continue
    if (!claimAt.has(e.user_id) || t < claimAt.get(e.user_id)) claimAt.set(e.user_id, t)
  }
  const leadsInRange = [...claimAt.entries()].filter(([, t]) => inRange(t, range)).map(([userId, t]) => ({ userId, at: t }))
  const leadEmails = new Set(leadsInRange.map((l) => emailByUser.get(l.userId)).filter(Boolean))

  let kitNew = null
  let kitOverlap = null
  if (kit?.new_subscribers) {
    const seen = new Set()
    for (const s of kit.new_subscribers) {
      const e = lower(s.email)
      if (!e || !inRange(s.created_at, range) || seen.has(e)) continue
      seen.add(e)
    }
    kitNew = seen.size
    kitOverlap = [...seen].filter((e) => leadEmails.has(e)).length
  }

  const leads = {
    count: leadsInRange.length,
    kit_new: kitNew,
    kit_overlap: kitOverlap,
    kit_only: kitNew === null ? null : kitNew - kitOverlap,
    measured: fraction(leadsInRange.filter((l) => attrByUser.get(l.userId)?.first_seen_at).length, leadsInRange.length),
    sources: attribution
      ? {
          first_touch: countBy(leadsInRange, (l) => firstTouchOf(l.userId)),
          last_touch: countBy(leadsInRange, (l) => lastTouchOf(l.userId)),
          campaigns: countBy(leadsInRange, (l) => campaignOfUser(l.userId)).filter((r) => r.label !== NO_RECORD),
          landing_paths: countBy(
            leadsInRange.map((l) => attrByUser.get(l.userId)?.first_landing_path).filter(Boolean),
            (p) => p,
          ),
        }
      : null,
  }

  // ---- Step 3: entered the offer window ----
  const mintedInRange = (offers ?? []).filter((o) => inRange(o.created_at, range))
  const mintedEmails = new Set(mintedInRange.map((o) => lower(o.email)).filter(Boolean))
  let taggedEmails = null
  if (kit?.tagged) {
    taggedEmails = new Set()
    for (const s of kit.tagged) {
      const e = lower(s.email)
      if (e && inRange(s.tagged_at, range)) taggedEmails.add(e)
    }
  }
  const windowEmails = new Set(mintedEmails)
  if (taggedEmails) for (const e of taggedEmails) windowEmails.add(e)
  const claimToMint = []
  for (const o of mintedInRange) {
    const userId = userByEmail.get(lower(o.email))
    const claimed = userId ? claimAt.get(userId) : undefined
    if (claimed !== undefined) {
      const d = (ms(o.created_at) - claimed) / DAY_MS
      if (Number.isFinite(d) && d >= 0) claimToMint.push(d)
    }
  }
  const nurtureFunnel = kit?.nurture ?? null
  const nurture = {
    count: offers ? windowEmails.size : taggedEmails ? taggedEmails.size : null,
    minted: offers ? mintedEmails.size : null,
    tagged: taggedEmails ? taggedEmails.size : null,
    overlap: offers && taggedEmails ? [...mintedEmails].filter((e) => taggedEmails.has(e)).length : null,
    claim_to_mint_days: medianDays(claimToMint),
    claim_to_mint_measured: fraction(claimToMint.length, mintedInRange.length),
    emails: nurtureFunnel
      ? (nurtureFunnel.emails ?? []).map((e) => ({
          position: e.position,
          subject: e.subject,
          recipients: e.recipients,
          open_rate: e.open_rate,
          click_rate: e.click_rate,
          unsubscribe_rate: e.unsubscribe_rate,
        }))
      : null,
    nurture_entered: nurtureFunnel?.entered ?? null,
    nurture_unsubscribed: nurtureFunnel?.unsubscribed ?? null,
    nurture_in_progress: nurtureFunnel?.in_progress ?? null,
  }

  // ---- Step 4: tripwire ($39 offer) bought ----
  const tripwireInRange = all.filter((p) => p.pricing === 'offer' && inRange(p.purchased_at, range))
  const expiredInRange = (offers ?? []).filter((o) => inRange(o.expires_at, range))
  const expiredUnused = expiredInRange.filter((o) => !o.redeemed_at)
  const byDay = new Map([
    ['Day 1', 0],
    ['Day 2', 0],
    ['Day 3', 0],
    ['Day 4', 0],
    ['After the window', 0],
  ])
  const dayLabels = [...byDay.keys()]
  for (const o of mintedInRange) {
    if (!o.redeemed_at) continue
    const label = dayLabels[offerDay(o.created_at, o.redeemed_at) - 1]
    byDay.set(label, byDay.get(label) + 1)
  }
  const weeks = new Map()
  for (const o of mintedInRange) {
    const w = weekStart(o.created_at)
    const row = weeks.get(w) ?? { week: w, minted: 0, seen: 0, redeemed: 0 }
    row.minted += 1
    if (o.first_seen_at) row.seen += 1
    if (o.redeemed_at) row.redeemed += 1
    weeks.set(w, row)
  }
  const boughtFullLater = (o) =>
    all.some(
      (p) =>
        p.webinar_id === o.webinar_id &&
        p.pricing !== 'offer' &&
        lower(p.email) === lower(o.email) &&
        ms(p.purchased_at) > ms(o.expires_at),
    )
  const offer = {
    count: purchases ? tripwireInRange.length : null,
    expired: offers ? fraction(expiredInRange.filter((o) => o.redeemed_at).length, expiredInRange.length) : null,
    stages: offers
      ? {
          minted: mintedInRange.length,
          seen: mintedInRange.filter((o) => o.first_seen_at).length,
          redeemed: mintedInRange.filter((o) => o.redeemed_at).length,
          forwarded: mintedInRange.filter((o) => o.redeemed_at && o.redeemed_email && lower(o.redeemed_email) !== lower(o.email)).length,
        }
      : null,
    by_day: offers ? [...byDay.entries()].map(([label, value]) => ({ label, value })) : null,
    by_week: offers ? [...weeks.values()].sort((a, b) => a.week.localeCompare(b.week)).slice(-26) : null,
    expired_then_full: offers && purchases ? fraction(expiredUnused.filter(boughtFullLater).length, expiredUnused.length) : null,
  }

  // ---- Step 5: core workshop bought ----
  const isCore = (p) => CORE_PRICINGS.has(p.pricing) && CORE_KINDS.has(productOf(p)?.kind)
  const coreInRange = all.filter((p) => isCore(p) && inRange(p.purchased_at, range) && matchesProduct(p))
  const priorStatus = (p) => {
    const userId = userIdFor(p)
    const t = ms(p.purchased_at)
    const key = buyerKey(p)
    const hadOffer = all.some((q) => q.pricing === 'offer' && buyerKey(q) === key && ms(q.purchased_at) < t)
    if (hadOffer) return PRIOR_STATUS.tripwire
    if (userId && claimAt.has(userId) && claimAt.get(userId) < t) return PRIOR_STATUS.lead
    return PRIOR_STATUS.cold
  }
  const leadDays = []
  const touchDays = []
  let wasLead = 0
  for (const p of coreInRange) {
    const userId = userIdFor(p)
    const claimed = userId ? claimAt.get(userId) : undefined
    if (claimed !== undefined && claimed < ms(p.purchased_at)) {
      wasLead += 1
      leadDays.push((ms(p.purchased_at) - claimed) / DAY_MS)
    }
    const firstSeen = userId ? attrByUser.get(userId)?.first_seen_at : null
    if (firstSeen) {
      const d = daysBetween(firstSeen, p.purchased_at)
      if (d !== null && d >= 0) touchDays.push(d)
    }
  }
  const core = {
    count: purchases ? coreInRange.length : null,
    was_lead: fraction(wasLead, coreInRange.length),
    lead_to_purchase_days: medianDays(leadDays),
    by_product: countBy(coreInRange, (p) => productOf(p)?.title ?? 'Unknown product'),
    by_pricing: countBy(coreInRange, (p) => PRICING_LABELS[p.pricing] ?? p.pricing),
    by_prior_status: countBy(coreInRange, priorStatus),
    by_first_touch: attribution ? countBy(coreInRange, (p) => (userIdFor(p) ? firstTouchOf(userIdFor(p)) : NO_RECORD)) : null,
    first_touch_days: medianDays(touchDays),
    first_touch_measured: fraction(touchDays.length, coreInRange.length),
    scholarships: all.filter((p) => p.pricing === 'scholarship' && inRange(p.purchased_at, range) && matchesProduct(p)).length,
  }

  // ---- Step 6: bought again ----
  const byBuyer = new Map()
  for (const p of all) {
    const k = buyerKey(p)
    if (!byBuyer.has(k)) byBuyer.set(k, [])
    byBuyer.get(k).push(p)
  }
  const againInRange = []
  let priorBuyers = 0
  let twice = 0
  for (const [, list] of byBuyer) {
    list.sort((a, b) => ms(a.purchased_at) - ms(b.purchased_at))
    if (list.length >= 2) twice += 1
    const first = ms(list[0].purchased_at)
    if (range.fromMs === null || first < range.fromMs) priorBuyers += 1
    for (let i = 1; i < list.length; i += 1) {
      const p = list[i]
      if (inRange(p.purchased_at, range) && matchesProduct(p)) againInRange.push({ previous: list[i - 1], purchase: p })
    }
  }
  const repeatBuyers = new Set(againInRange.map(({ purchase }) => buyerKey(purchase)))
  const repeat = {
    count: purchases ? repeatBuyers.size : null,
    prior_buyers: purchases ? priorBuyers : null,
    matrix: countBy(
      againInRange,
      ({ previous, purchase }) => `${productOf(previous)?.title ?? 'Unknown'} then ${productOf(purchase)?.title ?? 'Unknown'}`,
    ),
    days_between: medianDays(againInRange.map(({ previous, purchase }) => (ms(purchase.purchased_at) - ms(previous.purchased_at)) / DAY_MS)),
    twice_share: purchases ? fraction(twice, byBuyer.size) : null,
  }

  // ---- Sources: conversion tables by touch ----
  const sources = attribution
    ? {
        first_touch: sourceTable(leadsInRange, tripwireInRange, coreInRange, (userId) => firstTouchOf(userId), userIdFor),
        last_touch: sourceTable(leadsInRange, tripwireInRange, coreInRange, (userId) => lastTouchOf(userId), userIdFor),
        campaigns: sourceTable(leadsInRange, tripwireInRange, coreInRange, (userId) => campaignOfUser(userId), userIdFor),
      }
    : null

  return {
    product: productSlug,
    products,
    leads,
    nurture,
    offer,
    core,
    repeat,
    sources,
    offers_expiring_soon: (offers ?? []).filter((o) => !o.redeemed_at && ms(o.expires_at) > nowMs).length,
  }
}

/** One conversion table: per source bucket, how many leads, tripwire buyers
 *  and core buyers in the window. Only counts leave the server. */
function sourceTable(leads, tripwire, core, bucketOf, userIdFor) {
  const rows = new Map()
  const bump = (label, key) => {
    const row = rows.get(label) ?? { label, leads: 0, tripwire: 0, core: 0 }
    row[key] += 1
    rows.set(label, row)
  }
  for (const l of leads) bump(bucketOf(l.userId), 'leads')
  for (const p of tripwire) {
    const userId = userIdFor(p)
    bump(userId ? bucketOf(userId) : NO_RECORD, 'tripwire')
  }
  for (const p of core) {
    const userId = userIdFor(p)
    bump(userId ? bucketOf(userId) : NO_RECORD, 'core')
  }
  return [...rows.values()]
    .sort((a, b) => b.leads + b.tripwire + b.core - (a.leads + a.tripwire + a.core) || a.label.localeCompare(b.label))
    .slice(0, 12)
}
