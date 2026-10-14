import { supabaseAdmin } from '../supabase-admin.js'
import { soft, unwrap } from './shared.js'

/**
 * The data sources health strip at the top of the Revenue tab: whether each
 * Phase 0 source has started producing rows. The same shape
 * api/admin/analytics-summary.js returns as `data_sources`, so the
 * DataSources component renders either.
 *
 * `purchases` is passed in when the caller already read the ledger, so the
 * strip costs two small reads rather than three.
 */
export async function loadDataSources({ purchases = undefined, errors }) {
  const [ledger, attributionRows, snapshots] = await Promise.all([
    purchases !== undefined
      ? purchases
      : soft('purchases', errors, async () =>
          unwrap(await supabaseAdmin.from('purchases').select('id, needs_settlement_lookup')),
        ),
    soft('attribution', errors, async () =>
      unwrap(await supabaseAdmin.from('touch_attribution').select('recorded_via, first_seen_at')),
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

  const attributionByVia = {}
  let attributionWithRecord = 0
  for (const r of attributionRows ?? []) {
    attributionByVia[r.recorded_via] = (attributionByVia[r.recorded_via] ?? 0) + 1
    if (r.first_seen_at) attributionWithRecord += 1
  }

  return {
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
}
