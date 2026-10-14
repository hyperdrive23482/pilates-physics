import { Fragment, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRightLeft, ChevronDown, ChevronRight, Mail, UserCheck, UserPlus } from 'lucide-react'
import KpiCard from '../KpiCard'
import MetricChart from '../MetricChart'
import BreakdownTable from '../BreakdownTable'
import TabFrame from '../TabFrame'
import UserActivityPanel from '../../UserActivityPanel'
import { useTabData } from '../useTabData'
import { EmptyPanel, Fraction, KpiGrid, Note, Row, Section, Table, Td } from '../primitives'
import { NO_VALUE, flowSeries, formatCount, formatDateTime, formatDays, formatFraction, snapshotSeries } from '../shared'

export default function AudienceTab({ range }) {
  const { data, error, loading, stale } = useTabData('audience', range)
  const [metric, setMetric] = useState('new_accounts')
  const [open, setOpen] = useState(null)
  const a = data?.audience
  const k = a?.kpis

  const series = useMemo(() => {
    if (!a) return []
    if (metric === 'kit') {
      // A day whose Kit section failed has no subscriber count; charting it as
      // zero would draw a cliff that never happened.
      return snapshotSeries((a.snapshots ?? []).filter((r) => typeof r.subscribers === 'number'), range, (r) => r.subscribers)
    }
    return flowSeries(a.new_daily ?? [], range)
  }, [a, metric, range])

  return (
    <TabFrame data={data} error={error} loading={loading} stale={stale} errors={data?.errors}>
      {!a ? (
        <EmptyPanel title="Audience needs the account counters">
          admin_auth_users_brief (migration 063) is missing, so accounts cannot be listed. Apply 063 and reload.
        </EmptyPanel>
      ) : (
        <>
          <KpiGrid>
            <KpiCard
              title="Kit subscribers"
              icon={Mail}
              selected={metric === 'kit'}
              onClick={() => setMetric('kit')}
              value={formatCount(k.kit?.subscribers)}
              subtitle={
                k.kit?.from === 'live'
                  ? 'Live from Kit'
                  : k.kit?.as_of
                  ? `Snapshot from ${k.kit.as_of}`
                  : 'No snapshot yet and Kit not reachable'
              }
            />
            <KpiCard
              title="New accounts"
              icon={UserPlus}
              selected={metric === 'new_accounts'}
              onClick={() => setMetric('new_accounts')}
              value={formatCount(k.new_accounts)}
              subtitle={`In the selected range · ${formatCount(k.total_accounts)} all time`}
            />
            <KpiCard
              title="Leads who bought"
              icon={ArrowRightLeft}
              value={formatFraction(k.leads_bought.n, k.leads_bought.m)}
              subtitle={
                k.lead_to_purchase_days === null
                  ? 'All time, calculator leads with a later purchase'
                  : `All time · median ${formatDays(k.lead_to_purchase_days)} from claim to purchase`
              }
            />
            <KpiCard
              title="Buyers never leads"
              icon={UserCheck}
              value={formatFraction(k.buyers_never_leads.n, k.buyers_never_leads.m)}
              subtitle="All time, bought without claiming the calculator first"
            />
          </KpiGrid>

          <div style={{ marginBottom: '3rem' }}>
            <MetricChart
              title={metric === 'kit' ? 'Kit subscribers' : 'New accounts'}
              series={series}
              range={range}
              kind={metric === 'kit' ? 'trend' : 'period'}
              selectable
              emptyText={
                metric === 'kit'
                  ? 'No daily snapshots yet. History accrues from the first 06:00 UTC cron run (migration 063).'
                  : 'No accounts created in this window.'
              }
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
            <div className="pp-card">
              <BreakdownTable title="New accounts by how they arrived" rows={a.new_by_source} empty="No accounts in this range." />
              <Note>From each account's earliest entitlement. Accounts with none yet are listed as such.</Note>
            </div>
            {a.sources ? (
              <>
                <div className="pp-card">
                  <BreakdownTable title="First touch" rows={a.sources.first_touch} empty="No attribution rows in this range." />
                </div>
                <div className="pp-card">
                  <BreakdownTable title="Last touch" rows={a.sources.last_touch} empty="No attribution rows in this range." />
                </div>
                <div className="pp-card">
                  <BreakdownTable title="Campaigns" rows={a.sources.campaigns} empty="No campaign-tagged arrivals yet." />
                  <div style={{ height: '1rem' }} />
                  <BreakdownTable title="First landing page" rows={a.sources.landing_paths} empty="No landing pages recorded yet." />
                </div>
              </>
            ) : (
              <div className="pp-card">
                <Note tone="warn" style={{ margin: 0 }}>
                  touch_attribution (migration 061) is missing, so first and last touch cannot be shown.
                </Note>
              </div>
            )}
          </div>
          {a.sources ? (
            <Note style={{ marginTop: '-2rem', marginBottom: '3rem' }}>
              Attribution is first-party and exists only for accounts created after it shipped: {formatCount(a.sources.recorded)}{' '}
              recorded in this range, {formatCount(a.sources.unrecorded)} with no record. Sequence and tag detail lives on{' '}
              <Link to="/admin/kit" style={{ color: 'var(--color-accent)' }}>
                Kit
              </Link>
              .
            </Note>
          ) : null}

          <Section title="Recent accounts" note="Newest first. Click a row for the activity timeline.">
            <Table minWidth={820} head={[['Account'], ['Joined'], ['Arrived by'], ['First touch'], ['Last touch'], ['Products'], ['Last sign in']]}>
              {a.recent.map((u) => {
                const isOpen = open === u.id
                const Chevron = isOpen ? ChevronDown : ChevronRight
                return (
                  <Fragment key={u.id}>
                    <Row onClick={() => setOpen(isOpen ? null : u.id)} open={isOpen}>
                      <Td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Chevron size={14} style={{ color: 'var(--color-ink-muted)', flexShrink: 0 }} />
                          {u.email ?? NO_VALUE}
                        </span>
                      </Td>
                      <Td mono muted>
                        {formatDateTime(u.created_at)}
                      </Td>
                      <Td muted={!u.is_buyer}>{u.source}</Td>
                      <Td muted>{u.first_touch}</Td>
                      <Td muted>{u.last_touch}</Td>
                      <Td muted>{u.products.length ? u.products.join(', ') : NO_VALUE}</Td>
                      <Td mono muted>
                        {u.last_sign_in_at ? formatDateTime(u.last_sign_in_at) : 'Never'}
                      </Td>
                    </Row>
                    {isOpen ? (
                      <tr style={{ borderBottom: '1px solid var(--color-rule)', background: 'rgba(227, 227, 227, 0.02)' }}>
                        <Td colSpan={7} style={{ padding: '1rem 1rem 1.25rem 2.3rem' }}>
                          <UserActivityPanel userRow={{ id: u.id, email: u.email }} />
                        </Td>
                      </tr>
                    ) : null}
                  </Fragment>
                )
              })}
            </Table>
          </Section>

          <Section title="Totals">
            <div className="pp-card" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', fontSize: '0.85rem' }}>
              <Line label="Accounts" value={formatCount(k.total_accounts)} />
              <Line label="Calculator leads" value={formatCount(k.leads)} />
              <Line label="Buyers" value={formatCount(k.buyers)} />
              <Line label="Leads who bought" value={<Fraction value={k.leads_bought} />} />
            </div>
          </Section>
        </>
      )}
    </TabFrame>
  )
}

function Line({ label, value }) {
  return (
    <div>
      <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--color-ink-muted)' }}>{label}</p>
      <p style={{ margin: '0.15rem 0 0', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--color-ink)' }}>{value}</p>
    </div>
  )
}
