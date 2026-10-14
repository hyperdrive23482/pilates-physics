import { useCallback, useEffect, useMemo, useState } from 'react'
import { DollarSign, ShoppingBag, UserPlus, Users } from 'lucide-react'
import { useEnrollment } from '../../hooks/useEnrollment'
import { useAdminAPI } from '../../hooks/admin/useAdminAPI'
import AdminNav from '../../components/admin/AdminNav'
import StatCard from '../../components/admin/StatCard'
import KpiCard from '../../components/admin/analytics/KpiCard'
import MetricChart from '../../components/admin/analytics/MetricChart'
import DateRangeSelect from '../../components/admin/analytics/DateRangeSelect'
import {
  DEFAULT_RANGE,
  flowSeries,
  formatCents,
  formatCount,
  isDateRange,
  stockSeries,
  sumInRange,
} from '../../components/admin/analytics/shared'

const WARN = '#e0a458'
const OK = '#7fbf8f'
const BAD = '#ff7d7d'

const METRICS = {
  revenue: { label: 'Net revenue', format: 'currency', icon: DollarSign },
  orders: { label: 'Orders', format: 'count', icon: ShoppingBag },
  new_users: { label: 'New accounts', format: 'count', icon: UserPlus },
  total_users: { label: 'Total accounts', format: 'count', icon: Users },
}

