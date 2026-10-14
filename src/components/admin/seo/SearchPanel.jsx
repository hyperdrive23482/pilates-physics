import { useMemo, useState } from 'react'
import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Muted, Note, Row, Table, Td } from '../analytics/primitives'
import TabFrame from '../analytics/TabFrame'
import { COLORS, NO_VALUE, formatCount } from '../analytics/shared'
import { timeAgo } from '../../../lib/seoFindings'
import { PlainSelect, SmallButton } from './parts'

/**
 * Search tab: what people typed into Google to reach each page, from the
 * Search Console cache. Ported from remo's SearchPanel.
 *
 * Queries lead with impressions rather than clicks: at this volume
 * impressions are where the signal is. Google's per-query rows are sampled
 * and sum below the page totals, so page totals come from the [date, page]
 * rows, never from adding queries up. Audit runs are marked on the chart so
 * a fix and its effect sit together.
 */

const VIEWS = { queries: 'Queries', page: 'By page', daily: 'Over time' }

function QueryTable({ rows, showPage }) {
  return (
    <Table
      minWidth={showPage ? 640 : 480}
      head={[['Query'], ...(showPage ? [['Page Google showed']] : []), ['Clicks', 'right'], ['Impressions', 'right'], ['CTR', 'right'], ['Position', 'right']]}
    >
      {rows.length === 0 ? (
        <tr>
          <Td colSpan={showPage ? 6 : 5} muted style={{ textAlign: 'center', padding: '2rem' }}>
            No queries in this window.
          </Td>
        </tr>
      ) : (
        rows.map((r) => (
          <Row key={`${r.query}|${r.page}`}>
            <Td>{r.query}</Td>
            {showPage ? <Td mono>{r.page}</Td> : null}
            <Td align="right" mono>{formatCount(r.clicks)}</Td>
            <Td align="right" mono>{formatCount(r.impressions)}</Td>
            <Td align="right" mono>{r.impressions > 0 ? `${Math.round(r.ctr * 100)}%` : NO_VALUE}</Td>
            <Td align="right" mono>{r.position > 0 ? r.position.toFixed(1) : NO_VALUE}</Td>
          </Row>
        ))
      )}
    </Table>
  )
}

export default function SearchPanel({ state, gscConnected, busy, onRunSync }) {
  const { data, error, loading, stale } = state
  const [view, setView] = useState('queries')
  const [page, setPage] = useState(null)

  const pages = data?.pages ?? []
  const selected = page ?? pages[0]?.page ?? null
  const pageQueries = useMemo(() => (data?.queries ?? []).filter((q) => q.page === selected), [data, selected])
  const pageTotal = pages.find((p) => p.page === selected)
  const chart = useMemo(() => (data?.daily ?? []).map((d) => ({ ...d, label: d.date.slice(5) })), [data])
  const runDates = useMemo(() => new Set((data?.runs ?? []).map((r) => r.date)), [data])

  const syncButtons = (
    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
      <SmallButton onClick={() => onRunSync(false)} disabled={Boolean(busy) || !gscConnected}>
        {busy === 'run-sync' ? 'Syncing…' : 'Sync last 3 days'}
      </SmallButton>
      <SmallButton onClick={() => onRunSync(true)} disabled={Boolean(busy) || !gscConnected} title="Pulls everything Google keeps: 16 months. Run once.">
        Backfill 16 months
      </SmallButton>
    </div>
  )

  if (!gscConnected) {
    return (
      <Muted>
        Search Console is not connected. Set <code>GSC_SERVICE_ACCOUNT_JSON</code> and <code>GSC_PROPERTY</code> in Vercel (runbook in the
        plan doc, Appendix E), then backfill from here.
      </Muted>
    )
  }

  const state0 = data?.state
  if (data && state0?.rows === 0) {
    return (
      <div style={{ display: 'grid', gap: '1rem' }}>
        <Muted>
          No Search Console data yet. <b>Backfill 16 months</b> pulls everything Google keeps; after that the daily sync at 06:30 UTC keeps
          it current.
        </Muted>
        {syncButtons}
      </div>
    )
  }

  const totals = (data?.daily ?? []).reduce((a, d) => ({ clicks: a.clicks + d.clicks, impressions: a.impressions + d.impressions }), {
    clicks: 0,
    impressions: 0,
  })

  return (
    <TabFrame data={data} error={error} loading={loading} stale={stale}>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.25rem' }}>
        <Muted style={{ flex: '1 1 340px' }}>
          {formatCount(totals.impressions)} impressions · {formatCount(totals.clicks)} clicks · {formatCount(data?.queries?.length)} query rows
          in this window. Google&apos;s data runs to {state0?.newest_date ?? NO_VALUE}; last synced {timeAgo(state0?.last_synced_at)}.
        </Muted>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
          {syncButtons}
          <PlainSelect value={view} onChange={setView} label="View">
            {Object.entries(VIEWS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </PlainSelect>
          {view === 'page' && pages.length ? (
            <PlainSelect value={selected ?? ''} onChange={setPage}>
              {pages.map((p) => (
                <option key={p.page} value={p.page}>
                  {p.page} · {p.impressions}
                </option>
              ))}
            </PlainSelect>
          ) : null}
        </div>
      </div>

      {view === 'queries' ? <QueryTable rows={data?.queries ?? []} showPage /> : null}

      {view === 'page' ? (
        <>
          {pageTotal ? (
            <Muted style={{ marginBottom: '0.75rem' }}>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-ink)' }}>{pageTotal.page}</span>:{' '}
              {formatCount(pageTotal.impressions)} impressions · {formatCount(pageTotal.clicks)} clicks · position{' '}
              {pageTotal.position > 0 ? pageTotal.position.toFixed(1) : NO_VALUE}. Queries below are Google&apos;s sample and sum lower than
              the total.
            </Muted>
          ) : null}
          <QueryTable rows={pageQueries} showPage={false} />
        </>
      ) : null}

      {view === 'daily' ? (
        <div className="pp-card">
          {chart.length === 0 ? (
            <Muted>No daily data in this window.</Muted>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={chart} margin={{ top: 16, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid stroke={COLORS.grid} vertical={false} />
                <XAxis dataKey="label" tick={{ fill: COLORS.axis, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: COLORS.axis, fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-rule)', fontSize: 12 }}
                  labelFormatter={(_, payload) => payload?.[0]?.payload?.date ?? ''}
                />
                <Area type="monotone" dataKey="impressions" name="Impressions" stroke={COLORS.tertiary} fill={COLORS.tertiary} fillOpacity={0.2} />
                <Area type="monotone" dataKey="clicks" name="Clicks" stroke={COLORS.primary} fill={COLORS.primary} fillOpacity={0.3} />
                {chart
                  .filter((d) => runDates.has(d.date))
                  .map((d) => (
                    <ReferenceLine key={d.date} x={d.label} stroke={COLORS.muted} strokeDasharray="4 2" label={{ value: 'audit', position: 'top', fontSize: 10, fill: COLORS.axis }} />
                  ))}
              </AreaChart>
            </ResponsiveContainer>
          )}
          <Note>Dashed lines mark audit runs, so a fix and its effect sit on the same chart.</Note>
        </div>
      ) : null}

      {data?.capped ? <Note tone="warn">The window holds more than 50,000 cached rows; the oldest are not shown. Pick a shorter range.</Note> : null}
    </TabFrame>
  )
}
