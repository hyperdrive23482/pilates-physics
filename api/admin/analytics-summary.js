import { supabaseAdmin } from '../_lib/supabase-admin.js'
import { requireAdmin } from '../_lib/require-admin.js'

const ENGAGEMENT_TYPES = [
  'portal_view',
  'content_click',
  'download',
  'tool_open',
  'certificate_download',
]

const ACTIVITY_CAP = 50000
const ACTIVE_WINDOW_DAYS = 30

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const admin = await requireAdmin(req, res)
  if (!admin) return

  try {
    const [workshopsRes, entitlementsRes, questionsRes, stripeRes, usersRes, activityRes, contentRes] =
      await Promise.all([
        supabaseAdmin.from('webinars').select('id, title, slug, status, price_cents, scheduled_at'),
        supabaseAdmin.from('user_entitlements').select('id, user_id, webinar_id, source'),
        supabaseAdmin.from('webinar_questions').select('id, webinar_id, is_answered'),
        supabaseAdmin.from('stripe_events').select('webinar_id, status, event_type, payload'),
        supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
        // Aggregated in JS rather than SQL, matching the rest of this handler.
        // Fine at current volume; move to a database view if activity_events
        // outgrows the cap, which is reported below rather than hidden.
        supabaseAdmin
          .from('activity_events')
          .select('user_id, event_type, webinar_id, webinar_slug, content_id, tool_slug, metadata, created_at')
          .in('event_type', ENGAGEMENT_TYPES)
          .order('id', { ascending: false })
          .limit(ACTIVITY_CAP),
        supabaseAdmin.from('webinar_content').select('id, title, type, webinar_id'),
      ])

    for (const r of [workshopsRes, entitlementsRes, questionsRes, stripeRes, activityRes, contentRes]) {
      if (r.error) throw r.error
    }
    if (usersRes.error) throw usersRes.error

    const workshops = workshopsRes.data ?? []
    const entitlements = entitlementsRes.data ?? []
    const questions = questionsRes.data ?? []
    const events = stripeRes.data ?? []

    // Per-workshop breakdown
    const perWorkshop = workshops.map((w) => {
      const wEnt = entitlements.filter((e) => e.webinar_id === w.id)
      const paidEnt = wEnt.filter((e) => e.source === 'stripe')
      const wQuestions = questions.filter((q) => q.webinar_id === w.id)
      // Actual revenue: sum the real charged amount (Stripe Checkout
      // `amount_total`, in cents) from each successful purchase event, rather
      // than price × count — so promo-code discounts and past price changes are
      // reflected. 'processed' and 'kit_failed' both mean the sale completed
      // (kit_failed = only Kit.com tagging failed); 'failed' rows are excluded
      // (provisioning errors to reconcile manually). Amounts are treated as USD
      // cents; revisit if Adaptive Pricing foreign-currency sales become common.
      const revenueCents = events
        .filter(
          (e) =>
            e.webinar_id === w.id &&
            e.event_type === 'checkout.session.completed' &&
            (e.status === 'processed' || e.status === 'kit_failed')
        )
        .reduce((sum, e) => sum + (e.payload?.amount_total ?? 0), 0)
      return {
        id: w.id,
        title: w.title,
        slug: w.slug,
        status: w.status,
        scheduled_at: w.scheduled_at,
        enrollments: wEnt.length,
        paid_enrollments: paidEnt.length,
        questions: wQuestions.length,
        unanswered_questions: wQuestions.filter((q) => !q.is_answered).length,
        revenue_cents: revenueCents,
      }
    })

    // ---- Engagement ----
    const activity = activityRes.data ?? []
    const allUsers = usersRes.data.users ?? []

    // "Have my buyers ever signed in?" is deliberately answered from
    // auth.users.last_sign_in_at, not from activity_events. Event logging only
    // started in August 2026, so counting logins from it would report almost
    // every existing customer as never having signed in. last_sign_in_at
    // covers the whole history of the account.
    const buyerIds = new Set(
      entitlements.filter((e) => e.source === 'stripe').map((e) => e.user_id)
    )
    const buyers = allUsers.filter((u) => buyerIds.has(u.id))
    const buyersSignedIn = buyers.filter((u) => u.last_sign_in_at).length

    const since = Date.now() - ACTIVE_WINDOW_DAYS * 86400000
    const activeUsers = new Set(
      activity.filter((e) => new Date(e.created_at).getTime() >= since).map((e) => e.user_id)
    )
    activeUsers.delete(null)

    // Content and tools are counted by distinct people, not raw hits: one
    // person replaying a recording ten times is one person who wanted it.
    const contentTitles = new Map((contentRes.data ?? []).map((c) => [c.id, c]))
    const tally = (rows, keyOf, labelOf) => {
      const acc = new Map()
      for (const row of rows) {
        const key = keyOf(row)
        if (!key) continue
        if (!acc.has(key)) acc.set(key, { key, label: labelOf(row), opens: 0, users: new Set() })
        const entry = acc.get(key)
        entry.opens += 1
        if (row.user_id) entry.users.add(row.user_id)
      }
      return [...acc.values()]
        .map(({ key, label, opens, users }) => ({ key, label, opens, distinct_users: users.size }))
        .sort((a, b) => b.distinct_users - a.distinct_users || b.opens - a.opens)
    }

    const contentEngagement = tally(
      activity.filter((e) => e.event_type === 'content_click' || e.event_type === 'download'),
      (e) => e.content_id ?? e.metadata?.content_title ?? null,
      (e) => contentTitles.get(e.content_id)?.title ?? e.metadata?.content_title ?? 'Untitled'
    )

    const toolEngagement = tally(
      activity.filter((e) => e.event_type === 'tool_open'),
      (e) => e.tool_slug ?? e.webinar_slug ?? null,
      (e) => e.tool_slug ?? e.webinar_slug ?? 'Unknown tool'
    )

    const engagement = {
      buyers: buyers.length,
      buyers_signed_in: buyersSignedIn,
      buyers_never_signed_in: buyers.length - buyersSignedIn,
      active_users_30d: activeUsers.size,
      recorded_events: activity.length,
      // Surfaced rather than silently truncating: a capped read must say so.
      truncated: activity.length === ACTIVITY_CAP,
      content: contentEngagement,
      tools: toolEngagement,
    }

    const totals = {
      total_users: usersRes.data.users?.length ?? 0,
      total_workshops: workshops.length,
      total_enrollments: entitlements.length,
      total_revenue_cents: perWorkshop.reduce((sum, w) => sum + w.revenue_cents, 0),
      total_questions: questions.length,
      stripe_event_count: events.length,
      stripe_failed_events: events.filter((e) => e.status !== 'processed').length,
    }

    return res.status(200).json({ totals, per_workshop: perWorkshop, engagement })
  } catch (err) {
    console.error('analytics-summary error:', err)
    return res.status(500).json({ error: err.message ?? 'Internal error' })
  }
}
