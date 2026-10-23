import { supabaseAdmin } from '../_lib/supabase-admin.js'
import { getEmailStats, getGrowthStats } from '../_lib/kit.js'
import { FUNNEL_TAGS, loadBrandDrift, loadTagCounts } from '../_lib/kit-metrics.js'

// Vercel Cron: GET /api/cron/daily-snapshot, 06:00 UTC daily.
//
// Writes one daily_snapshots row (migration 063) of the numbers that are only
// observable live: Kit list size and tag counts, total accounts, cumulative
// revenue, live offers. Kit keeps no tag history and only 30 days of growth,
// so this is the only way "subscribers over the last year" ever gets charted.
//
// Idempotent: re-running on the same UTC day overwrites that day's row.
// Each section fails on its own and lands in `errors`, so a Kit outage costs
// one section rather than the day.

const isoDate = (d) => d.toISOString().slice(0, 10)

async function section(name, errors, fn) {
  try {
    return await fn()
  } catch (err) {
    console.error(`daily-snapshot ${name}:`, err)
    errors[name] = err.message ?? String(err)
    return null
  }
}

async function kitSection(today) {
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
  const [growth, email, brand] = await Promise.all([
    getGrowthStats({ starting: isoDate(yesterday), ending: isoDate(today) }),
    getEmailStats(),
    loadBrandDrift(),
  ])
  return {
    subscribers: growth?.subscribers ?? null,
    // Active subscribers carrying neither brand tag; should stay 0.
    brand_tag_missing: brand.missing,
    new_1d: growth?.new_subscribers ?? null,
    cancellations_1d: growth ? Math.abs(growth.cancellations ?? 0) : null,
    email_90d: email
      ? {
          sent: email.sent,
          open_rate: email.open_rate,
          click_rate: email.click_rate,
          unsubscribe_rate: email.unsubscribe_rate,
          bounce_rate: email.bounce_rate,
        }
      : null,
  }
}

async function tagsSection() {
  // The funnel tags plus every product's Kit tag, so a buyer-tag count exists
  // per product per day.
  const { data: products, error } = await supabaseAdmin
    .from('webinars')
    .select('kit_tag')
    .not('kit_tag', 'is', null)
  if (error) throw error
  const known = new Set(FUNNEL_TAGS.map((t) => t.tag))
  const extra = [...new Set((products ?? []).map((p) => p.kit_tag).filter((t) => t && !known.has(t)))].map(
    (tag) => ({ tag, label: tag }),
  )
  const rows = await loadTagCounts([...FUNNEL_TAGS, ...extra])
  const out = {}
  for (const r of rows) out[r.tag] = r.missing ? null : r.count
  return out
}

async function usersSection() {
  const [{ data: total, error: countErr }, { data: ents, error: entErr }] = await Promise.all([
    supabaseAdmin.rpc('count_auth_users'),
    supabaseAdmin.from('user_entitlements').select('source'),
  ])
  if (countErr) throw countErr
  if (entErr) throw entErr
  const bySource = {}
  for (const e of ents ?? []) bySource[e.source ?? 'unknown'] = (bySource[e.source ?? 'unknown'] ?? 0) + 1
  return { total_accounts: total ?? null, entitlements_by_source: bySource }
}

async function revenueSection() {
  const { data, error } = await supabaseAdmin
    .from('admin_revenue_daily')
    .select('orders, gross_cents, refund_cents, dispute_lost_cents, unsettled_orders')
  if (error) throw error
  const sum = (k) => (data ?? []).reduce((acc, r) => acc + (r[k] ?? 0), 0)
  const gross = sum('gross_cents')
  const refunds = sum('refund_cents')
  const lost = sum('dispute_lost_cents')
  return {
    orders: sum('orders'),
    gross_cents: gross,
    refund_cents: refunds,
    dispute_lost_cents: lost,
    net_cents: gross - refunds - lost,
    unsettled_orders: sum('unsettled_orders'),
  }
}

async function offersSection() {
  const { data, error } = await supabaseAdmin.from('subscriber_offers').select('expires_at, redeemed_at')
  if (error) throw error
  const now = Date.now()
  let redeemed = 0
  let live = 0
  for (const r of data ?? []) {
    if (r.redeemed_at) redeemed += 1
    else if (new Date(r.expires_at).getTime() > now) live += 1
  }
  return { minted: (data ?? []).length, redeemed, live }
}

export default async function handler(req, res) {
  const auth = req.headers.authorization
  const expected = process.env.CRON_SECRET
  if (expected && auth !== `Bearer ${expected}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const today = new Date()
  const errors = {}
  const kitConfigured = Boolean(process.env.KIT_API_KEY)

  const [kit, tags, users, revenue, offers] = await Promise.all([
    kitConfigured ? section('kit', errors, () => kitSection(today)) : null,
    kitConfigured ? section('tags', errors, tagsSection) : null,
    section('users', errors, usersSection),
    section('revenue', errors, revenueSection),
    section('offers', errors, offersSection),
  ])
  if (!kitConfigured) errors.kit = 'KIT_API_KEY is not set'

  try {
    const { error } = await supabaseAdmin
      .from('daily_snapshots')
      .upsert({ snapshot_date: isoDate(today), kit, tags, users, revenue, offers, errors }, { onConflict: 'snapshot_date' })
    if (error) throw error
    console.log(`daily-snapshot: wrote ${isoDate(today)}${Object.keys(errors).length ? ` with errors ${JSON.stringify(errors)}` : ''}`)
    return res.status(200).json({ ok: true, snapshot_date: isoDate(today), errors })
  } catch (err) {
    console.error('daily-snapshot write failed:', err)
    return res.status(500).json({ error: err.message ?? 'Internal error', errors })
  }
}