export default function AdminAnalytics() {
  const { user, signOut } = useEnrollment()
  const { request } = useAdminAPI()
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [range, setRange] = useState(() => {
    try {
      const saved = window.localStorage.getItem('pp.admin.range')
      return isDateRange(saved) ? saved : DEFAULT_RANGE
    } catch {
      return DEFAULT_RANGE
    }
  })
  const [metric, setMetric] = useState('revenue')
  const [settling, setSettling] = useState(false)
  const [settleNote, setSettleNote] = useState(null)

  const load = useCallback(() => {
    request('/api/admin/analytics-summary')
      .then(setData)
      .catch((e) => setError(e.message))
  }, [request])

  useEffect(() => {
    load()
  }, [load])

  function changeRange(next) {
    setRange(next)
    try {
      window.localStorage.setItem('pp.admin.range', next)
    } catch {
      // Per-browser convenience only.
    }
  }

  async function settle() {
    setSettling(true)
    setSettleNote(null)
    try {
      const r = await request('/api/admin/analytics/settle-purchases', { method: 'POST' })
      setSettleNote(
        `Settled ${r.settled}. ${r.remaining} still waiting.${r.errors?.length ? ` ${r.errors.length} failed.` : ''}`,
      )
      load()
    } catch (e) {
      setSettleNote(e.message)
    } finally {
      setSettling(false)
    }
  }

  const revenueDaily = useMemo(() => data?.revenue_daily ?? [], [data])
  const ordersDaily = useMemo(() => revenueDaily.map((d) => ({ date: d.date, value: d.orders ?? 0 })), [revenueDaily])
  const usersDaily = useMemo(() => data?.users_daily ?? [], [data])

  const kpis = useMemo(
    () => ({
      revenue: sumInRange(revenueDaily, range),
      orders: sumInRange(ordersDaily, range),
      new_users: sumInRange(usersDaily, range),
      total_users: data?.totals?.total_users ?? null,
    }),
    [revenueDaily, ordersDaily, usersDaily, range, data],
  )

  const series = useMemo(() => {
    switch (metric) {
      case 'revenue':
        return flowSeries(revenueDaily, range)
      case 'orders':
        return flowSeries(ordersDaily, range)
      case 'new_users':
        return flowSeries(usersDaily, range)
      case 'total_users':
        return stockSeries(usersDaily, range)
      default:
        return []
    }
  }, [metric, range, revenueDaily, ordersDaily, usersDaily])

  const ds = data?.data_sources
  const legacyRevenue = ds?.revenue_source === 'stripe_events'

  return (
    <div style={{ minHeight: '100vh' }}>
      <AdminNav user={user} onSignOut={signOut} />

      <main className="pp-main" style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <div className="pp-header-row" style={{ marginBottom: '2rem' }}>
          <div>
            <p className="pp-eyebrow" style={{ marginBottom: '0.5rem' }}>
              Admin
            </p>
            <h1 className="pp-page-title">Analytics</h1>
          </div>
          <DateRangeSelect value={range} onChange={changeRange} />
        </div>

        {error && <p style={{ color: BAD, fontSize: '0.85rem' }}>{error}</p>}
        {!data && !error && <p style={{ color: 'var(--color-ink-muted)', fontSize: '0.9rem' }}>Loading…</p>}

        {data && (
          <>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                marginBottom: '1rem',
              }}
            >
              {Object.entries(METRICS).map(([key, m]) => (
                <KpiCard
                  key={key}
                  title={m.label}
                  icon={m.icon}
                  selected={metric === key}
                  onClick={() => setMetric(key)}
                  value={
                    key === 'total_users'
                      ? formatCount(kpis.total_users)
                      : legacyRevenue && (key === 'revenue' || key === 'orders')
                      ? '—'
                      : m.format === 'currency'
                      ? formatCents(kpis[key])
                      : formatCount(kpis[key])
                  }
                  subtitle={key === 'total_users' ? 'All time' : 'In the selected range'}
                />
              ))}
            </div>

            <div style={{ marginBottom: '3rem' }}>
              <MetricChart
                title={`${METRICS[metric].label}${metric === 'total_users' ? ', cumulative' : ''}`}
                series={legacyRevenue && (metric === 'revenue' || metric === 'orders') ? [] : series}
                range={range}
                format={METRICS[metric].format}
                selectable
                emptyText={
                  legacyRevenue
                    ? 'The purchases ledger (migration 062) is not applied yet, so revenue cannot be charted by day.'
                    : 'No data to chart for this metric yet.'
                }
              />
            </div>

            {ds && (
              <DataSources
                ds={ds}
                settling={settling}
                settleNote={settleNote}
                onSettle={settle}
              />
            )}

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '1rem',
                marginBottom: '3rem',
              }}
            >
              <StatCard
                label="Total revenue"
                value={formatCents(data.totals.total_revenue_cents, { fraction: true })}
                sublabel={legacyRevenue ? 'From Stripe payloads (pre-ledger)' : 'Settled USD, net of refunds'}
              />
              <StatCard label="Total enrollments" value={data.totals.total_enrollments} />
              <StatCard label="Total accounts" value={data.totals.total_users} />
              <StatCard label="Questions submitted" value={data.totals.total_questions} />
            </div>

            {data.engagement && <Engagement engagement={data.engagement} />}

            <section>
              <SectionHeading>Per workshop</SectionHeading>
              <div
                className="pp-table-wrap"
                style={{ background: 'var(--color-surface)', border: '1px solid var(--color-rule)' }}
              >
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-rule)' }}>
                      <Th>Title</Th>
                      <Th>Status</Th>
                      <Th align="right">Enrollments</Th>
                      <Th align="right">Paid</Th>
                      <Th align="right">Revenue</Th>
                      <Th align="right">Questions</Th>
                      <Th align="right">Unanswered</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.per_workshop.map((w) => (
                      <tr key={w.id} style={{ borderBottom: '1px solid var(--color-rule)' }}>
                        <Td>{w.title}</Td>
                        <Td mono>{w.status}</Td>
                        <Td align="right" mono>
                          {w.enrollments}
                        </Td>
                        <Td align="right" mono>
                          {w.paid_enrollments}
                        </Td>
                        <Td align="right" mono>
                          {formatCents(w.revenue_cents, { fraction: true })}
                        </Td>
                        <Td align="right" mono>
                          {w.questions}
                        </Td>
                        <Td align="right" mono>
                          {w.unanswered_questions}
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  )
}

/**
 * Phase 0 health. Each line is one of the data sources the Funnel and SEO
 * pages will be built on, and whether it has started producing rows.
 */
