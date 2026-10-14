import { supabaseAdmin } from '../_lib/supabase-admin.js'
import { requireAdmin } from '../_lib/require-admin.js'

// GET /api/admin/analytics-summary
//
// Totals, per-workshop rows and engagement for the admin Dashboard, Workshops
// and Analytics pages, plus the Phase 0 additions the Analytics page charts:
// daily revenue, daily new accounts, and a data-sources health block.
//
// Revenue comes from the purchases ledger (migration 062): settled USD net of
// refunds and lost disputes. Engagement comes from the SQL views in 063 rather
// than a capped read of raw activity_events. Account counts come from the
// security-definer counters in 063 rather than a 1000-row listUsers page.
//
// Every read that depends on a migration is soft: if the view or function is
// missing (deployed ahead of a db push) that block is null and the reason
// lands in data_sources.errors, and the page still renders what it can.

const ENGAGEMENT_TYPES = ['portal_view', 'content_click', 'download', 'tool_open', 'certificate_download']
const ACTIVE_WINDOW_DAYS = 30
const LEGACY_ACTIVITY_CAP = 50000

async function soft(name, errors, fn) {
  try {
    return await fn()
  } catch (err) {
    errors[name] = err.message ?? String(err)
    return null
  }
}

const unwrap = ({ data, error }) => {
  if (error) throw error
  return data
}

const utcDay = (iso) => new Date(iso).toISOString().slice(0, 10)

/** Net USD cents for one ledger row. */
function netCents(p) {
  const gross = p.settled_usd_cents ?? (p.presentment_currency === 'usd' ? p.presentment_amount_cents : 0)
  const lost = p.dispute_status === 'lost' ? gross : 0
  return gross - (p.refund_usd_cents ?? 0) - lost
}

// Pre-062 revenue: sum Checkout amount_total off stripe_events payloads. Kept
// as the fallback for the window between deploy and db push.
function legacyRevenueByWorkshop(events) {
  const out = new Map()
  for (const e of events) {
    if (e.event_type !== 'checkout.session.completed') continue
    if (e.status !== 'processed' && e.status !== 'kit_failed') continue
    out.set(e.webinar_id, (out.get(e.webinar_id) ?? 0) + (e.payload?.amount_total ?? 0))
  }
  return out
}

async function legacyUsers() {
  const users = []
  for (let page = 1; page <= 50; page += 1) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) throw error
    users.push(...(data.users ?? []))
    if ((data.users ?? []).length < 1000) break
  }
  return users.map((u) => ({ id: u.id, email: u.email, created_at: u.created_at, last_sign_in_at: u.last_sign_in_at }))
}

async function legacyEngagementItems(contentTitles) {
  const rows = unwrap(
    await supabaseAdmin
      .from('activity_events')
      .select('user_id, event_type, webinar_slug, content_id, tool_slug, metadata')
      .in('event_type', ENGAGEMENT_TYPES)
      .order('id', { ascending: false })
      .limit(LEGACY_ACTIVITY_CAP),
  )
  const acc = new Map()
  for (const r of rows ?? []) {
    const key = `${r.event_type}|${r.content_id ?? r.tool_slug ?? r.webinar_slug ?? r.metadata?.content_title ?? 'unknown'}`
    if (!acc.has(key)) {
      acc.set(key, {
        event_type: r.event_type,
        item_key: r.content_id ?? r.tool_slug ?? r.webinar_slug ?? r.metadata?.content_title ?? 'unknown',
        label: contentTitles.get(r.content_id)?.title ?? r.metadata?.content_title ?? r.tool_slug ?? r.webinar_slug ?? 'Untitled',
        opens: 0,
        users: new Set(),
      })
    }
    const entry = acc.get(key)
    entry.opens += 1
    if (r.user_id) entry.users.add(r.user_id)
  }
  return {
    items: [...acc.values()].map(({ users, ...rest }) => ({ ...rest, distinct_users: users.size })),
    truncated: (rows ?? []).length === LEGACY_ACTIVITY_CAP,
  }
}

