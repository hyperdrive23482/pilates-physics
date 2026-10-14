import { useMemo, useState } from 'react'
import { Note, Row, Table, Td } from '../analytics/primitives'
import TabFrame from '../analytics/TabFrame'
import { NO_VALUE, formatCount, formatPercent } from '../analytics/shared'
import { formatDuration } from '../../../lib/seoFindings'

/**
 * Pages tab: the blog's report card. One row per content page, PostHog
 * traffic and leads beside Search Console totals for the same window.
 *
 * "Visitors" is everyone who viewed the page; "Entries" is sessions that
 * STARTED there. "Leads" is the page a calculator lead saw FIRST, so the
 * column sums to the leads PostHog could see; the Funnel page's pre-lead
 * panel counts every page a lead viewed and sums higher.
 */

const COLUMNS = [
  { key: 'page', label: 'Page', title: 'Root-relative path' },
  { key: 'visitors', label: 'Visitors', title: 'Unique people who viewed the page', align: 'right' },
  { key: 'pageviews', label: 'Views', title: 'Pageviews', align: 'right' },
  { key: 'entries', label: 'Entries', title: 'Sessions that started on this page', align: 'right' },
  { key: 'organic', label: 'Organic', title: 'Entries from organic search', align: 'right' },
  { key: 'bounce_rate', label: 'Bounce', title: 'Entry sessions with one pageview', align: 'right' },
  { key: 'avg_seconds', label: 'Avg time', title: 'Average length of sessions that entered here', align: 'right' },
  { key: 'leads', label: 'Leads', title: 'Calculator leads whose first content page was this one', align: 'right' },
  { key: 'clicks', label: 'Clicks', title: 'Google Search clicks (Search Console)', align: 'right' },
  { key: 'impressions', label: 'Impr.', title: 'Google Search impressions (Search Console)', align: 'right' },
  { key: 'position', label: 'Pos.', title: 'Average Google position, weighted by impressions', align: 'right' },
]

const valueOf = (r, key) => {
  if (key === 'page') return r.page
  if (key === 'bounce_rate') return r.entries > 0 && r.bounces !== null ? r.bounces / r.entries : null
  return r[key]
}

export default function PagesPanel({ state }) {
  const { data, error, loading, stale } = state
  const [sort, setSort] = useState({ key: 'visitors', desc: true })

  const rows = useMemo(() => {
    const list = [...(data?.rows ?? [])]
    const { key, desc } = sort
    list.sort((a, b) => {
      const av = valueOf(a, key)
      const bv = valueOf(b, key)
      if (av === null && bv === null) return 0
      if (av === null) return 1
      if (bv === null) return -1
      const cmp = typeof av === 'string' ? av.localeCompare(bv) : av - bv
      return desc ? -cmp : cmp
    })
    return list
  }, [data, sort])

  const toggle = (key) => setSort((s) => ({ key, desc: s.key === key ? !s.desc : key !== 'page' }))
  const errors = {}
  if (data?.posthog_error) errors.traffic = data.posthog_error
  if (data?.search_error) errors.search = data.search_error

  return (
    <TabFrame data={data} error={error} loading={loading} stale={stale} errors={errors}>
      <Table
        minWidth={980}
        head={COLUMNS.map((c) => [
          <button
            key={c.key}
            type="button"
            onClick={() => toggle(c.key)}
            style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', color: sort.key === c.key ? 'var(--color-ink)' : 'inherit', cursor: 'pointer', letterSpacing: 'inherit', textTransform: 'inherit' }}
          >
            {c.label}
            {sort.key === c.key ? (sort.desc ? ' ↓' : ' ↑') : ''}
          </button>,
          c.align,
          c.title,
        ])}
      >
        {rows.length === 0 ? (
          <tr>
            <Td colSpan={COLUMNS.length} muted style={{ textAlign: 'center', padding: '2rem' }}>
              No page traffic in this window.
            </Td>
          </tr>
        ) : (
          rows.map((r) => (
            <Row key={r.page}>
              <Td mono>{r.page}</Td>
              <Td align="right" mono>{formatCount(r.visitors)}</Td>
              <Td align="right" mono>{formatCount(r.pageviews)}</Td>
              <Td align="right" mono>{formatCount(r.entries)}</Td>
              <Td align="right" mono>{formatCount(r.organic)}</Td>
              <Td align="right" mono>{formatPercent(valueOf(r, 'bounce_rate'))}</Td>
              <Td align="right" mono>{formatDuration(r.avg_seconds)}</Td>
              <Td align="right" mono>{formatCount(r.leads)}</Td>
              <Td align="right" mono>{formatCount(r.clicks)}</Td>
              <Td align="right" mono>{formatCount(r.impressions)}</Td>
              <Td align="right" mono>{typeof r.position === 'number' && r.position > 0 ? r.position.toFixed(1) : NO_VALUE}</Td>
            </Row>
          ))
        )}
      </Table>
      <Note>
        Traffic counts people who viewed a public page on pilatesphysics.com, so it is lower than PostHog&apos;s own Web Analytics, which also
        counts the portal and admin.
        {typeof data?.leads_measured === 'number' ? ` Leads: ${data.leads_measured} calculator claims in this window could be traced to a first page.` : ''}
      </Note>
      <Note>
        {data?.search_available
          ? 'Clicks, impressions and position come from the Search Console cache and lag Google by about two days.'
          : 'Clicks, impressions and position stay empty until the Search Console sync has run (Search tab).'}
      </Note>
    </TabFrame>
  )
}