function DataSources({ ds, settling, settleNote, onSettle }) {
  const errorKeys = Object.keys(ds.errors ?? {})
  const Row = ({ ok, label, detail }) => (
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

  return (
    <section style={{ marginBottom: '3rem' }}>
      <SectionHeading>Data sources</SectionHeading>
      <div className="pp-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <Row
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
        <Row
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
        <Row
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
            <button type="button" className="pp-btn" onClick={onSettle} disabled={settling} style={{ padding: '0.4rem 0.8rem' }}>
              {settling ? 'Settling…' : 'Settle next 25'}
            </button>
            {settleNote && <span style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)' }}>{settleNote}</span>}
          </div>
        )}
        <Row
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
    </section>
  )
}

function Engagement({ engagement }) {
  const { buyers, buyers_signed_in: signedIn, buyers_never_signed_in: never } = engagement
  const pct = buyers ? Math.round((signedIn / buyers) * 100) : 0

  return (
    <section style={{ marginBottom: '3rem' }}>
      <SectionHeading>Engagement</SectionHeading>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem',
        }}
      >
        {/* Counted from auth.users.last_sign_in_at rather than the activity
            log, which only starts in Aug 2026 and would report nearly every
            existing customer as never having signed in. */}
        <StatCard label="Buyers who signed in" value={`${pct}%`} />
        <StatCard label="Buyers never signed in" value={never} />
        <StatCard label="Active last 30 days" value={formatCount(engagement.active_users_30d)} />
        <StatCard label="Recorded events" value={formatCount(engagement.recorded_events)} />
      </div>

      {engagement.truncated && (
        <p style={{ fontSize: '0.75rem', color: WARN, margin: '0 0 1rem' }}>
          Event read hit its cap, so the breakdowns below are partial. Apply migration 063 for exact counts.
        </p>
      )}

      <EngagementTable title="Content opened" rows={engagement.content} empty="No content opens recorded yet." />
      <EngagementTable title="Tools used" rows={engagement.tools} empty="No tool opens recorded yet." />
    </section>
  )
}

function EngagementTable({ title, rows, empty }) {
  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <SectionHeading>{title}</SectionHeading>
      {rows?.length ? (
        <div className="pp-table-wrap" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-rule)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-rule)' }}>
                <Th>Item</Th>
                <Th align="right">People</Th>
                <Th align="right">Opens</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.key} style={{ borderBottom: '1px solid var(--color-rule)' }}>
                  <Td>{r.label}</Td>
                  {/* Distinct people first: one person replaying a recording
                      ten times is one person who wanted it. */}
                  <Td align="right" mono>
                    {r.distinct_users}
                  </Td>
                  <Td align="right" mono>
                    {r.opens}
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p style={{ fontSize: '0.85rem', color: 'var(--color-ink-muted)', margin: 0 }}>{empty}</p>
      )}
    </div>
  )
}

function SectionHeading({ children }) {
  return (
    <h2
      style={{
        fontSize: '0.7rem',
        fontWeight: 600,
        letterSpacing: '0.15em',
        textTransform: 'uppercase',
        color: 'var(--color-ink-muted)',
        marginBottom: '1rem',
      }}
    >
      {children}
    </h2>
  )
}

function Th({ children, align = 'left' }) {
  return (
    <th
      style={{
        textAlign: align,
        padding: '0.75rem 1rem',
        fontSize: '0.65rem',
        fontWeight: 600,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: 'var(--color-ink-muted)',
      }}
    >
      {children}
    </th>
  )
}

function Td({ children, align = 'left', mono }) {
  return (
    <td
      style={{
        padding: '0.75rem 1rem',
        textAlign: align,
        color: 'var(--color-ink)',
        fontFamily: mono ? 'ui-monospace, SFMono-Regular, monospace' : undefined,
        fontSize: mono ? '0.8rem' : undefined,
      }}
    >
      {children}
    </td>
  )
}
