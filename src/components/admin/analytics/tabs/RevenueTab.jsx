import { useEffect, useMemo, useState } from 'react'
import { DollarSign, Receipt, Repeat, ShoppingBag, Undo2 } from 'lucide-react'
import KpiCard from '../KpiCard'
import MetricChart from '../MetricChart'
import DataSources from '../DataSources'
import LaunchChart from '../LaunchChart'
import TabFrame from '../TabFrame'
import { useTabData } from '../useTabData'
import { EmptyPanel, Fraction, Kind, KpiGrid, Note, Row, Section, Table, Td } from '../primitives'
import {
  NO_VALUE,
  flowSeries,
  formatCents,
  formatCount,
  formatDateTime,
  formatFraction,
  pickDaily,
  ratioSeries,
} from '../shared'

const METRICS = {
  net: { label: 'Net revenue', format: 'currency', icon: DollarSign },
  orders: { label: 'Orders', format: 'count', icon: ShoppingBag },
  aov: { label: 'Average order', format: 'currency', icon: Receipt },
  repeat: { label: 'Repeat buyer share', format: 'percent', icon: Repeat },
  refunds: { label: 'Refunds and disputes', format: 'currency', icon: Undo2 },
}

const pct = (share) => (typeof share === 'number' ? `${Math.round(share * 100)}%` : NO_VALUE)

