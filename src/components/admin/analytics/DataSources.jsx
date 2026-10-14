import { useState } from 'react'
import { useAdminAPI } from '../../../hooks/admin/useAdminAPI'
import { BAD, OK, Section, WARN } from './primitives'

/**
 * Phase 0 health. Each line is one of the data sources the analytics tabs
 * and the Funnel and SEO pages are built on, and whether it has started
 * producing rows. The Settle button fills Stripe settlement figures for
 * ledger rows still waiting (one Stripe read each, 25 at a time).
 *
 * `ds` is the `data_sources` block from /api/admin/analytics/revenue (the
 * same shape analytics-summary returns).
 */
export default function DataSources({ ds, onSettled }) {
  const { request } = useAdminAPI()
  const [settling, setSettling] = useState(false)
  const [settleNote, setSettleNote] = useState(null)

  async function settle() {
    setSettling(true)
    setSettleNote(null)
    try {
      const r = await request('/api/admin/analytics/settle-purchases', { method: 'POST' })
      setSettleNote(
        `Settled ${r.settled}. ${r.remaining} still waiting.${r.errors?.length ? ` ${r.errors.length} failed.` : ''}`,
      )
      onSettled?.()
    } catch (e) {
      setSettleNote(e.message)
    } finally {
      setSettling(false)
    }
  }

  const errorKeys = Object.keys(ds.errors ?? {})

  return (
    <Section title="Data sources">
      <div className="pp-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <StatusRow
          ok={ds.posthog_client && ds.posthog_server}
          label="PostHog"
          detail={
            ds.posthog_client && ds.posthog_server
              ? 'Client and server keys set.'
              : ds.posthog_client
              ? 'Client key set. Server query key missing (POSTHOG_API_KEY, POSTHOG_PROJECT_ID).'
              : 'Not configured. Set VITE_POSTHOG_KEY, POSTHOG_API_KEY and POSTHOG_PROJECT_ID in Vercel.'
          }
        />
        <StatusRow
          ok={ds.attribution_rows === null ? false : ds.attribution_rows > 0 ? true : null}
          label="Attribution"
          detail={
            ds.attribution_rows === null
              ? 'touch_attribution is missing. Apply migration 061.'
              : `${ds.attribution_rows} accounts recorded, ${ds.attribution_with_record} with a source` +
                (ds.attribution_by_via
                  ? ` (${Object.entries(ds.attribution_by_via)
                      .map(([k, v]) => `${v} via ${k.replace('_', ' ')}`)
                      .join(', ')})`
                  : '') +
                '.'
          }
        />
        <StatusRow
          ok={ds.purchases_rows === null ? false : ds.purchases_unsettled === 0 ? true : null}
          label="Purchases ledger"
          detail={
            ds.purchases_rows === null
              ? 'purchases is missing. Apply migration 062.'
              : `${ds.purchases_rows} orders, ${ds.purchases_unsettled} awaiting Stripe settlement lookup.`
          }
        />
        {ds.purchases_unsettled > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingLeft: '1.25rem' }}>
            <button
              type="button"
              className="pp-btn"
              onClick={settle}
              disabled={settling}
              style={{ padding: '0.4rem 0.8rem' }}
            >
              {settling ? 'Settling…' : 'Settle next 25'}
            </button>
            {settleNote && <span style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)' }}>{settleNote}</span>}
          </div>
        )}
        <StatusRow
          ok={ds.snapshots_count === null ? false : ds.snapshots_count > 0 ? true : null}
          label="Daily snapshots"
          detail={
            ds.snapshots_count === null
              ? 'daily_snapshots is missing. Apply migration 063.'
              : ds.snapshots_count === 0
              ? 'Table exists. The 06:00 UTC cron has not run yet.'
              : `${ds.snapshots_count} days recorded, latest ${ds.latest_snapshot}` +
                (ds.latest_snapshot_errors && Object.keys(ds.latest_snapshot_errors).length
                  ? ` with errors in ${Object.keys(ds.latest_snapshot_errors).join(', ')}.`
                  : '.')
          }
        />
        {errorKeys.length > 0 && (
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.72rem', color: WARN }}>
            Soft failures: {errorKeys.map((k) => `${k} (${ds.errors[k]})`).join('; ')}
          </p>
        )}
      </div>
    </Section>
  )
}

function StatusRow({ ok, label, detail }) {
  return (
    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'baseline', fontSize: '0.82rem' }}>
      <span
        aria-hidden
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          flexShrink: 0,
          transform: 'translateY(-1px)',
          background: ok === true ? OK : ok === false ? BAD : WARN,
        }}
      />
      <span style={{ color: 'var(--color-ink)', minWidth: 160 }}>{label}</span>
      <span style={{ color: 'var(--color-ink-muted)' }}>{detail}</span>
    </div>
  )
}
