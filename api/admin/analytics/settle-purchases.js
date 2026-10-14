import { requireAdmin } from '../../_lib/require-admin.js'
import { settlePendingPurchases } from '../../_lib/purchases.js'

// POST /api/admin/analytics/settle-purchases
//
// Fills settled_usd_cents and stripe_fee_cents on purchases rows still flagged
// needs_settlement_lookup, 25 at a time (one Stripe read each). The backfill in
// migration 062 flags every historical row, so this is run a few times after
// the migration lands and then only when a webhook-time lookup failed.
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const admin = await requireAdmin(req, res)
  if (!admin) return

  try {
    const result = await settlePendingPurchases({ limit: 25 })
    return res.status(200).json(result)
  } catch (err) {
    console.error('settle-purchases error:', err)
    return res.status(500).json({ error: err.message ?? 'Internal error' })
  }
}