export default function RevenueTab({ range }) {
  const { data, error, loading, stale, reload } = useTabData('revenue', range)
  const [metric, setMetric] = useState('net')
  const [launchId, setLaunchId] = useState(null)

  const rev = data?.revenue
  const k = rev?.kpis
  const daily = useMemo(() => rev?.daily ?? [], [rev])

  const series = useMemo(() => {
    switch (metric) {
      case 'net':
        return flowSeries(pickDaily(daily, 'net'), range)
      case 'orders':
        return flowSeries(pickDaily(daily, 'orders'), range)
      case 'aov':
        return ratioSeries(daily, range, 'net', 'orders')
      case 'repeat':
        return ratioSeries(daily, range, 'repeat_buyers', 'buyers', 100)
      case 'refunds':
        return flowSeries(
          daily.map((d) => ({ date: d.date, value: (d.refunds ?? 0) + (d.disputes ?? 0) })),
          range,
        )
      default:
        return []
    }
  }, [metric, range, daily])

  const launches = useMemo(() => rev?.launches ?? [], [rev])
  useEffect(() => {
    if (launches.length && !launches.some((l) => l.webinar_id === launchId)) setLaunchId(launches[0].webinar_id)
  }, [launches, launchId])
  const launch = launches.find((l) => l.webinar_id === launchId) ?? null

  const kpiValue = (key) => {
    if (!k) return NO_VALUE
    switch (key) {
      case 'net':
        return formatCents(k.net_cents)
      case 'orders':
        return formatCount(k.orders)
      case 'aov':
        return formatCents(k.aov_cents)
      case 'repeat':
        return formatFraction(k.repeat_buyers, k.buyers)
      case 'refunds':
        return formatCents((k.refund_cents ?? 0) + (k.dispute_lost_cents ?? 0))
      default:
        return NO_VALUE
    }
  }
  const kpiSubtitle = (key) => {
    if (!k) return 'In the selected range'
    switch (key) {
      case 'net':
        return 'Settled USD, net of refunds and lost disputes'
      case 'orders':
        return `${formatCount(k.buyers)} distinct buyer${k.buyers === 1 ? '' : 's'}`
      case 'aov':
        return 'Net revenue over orders'
      case 'repeat':
        return 'Buyers in range who had bought before'
      case 'refunds':
        return `${formatCount(k.refunds)} refund${k.refunds === 1 ? '' : 's'}, ${formatCount(k.disputes)} dispute${
          k.disputes === 1 ? '' : 's'
        }${k.disputes_open ? ` (${k.disputes_open} open)` : ''}`
      default:
        return ''
    }
  }

  return (
    <TabFrame data={data} error={error} loading={loading} stale={stale} errors={data?.errors}>
      {data?.data_sources ? <DataSources ds={data.data_sources} onSettled={reload} /> : null}

      {!rev ? (
        <EmptyPanel title="Revenue needs the purchases ledger">
          Migration 062 is not applied, so nothing here can be computed. The data sources strip above says what is
          pending. The Dashboard still shows legacy totals from Stripe payloads.
        </EmptyPanel>
      ) : (
        <>
          <KpiGrid>
            {Object.entries(METRICS).map(([key, m]) => (
              <KpiCard
                key={key}
                title={m.label}
                icon={m.icon}
                selected={metric === key}
                onClick={() => setMetric(key)}
                value={kpiValue(key)}
                subtitle={kpiSubtitle(key)}
              />
            ))}
          </KpiGrid>

          <div style={{ marginBottom: '3rem' }}>
            <MetricChart
              title={METRICS[metric].label}
              series={series}
              range={range}
              format={METRICS[metric].format}
              selectable
              emptyText="No orders in the ledger yet."
            />
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
              gap: '2rem',
              marginBottom: '3rem',
            }}
          >
            <Section title="By product" note="In the selected range" style={{ marginBottom: 0 }}>
              {rev.by_product.length === 0 ? (
                <EmptyPanel>No orders in this range.</EmptyPanel>
              ) : (
                <Table head={[['Product'], ['Orders', 'right'], ['Gross', 'right'], ['Discounts', 'right'], ['Net', 'right'], ['Share', 'right']]}>
                  {rev.by_product.map((r) => (
                    <Row key={r.webinar_id ?? r.title}>
                      <Td>
                        {r.title}
                        <Kind kind={r.kind} />
                      </Td>
                      <Td align="right" mono>
                        {formatCount(r.orders)}
                      </Td>
                      <Td align="right" mono>
                        {formatCents(r.gross_cents)}
                      </Td>
                      <Td align="right" mono muted>
                        {r.discount_cents ? formatCents(r.discount_cents) : NO_VALUE}
                      </Td>
                      <Td align="right" mono>
                        {formatCents(r.net_cents)}
                      </Td>
                      <Td align="right" mono muted>
                        {pct(r.share)}
                      </Td>
                    </Row>
                  ))}
                </Table>
              )}
            </Section>

            <Section title="By pricing tier" note="In the selected range" style={{ marginBottom: 0 }}>
              <Table head={[['Tier'], ['Orders', 'right'], ['Net', 'right'], ['Avg order', 'right'], ['Share', 'right']]}>
                {rev.by_pricing.map((t) => (
                  <Row key={t.pricing}>
                    <Td muted={t.orders === 0}>{t.label}</Td>
                    <Td align="right" mono muted={t.orders === 0}>
                      {formatCount(t.orders)}
                    </Td>
                    <Td align="right" mono muted={t.orders === 0}>
                      {formatCents(t.net_cents)}
                    </Td>
                    <Td align="right" mono muted>
                      {formatCents(t.aov_cents)}
                    </Td>
                    <Td align="right" mono muted>
                      {pct(t.share)}
                    </Td>
                  </Row>
                ))}
              </Table>
              <Note>
                Early bird versus full price is the question after a launch. Scholarship orders are full-price
                Prices with a scholarship code, labelled from scholarship_enrollments. Discounts are
                promotion-code amounts off the presentment price.
              </Note>
            </Section>
          </div>

          <Section title="Launch view" note="All orders for one workshop, by day">
            {launches.length === 0 ? (
              <EmptyPanel>No dated workshop has orders in the ledger yet.</EmptyPanel>
            ) : (
              <div className="pp-card" style={{ padding: '1.25rem 1.5rem' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    flexWrap: 'wrap',
                    marginBottom: '1rem',
                  }}
                >
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem' }}>
                    <span className="pp-section-label" style={{ fontSize: '0.6rem' }}>
                      Launch
                    </span>
                    <select
                      value={launchId ?? ''}
                      onChange={(e) => setLaunchId(e.target.value)}
                      style={{
                        background: 'var(--color-surface)',
                        color: 'var(--color-ink)',
                        border: '1px solid var(--color-rule)',
                        borderRadius: 4,
                        padding: '0.4rem 0.6rem',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.75rem',
                        maxWidth: 360,
                      }}
                    >
                      {launches.map((l) => (
                        <option key={l.webinar_id} value={l.webinar_id}>
                          {l.title} ({formatDateTime(l.scheduled_at)})
                        </option>
                      ))}
                    </select>
                  </label>
                  {launch ? (
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)' }}>
                      {formatCount(launch.orders)} orders
                      {launch.early_bird_ends_at
                        ? `, early bird closed ${formatDateTime(launch.early_bird_ends_at)}`
                        : ', no early bird window'}
                    </span>
                  ) : null}
                </div>
                <LaunchChart launch={launch} />
                <Note>
                  Lighter bars are early bird orders, full accent is full price. The dashed lines mark the early bird
                  close and the workshop date. Days are UTC. A launch longer than 180 days is cut at 180.
                </Note>
              </div>
            )}
          </Section>

          <Section title="Stripe fees and settlement">
            <div className="pp-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                <span style={{ color: 'var(--color-ink)' }}>Stripe fees in range</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--color-ink)' }}>
                  {formatCents(k.fee_cents, { fraction: true })}
                  <span style={{ color: 'var(--color-ink-muted)' }}>
                    {' '}
                    on <Fraction value={{ n: k.fee_known_orders, m: k.orders }} /> settled orders
                  </span>
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                <span style={{ color: 'var(--color-ink)' }}>Net after fees</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--color-ink)' }}>
                  {formatCents(k.net_cents - (k.fee_cents ?? 0), { fraction: true })}
                </span>
              </div>
              <Note>
                Amounts are what settled to the Stripe balance in USD. {formatCount(k.non_usd_orders)} order
                {k.non_usd_orders === 1 ? '' : 's'} in this range {k.non_usd_orders === 1 ? 'was' : 'were'} presented
                in another currency under Adaptive Pricing; for those the settled USD figure is used, not the
                presentment amount. {formatCount(k.unsettled_orders)} order{k.unsettled_orders === 1 ? '' : 's'}{' '}
                {k.unsettled_orders === 1 ? 'is' : 'are'} still awaiting the settlement lookup and count at face value
                only when already in USD. Refunds and lost disputes are charged to the order's own purchase day, so a
                month's net can fall after it closes.
              </Note>
            </div>
          </Section>
        </>
      )}
    </TabFrame>
  )
}
