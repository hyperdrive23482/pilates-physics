import { supabaseAdmin } from '../_lib/supabase-admin.js'
import { requireAdmin } from '../_lib/require-admin.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const admin = await requireAdmin(req, res)
  if (!admin) return

  try {
    const [workshopsRes, entitlementsRes, questionsRes, stripeRes, usersRes] = await Promise.all([
      supabaseAdmin.from('webinars').select('id, title, slug, status, price_cents, scheduled_at'),
      supabaseAdmin.from('user_entitlements').select('id, webinar_id, source'),
      supabaseAdmin.from('webinar_questions').select('id, webinar_id, is_answered'),
      supabaseAdmin.from('stripe_events').select('webinar_id, status, event_type, payload'),
      supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    ])

    for (const r of [workshopsRes, entitlementsRes, questionsRes, stripeRes]) {
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

    const totals = {
      total_users: usersRes.data.users?.length ?? 0,
      total_workshops: workshops.length,
      total_enrollments: entitlements.length,
      total_revenue_cents: perWorkshop.reduce((sum, w) => sum + w.revenue_cents, 0),
      total_questions: questions.length,
      stripe_event_count: events.length,
      stripe_failed_events: events.filter((e) => e.status !== 'processed').length,
    }

    return res.status(200).json({ totals, per_workshop: perWorkshop })
  } catch (err) {
    console.error('analytics-summary error:', err)
    return res.status(500).json({ error: err.message ?? 'Internal error' })
  }
}
