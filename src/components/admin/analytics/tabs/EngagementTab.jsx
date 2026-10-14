import { useMemo, useState } from 'react'
import { Activity, Eye, LogIn, MousePointerClick, Users, Wrench } from 'lucide-react'
import KpiCard from '../KpiCard'
import MetricChart from '../MetricChart'
import BarsCard from '../BarsCard'
import BreakdownTable from '../BreakdownTable'
import TabFrame from '../TabFrame'
import { useTabData } from '../useTabData'
import { EmptyPanel, KpiGrid, Note, Row, Section, Table, Td } from '../primitives'
import { flowSeries, formatCount, formatFraction } from '../shared'

const METRICS = {
  logins: { label: 'Logins', icon: LogIn, key: 'logins' },
  portal_views: { label: 'Portal views', icon: Eye, key: 'portal_views' },
  tool_opens: { label: 'Tool opens', icon: Wrench, key: 'tool_opens' },
  content_opens: { label: 'Content opens', icon: MousePointerClick, key: 'content_opens' },
  events: { label: 'All events', icon: Activity, key: 'events' },
}

export default function EngagementTab({ range }) {
  const { data, error, loading, stale } = useTabData('engagement', range)
  const [metric, setMetric] = useState('logins')
  const [sessionsOnly, setSessionsOnly] = useState(true)
  const e = data?.engagement
  const k = e?.kpis

  const series = useMemo(() => flowSeries(e?.daily?.[METRICS[metric].key] ?? [], range), [e, metric, range])
  const tod = e?.time_of_day ? (sessionsOnly ? e.time_of_day.sessions : e.time_of_day.all) : null
  const rangeLabel = range === 'all' ? 'All time' : 'In the selected range'

  return (
    <TabFrame data={data} error={error} loading={loading} stale={stale} errors={data?.errors}>
      {!e ? (
        <EmptyPanel>Nothing loaded.</EmptyPanel>
      ) : (
        <>
          <KpiGrid min={160}>
            <KpiCard
              title="Active people"
              icon={Users}
              value={formatCount(k.active_users)}
              subtitle={`${rangeLabel}, signed in with any activity`}
            />
            {Object.entries(METRICS).map(([key, m]) => (
              <KpiCard
                key={key}
                title={m.label}
                icon={m.icon}
                selected={metric === key}
                onClick={() => setMetric(key)}
                value={formatCount(k[m.key])}
                subtitle={rangeLabel}
              />
            ))}
          </KpiGrid>

          <div style={{ marginBottom: '3rem' }}>
            <MetricChart
              title={METRICS[metric].label}
              series={series}
              range={range}
              selectable
              emptyText="No activity recorded yet. The log began in August 2026 (migration 042)."
            />
          </div>

          <Section
            title="When people show up"
            note={`${rangeLabel}, ${data.time_zone === 'America/Los_Angeles' ? 'Pacific time' : data.time_zone}`}
          >
            {!tod ? (
              <EmptyPanel>
                Weekday and hour-of-day bars need admin_engagement_hourly (migration 064). Apply it and reload.
              </EmptyPanel>
            ) : (
              <>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                  <Toggle active={sessionsOnly} onClick={() => setSessionsOnly(true)}>
                    Sessions
                  </Toggle>
                  <Toggle active={!sessionsOnly} onClick={() => setSessionsOnly(false)}>
                    All activity
                  </Toggle>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
                  <BarsCard title="By weekday" data={tod.weekday} />
                  <BarsCard title="By hour of day" data={tod.hour} />
                </div>
                <Note>
                  Sessions are logins, portal opens and dashboard views. This is the cheapest answer to when to
                  send email: people read when they are already sitting down with the portal.
                </Note>
              </>
            )}
          </Section>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
            <Section
              title="Tools"
              note={e.rankings?.scope === 'all' ? 'All time (apply 064 for the range)' : rangeLabel}
              style={{ marginBottom: 0 }}
            >
              <RankTable rows={e.rankings?.tools} empty="No tool opens recorded yet." />
            </Section>
            <Section
              title="Content"
              note={e.rankings?.scope === 'all' ? 'All time (apply 064 for the range)' : rangeLabel}
              style={{ marginBottom: 0 }}
            >
              <RankTable rows={e.rankings?.content} empty="No content opens recorded yet." />
            </Section>
          </div>

          <Section title="Buyers who have never signed in" note="All time, from auth.users.last_sign_in_at">
            {!e.buyers ? (
              <EmptyPanel>Needs admin_auth_users_brief (migration 063).</EmptyPanel>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
                <div className="pp-card">
                  <p style={{ margin: '0 0 0.25rem', fontSize: '0.7rem', color: 'var(--color-ink-muted)' }}>Never signed in</p>
                  <p style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: '1.75rem', color: 'var(--color-ink)' }}>
                    {formatFraction(e.buyers.never.n, e.buyers.never.m)}
                  </p>
                  <Note>
                    Of {formatCount(e.buyers.buyers)} buyers. Counted from the auth record rather than the activity
                    log, which only starts in August 2026 and would call every earlier customer a stranger.
                  </Note>
                </div>
                <div className="pp-card">
                  <BreakdownTable title="By time since first purchase" rows={e.buyers.by_age} empty="Everyone has signed in." />
                </div>
              </div>
            )}
          </Section>
        </>
      )}
    </TabFrame>
  )
}

function RankTable({ rows, empty }) {
  if (!rows) return <EmptyPanel>Needs the engagement views (migration 063).</EmptyPanel>
  if (rows.length === 0) return <EmptyPanel>{empty}</EmptyPanel>
  return (
    <Table head={[['Item'], ['People', 'right'], ['Opens', 'right']]}>
      {rows.map((r) => (
        <Row key={r.key}>
          <Td>{r.label}</Td>
          <Td align="right" mono>
            {formatCount(r.distinct_users)}
          </Td>
          <Td align="right" mono muted>
            {formatCount(r.opens)}
          </Td>
        </Row>
      ))}
    </Table>
  )
}

function Toggle({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: active ? 'rgba(240, 159, 38, 0.12)' : 'transparent',
        color: active ? 'var(--color-accent)' : 'var(--color-ink-muted)',
        border: '1px solid var(--color-rule)',
        borderRadius: 4,
        padding: '0.3rem 0.7rem',
        fontSize: '0.72rem',
        fontFamily: 'var(--font-serif)',
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  )
}
