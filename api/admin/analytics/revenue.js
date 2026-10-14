import { supabaseAdmin } from '../../_lib/supabase-admin.js'
import { requireAdmin } from '../../_lib/require-admin.js'
import { parseRange, soft, unwrap } from '../../_lib/analytics/shared.js'
import { buildRevenue } from '../../_lib/analytics/revenue.js'
import { loadDataSources } from '../../_lib/analytics/data-sources.js'

// GET /api/admin/analytics/revenue?range=30d
//
// The Revenue tab: headline KPIs for the range, a daily series for the period
// chart, by-product and by-pricing-tier tables, the launch view per dated
// workshop, and the data sources health strip.
//
// Reads the purchases ledger (migration 062). When the ledger is missing the
// revenue block is null and `errors.purchases` says why; the strip still
// renders so the admin can see which migration is pending.

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const admin = await requireAdmin(req, res)
  if (!admin) return

  const errors = {}
  const range = parseRange(req.query)

  try {
    const [webinars, purchases] = await Promise.all([
      soft('webinars', errors, async () =>
        unwrap(
          await supabaseAdmin
            .from('webinars')
            .select('id, title, slug, kind, status, scheduled_at, early_bird_ends_at, early_bird_price_cents'),
        ),
      ),
      soft('purchases', errors, async () =>
        unwrap(
          await supabaseAdmin
            .from('purchases')
            .select(
              'id, user_id, email, webinar_id, webinar_slug, pricing, presentment_currency, presentment_amount_cents, settled_usd_cents, stripe_fee_cents, discount_cents, refund_usd_cents, refunded_at, dispute_status, disputed_at, needs_settlement_lookup, purchased_at',
            ),
        ),
      ),
    ])

    const revenue = purchases ? buildRevenue({ purchases, webinars: webinars ?? [], range }) : null
    const dataSources = await loadDataSources({ purchases, errors })

    return res.status(200).json({
      range: { range: range.range, from: range.from, to: range.to },
      revenue,
      data_sources: dataSources,
      errors,
    })
  } catch (err) {
    console.error('analytics/revenue error:', err)
    return res.status(500).json({ error: err.message ?? 'Internal error' })
  }
}