function rankItems(items, types) {
  const acc = new Map()
  for (const it of items) {
    if (!types.includes(it.event_type)) continue
    const entry = acc.get(it.item_key) ?? { key: it.item_key, label: it.label, opens: 0, distinct_users: 0 }
    entry.opens += it.opens
    // Distinct people across event types of the same item cannot be summed
    // exactly; the larger of the two is the honest lower bound.
    entry.distinct_users = Math.max(entry.distinct_users, it.distinct_users)
    acc.set(it.item_key, entry)
  }
  return [...acc.values()].sort((a, b) => b.distinct_users - a.distinct_users || b.opens - a.opens)
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const admin = await requireAdmin(req, res)
  if (!admin) return

  const errors = {}

  try {
    const since = new Date(Date.now() - ACTIVE_WINDOW_DAYS * 86400000).toISOString()

    const [
      workshops,
      entitlements,
      questions,
      stripeEvents,
      contentRows,
      purchases,
      users,
      usersDaily,
      engagementItems,
      activeUsers,
      attributionRows,
      snapshots,
    ] = await Promise.all([
      unwrap(await supabaseAdmin.from('webinars').select('id, title, slug, status, price_cents, scheduled_at')),
      unwrap(await supabaseAdmin.from('user_entitlements').select('id, user_id, webinar_id, source')),
      unwrap(await supabaseAdmin.from('webinar_questions').select('id, webinar_id, is_answered')),
      unwrap(await supabaseAdmin.from('stripe_events').select('webinar_id, status, event_type, payload')),
      unwrap(await supabaseAdmin.from('webinar_content').select('id, title, type, webinar_id')),
      soft('purchases', errors, async () =>
        unwrap(
          await supabaseAdmin
            .from('purchases')
            .select(
              'id, webinar_id, pricing, settled_usd_cents, presentment_currency, presentment_amount_cents, refund_usd_cents, dispute_status, purchased_at, needs_settlement_lookup, user_id',
            ),
        ),
      ),
      soft('users', errors, async () => unwrap(await supabaseAdmin.rpc('admin_auth_users_brief'))),
      soft('users_daily', errors, async () => unwrap(await supabaseAdmin.rpc('admin_auth_users_daily'))),
      soft('engagement', errors, async () =>
        unwrap(
          await supabaseAdmin
            .from('admin_engagement_by_item')
            .select('event_type, item_key, label, webinar_id, opens, distinct_users'),
        ),
      ),
      soft('active_users', errors, async () => unwrap(await supabaseAdmin.rpc('count_active_users', { p_since: since }))),
      soft('attribution', errors, async () =>
        unwrap(await supabaseAdmin.from('touch_attribution').select('recorded_via, first_seen_at, created_at')),
      ),
      soft('snapshots', errors, async () =>
        unwrap(
          await supabaseAdmin
            .from('daily_snapshots')
            .select('snapshot_date, errors')
            .order('snapshot_date', { ascending: false })
            .limit(400),
        ),
      ),
    ])

    const contentTitles = new Map((contentRows ?? []).map((c) => [c.id, c]))

    // ---- Revenue ----
    const ledger = purchases ?? null
    const legacyRevenue = ledger ? null : legacyRevenueByWorkshop(stripeEvents ?? [])
    const revenueByWorkshop = new Map()
    const ordersByWorkshop = new Map()
    const revenueDailyMap = new Map()
    if (ledger) {
      for (const p of ledger) {
        const net = netCents(p)
        revenueByWorkshop.set(p.webinar_id, (revenueByWorkshop.get(p.webinar_id) ?? 0) + net)
        ordersByWorkshop.set(p.webinar_id, (ordersByWorkshop.get(p.webinar_id) ?? 0) + 1)
        const day = utcDay(p.purchased_at)
        const d = revenueDailyMap.get(day) ?? { date: day, value: 0, orders: 0 }
        d.value += net
        d.orders += 1
        revenueDailyMap.set(day, d)
      }
    }
    const revenueDaily = [...revenueDailyMap.values()].sort((a, b) => a.date.localeCompare(b.date))

    // ---- Per workshop ----
    const perWorkshop = (workshops ?? []).map((w) => {
      const wEnt = (entitlements ?? []).filter((e) => e.webinar_id === w.id)
      const wQuestions = (questions ?? []).filter((q) => q.webinar_id === w.id)
      return {
        id: w.id,
        title: w.title,
        slug: w.slug,
        status: w.status,
        scheduled_at: w.scheduled_at,
        enrollments: wEnt.length,
        paid_enrollments: wEnt.filter((e) => e.source === 'stripe').length,
        orders: ledger ? ordersByWorkshop.get(w.id) ?? 0 : null,
        questions: wQuestions.length,
        unanswered_questions: wQuestions.filter((q) => !q.is_answered).length,
        revenue_cents: ledger ? revenueByWorkshop.get(w.id) ?? 0 : legacyRevenue.get(w.id) ?? 0,
      }
    })

    // ---- Users ----
    const allUsers = users ?? (await soft('users_legacy', errors, legacyUsers)) ?? []
    const buyerIds = new Set((entitlements ?? []).filter((e) => e.source === 'stripe').map((e) => e.user_id))
    const buyers = allUsers.filter((u) => buyerIds.has(u.id))
    const buyersSignedIn = buyers.filter((u) => u.last_sign_in_at).length

    // ---- Engagement ----
    let items = engagementItems
    let truncated = false
    if (!items) {
      const legacy = await soft('engagement_legacy', errors, () => legacyEngagementItems(contentTitles))
      items = legacy?.items ?? []
      truncated = legacy?.truncated ?? false
    }
    const engagement = {
      buyers: buyers.length,
      buyers_signed_in: buyersSignedIn,
      buyers_never_signed_in: buyers.length - buyersSignedIn,
      active_users_30d: activeUsers ?? null,
      recorded_events: items.reduce((acc, it) => acc + it.opens, 0),
      truncated,
      content: rankItems(items, ['content_click', 'download']),
      tools: rankItems(items, ['tool_open']),
    }

    // ---- Totals ----
    const totalRevenue = ledger
      ? ledger.reduce((acc, p) => acc + netCents(p), 0)
      : perWorkshop.reduce((sum, w) => sum + w.revenue_cents, 0)
    const totals = {
      total_users: allUsers.length,
      total_workshops: (workshops ?? []).length,
      total_enrollments: (entitlements ?? []).length,
      total_revenue_cents: totalRevenue,
      total_orders: ledger ? ledger.length : null,
      total_questions: (questions ?? []).length,
      stripe_event_count: (stripeEvents ?? []).length,
      stripe_failed_events: (stripeEvents ?? []).filter((e) => e.status !== 'processed').length,
    }

    // ---- Phase 0 data sources ----
    const attributionByVia = {}
    let attributionWithRecord = 0
    for (const r of attributionRows ?? []) {
      attributionByVia[r.recorded_via] = (attributionByVia[r.recorded_via] ?? 0) + 1
      if (r.first_seen_at) attributionWithRecord += 1
    }
    const dataSources = {
      posthog_server: Boolean(process.env.POSTHOG_API_KEY && process.env.POSTHOG_PROJECT_ID),
      posthog_client: Boolean(process.env.VITE_POSTHOG_KEY),
      revenue_source: ledger ? 'purchases' : 'stripe_events',
      purchases_rows: ledger ? ledger.length : null,
      purchases_unsettled: ledger ? ledger.filter((p) => p.needs_settlement_lookup).length : null,
      attribution_rows: attributionRows ? attributionRows.length : null,
      attribution_with_record: attributionRows ? attributionWithRecord : null,
      attribution_by_via: attributionRows ? attributionByVia : null,
      snapshots_count: snapshots ? snapshots.length : null,
      latest_snapshot: snapshots?.[0]?.snapshot_date ?? null,
      latest_snapshot_errors: snapshots?.[0]?.errors ?? null,
      errors,
    }

    return res.status(200).json({
      totals,
      per_workshop: perWorkshop,
      engagement,
      revenue_daily: revenueDaily,
      users_daily: (usersDaily ?? []).map((r) => ({ date: r.day, value: r.new_users })),
      data_sources: dataSources,
    })
  } catch (err) {
    console.error('analytics-summary error:', err)
    return res.status(500).json({ error: err.message ?? 'Internal error' })
  }
}
