import { useMemo, useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { BAD, Muted, Note, Row, Section, Table, Td } from '../analytics/primitives'
import { NO_VALUE, formatCount } from '../analytics/shared'
import { SEVERITY_ORDER, timeAgo } from '../../../lib/seoFindings'
import { FindingLine, SeverityBadge, SmallButton, Snapshot } from './parts'

/**
 * Audit tab: the latest crawl, its site-level findings, and one expandable
 * row per page showing exactly what a crawler received before JavaScript.
 * Ported from remo's AuditPanel.
 *
 * The page table is the run's stored snapshot, not the findings, so every
 * page gets a row whether or not anything is wrong; "fine" is visible too.
 */

function kindOf(page) {
  if (!page.isShell) return 'full page'
  return page.hasOwnHead ? 'head only' : 'bare shell'
}

function Field({ label, value }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: '0.5rem', fontSize: '0.8rem' }}>
      <span style={{ color: 'var(--color-ink-muted)' }}>{label}</span>
      <span style={{ color: value ? 'var(--color-ink)' : 'var(--color-ink-dim)', overflowWrap: 'anywhere' }}>{value || NO_VALUE}</span>
    </div>
  )
}

function PsiBlock({ psi }) {
  const s = psi.scores ?? {}
  return (
    <div style={{ fontSize: '0.8rem', marginTop: '1rem' }}>
      <Note style={{ margin: 0 }}>PageSpeed (mobile, lab) · checked {timeAgo(psi.checkedAt)}</Note>
      <p style={{ margin: '0.3rem 0 0', color: 'var(--color-ink)' }}>
        Performance <b>{s.performance ?? NO_VALUE}</b> · Accessibility <b>{s.accessibility ?? NO_VALUE}</b> · Best practices{' '}
        <b>{s['best-practices'] ?? NO_VALUE}</b> · SEO <b>{s.seo ?? NO_VALUE}</b>
      </p>
      <p style={{ margin: '0.2rem 0 0', color: 'var(--color-ink-muted)' }}>
        {Object.entries(psi.lab ?? {})
          .map(([k, v]) => `${k.replace(/-/g, ' ')} ${v}`)
          .join(' · ')}
      </p>
      <Note style={{ marginTop: '0.2rem' }}>
        {psi.field
          ? `Field data: ${Object.entries(psi.field)
              .map(([k, v]) => `${k} ${v.percentile} (${v.category})`)
              .join(', ')}`
          : 'No field data: Google needs more real-user traffic than the site has yet. Lab numbers only.'}
      </Note>
    </div>
  )
}

function IndexBlock({ status }) {
  const indexed = status.verdict === 'PASS'
  return (
    <div style={{ fontSize: '0.8rem', marginTop: '1rem' }}>
      <Note style={{ margin: 0 }}>Google index · inspected {timeAgo(status.inspected_at)}</Note>
      <p style={{ margin: '0.3rem 0 0', color: indexed ? 'var(--color-ink)' : BAD }}>
        {status.coverage_state ?? status.verdict ?? NO_VALUE}
        {status.google_canonical ? (
          <span style={{ color: 'var(--color-ink-muted)' }}> · Google&apos;s canonical: {status.google_canonical}</span>
        ) : null}
        {status.last_crawl ? (
          <span style={{ color: 'var(--color-ink-muted)' }}> · last crawl {String(status.last_crawl).slice(0, 10)}</span>
        ) : null}
      </p>
    </div>
  )
}

function PageDetails({ page, findings, psi, index }) {
  const kind = kindOf(page)
  return (
    <div>
      {kind !== 'full page' ? (
        <Muted style={{ marginBottom: '0.75rem' }}>
          {kind === 'head only'
            ? 'The head below is injected server side; the body is empty until JavaScript runs.'
            : 'This URL ships the bare SPA shell: generic title, no canonical, empty body.'}
        </Muted>
      ) : null}
      <div style={{ display: 'grid', gap: '0.3rem' }}>
        {page.redirects?.length ? <Field label="Redirects" value={page.redirects.join('  ')} /> : null}
        {page.error ? <Field label="Error" value={page.error} /> : null}
        <Field label="Title" value={page.title && `${page.title} (${page.title.length} chars)`} />
        <Field label="Description" value={page.description && `${page.description} (${page.description.length} chars)`} />
        <Field label="Canonical" value={page.canonical} />
        <Field label="og:image" value={page.ogImage} />
        <Field
          label="Robots"
          value={[page.robotsMeta && `meta: ${page.robotsMeta}`, page.xRobotsTag && `header: ${page.xRobotsTag}`].filter(Boolean).join(' · ') || null}
        />
        <Field label="Headings" value={page.headings?.length ? page.headings.map((h) => `h${h}`).join(' ') : null} />
        <Field
          label="JSON-LD"
          value={
            page.jsonLd?.count > 0
              ? `${page.jsonLd.parsed}/${page.jsonLd.count} parsed · ${page.jsonLd.types.join(', ') || 'no @type'}`
              : null
          }
        />
        <Field label="Images" value={page.images?.total > 0 ? `${page.images.total}, ${page.images.withoutAlt} without alt` : null} />
        <Field label="Links out" value={page.internalLinks > 0 ? String(page.internalLinks) : null} />
        <Field label="Sitemap" value={page.inSitemap ? 'listed' : page.source === 'extra' ? 'not listed (noindex by design)' : 'not listed'} />
      </div>
      {index ? <IndexBlock status={index} /> : null}
      {psi ? <PsiBlock psi={psi} /> : null}
      <div style={{ borderTop: '1px solid var(--color-rule)', marginTop: '1rem', paddingTop: '1rem', display: 'grid', gap: '0.9rem' }}>
        {findings.length ? findings.map((f) => <FindingLine key={f.id} f={f} />) : <Muted>No findings for this page.</Muted>}
      </div>
    </div>
  )
}

function PageRow({ page, findings, psi, index }) {
  const [open, setOpen] = useState(false)
  const worst = findings.reduce((w, f) => (w === null || SEVERITY_ORDER[f.severity] < SEVERITY_ORDER[w] ? f.severity : w), null)
  const Chevron = open ? ChevronDown : ChevronRight
  const kind = kindOf(page)
  return (
    <>
      <Row onClick={() => setOpen((v) => !v)} open={open}>
        <Td>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>
            <Chevron size={14} color="var(--color-ink-dim)" />
            {page.path}
          </span>
        </Td>
        <Td align="right" mono style={{ color: page.status === 200 ? undefined : BAD }}>
          {page.status || 'ERR'}
        </Td>
        <Td align="right" mono muted>
          {page.ms} ms
        </Td>
        <Td muted={kind !== 'full page'}>{kind}</Td>
        <Td align="right" mono muted>
          {typeof psi?.scores?.performance === 'number' ? psi.scores.performance : NO_VALUE}
        </Td>
        <Td style={{ color: index ? (index.verdict === 'PASS' ? 'var(--color-ink-muted)' : BAD) : 'var(--color-ink-dim)' }}>
          {index ? (index.verdict === 'PASS' ? 'indexed' : 'not indexed') : NO_VALUE}
        </Td>
        <Td>{worst ? <SeverityBadge severity={worst} /> : <span style={{ fontSize: '0.75rem', color: 'var(--color-ink-dim)' }}>ok</span>}</Td>
      </Row>
      {open ? (
        <tr style={{ borderBottom: '1px solid var(--color-rule)' }}>
          <td colSpan={7} style={{ padding: '1rem 1.25rem 1.25rem 2.5rem', background: 'rgba(227, 227, 227, 0.03)' }}>
            <PageDetails page={page} findings={findings} psi={psi} index={index} />
          </td>
        </tr>
      ) : null}
    </>
  )
}

export default function AuditPanel({ overview, findings, busy, onRunAudit, onRunPsi, onRunInspect }) {
  const run = findings?.run ?? null
  const latest = overview?.latest ?? null
  const config = overview?.config ?? {}
  const [psiPath, setPsiPath] = useState('/')

  const byPath = useMemo(() => {
    const m = new Map()
    for (const f of findings?.findings ?? []) {
      const key = f.path ?? ''
      m.set(key, [...(m.get(key) ?? []), f])
    }
    for (const list of m.values()) list.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity])
    return m
  }, [findings])

  const pages = useMemo(() => {
    const order = { sitemap: 0, extra: 1, link: 2 }
    return [...(run?.pages ?? [])].sort((a, b) => order[a.source] - order[b.source])
  }, [run])

  const siteFindings = byPath.get('') ?? []
  const auditing = busy === 'run-audit' || latest?.status === 'running'

  return (
    <div>
      <div className="pp-card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '1.5rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem' }}>
            <Snapshot
              label="Last audit"
              value={run ? timeAgo(run.finished_at ?? run.started_at) : 'never'}
              hint={run ? `${run.triggered_by === 'cron' ? 'scheduled' : 'manual'} · ${run.site_origin}` : 'Run one to start'}
            />
            <Snapshot label="Pages" value={formatCount(run?.pages_crawled ?? null)} hint="crawled" />
            <Snapshot label="Errors" value={formatCount(run?.errors ?? null)} />
            <Snapshot label="Warnings" value={formatCount(run?.warnings ?? null)} />
            <Snapshot label="Info" value={formatCount(run?.infos ?? null)} />
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'flex-start' }}>
            <SmallButton primary onClick={onRunAudit} disabled={Boolean(busy) || auditing}>
              {auditing ? 'Crawling…' : 'Run audit'}
            </SmallButton>
            <SmallButton
              onClick={onRunInspect}
              disabled={Boolean(busy) || !run || !config.gsc}
              title={config.gsc ? 'Asks Google whether each sitemap URL is indexed' : 'Search Console is not connected'}
            >
              {busy === 'run-inspect' ? 'Asking Google…' : 'Check index status'}
            </SmallButton>
          </div>
        </div>
        {run ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center', marginTop: '1.25rem' }}>
            <select
              value={psiPath}
              onChange={(e) => setPsiPath(e.target.value)}
              aria-label="Page to check"
              style={{
                background: 'var(--color-surface)',
                color: 'var(--color-ink)',
                border: '1px solid var(--color-rule)',
                borderRadius: 4,
                padding: '0.4rem 0.6rem',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                maxWidth: '100%',
              }}
            >
              {(pages.some((p) => p.path === '/') ? pages : [{ path: '/' }, ...pages])
                .filter((p) => p.path === '/' || p.inSitemap)
                .map((p) => (
                  <option key={p.path} value={p.path}>
                    {p.path}
                  </option>
                ))}
            </select>
            <SmallButton onClick={() => onRunPsi(psiPath)} disabled={Boolean(busy)}>
              {busy === 'run-psi' ? 'Checking… (up to 2 min)' : 'Check page speed'}
            </SmallButton>
            {!config.pagespeed_key ? (
              <Note style={{ margin: 0 }}>No PAGESPEED_API_KEY set, so Google&apos;s shared quota applies and a check may be refused.</Note>
            ) : null}
          </div>
        ) : null}
        {latest?.status === 'failed' ? (
          <p style={{ color: BAD, fontSize: '0.85rem', margin: '1rem 0 0' }}>
            The last run failed {timeAgo(latest.started_at)}: {latest.error}
          </p>
        ) : null}
      </div>

      {!run ? (
        <Muted>
          No audit has run yet. <b>Run audit</b> crawls the production site the way a crawler that does not run JavaScript sees it. It takes
          a few seconds.
        </Muted>
      ) : (
        <>
          <Section
            title="Site-wide"
            note={
              run.site
                ? `robots.txt ${run.site.robotsOk ? 'ok' : 'missing'} · sitemap ${run.site.sitemapOk ? `${run.site.sitemapCount} URLs` : 'missing'}${
                    run.site.offHost?.length ? ` · ${run.site.offHost.length} off-host` : ''
                  } · ${pages.filter((p) => p.source === 'link').length} found by link only`
                : null
            }
          >
            {siteFindings.length === 0 ? (
              <Muted>No site-level findings.</Muted>
            ) : (
              <div className="pp-card" style={{ display: 'grid', gap: '1rem' }}>
                {siteFindings.map((f) => (
                  <FindingLine key={f.id} f={f} />
                ))}
              </div>
            )}
          </Section>

          <Section title="Pages" note="Click a row for what the URL returned before JavaScript">
            <Table
              minWidth={720}
              head={[
                ['Path'],
                ['Status', 'right'],
                ['Time', 'right'],
                ['Raw HTML', 'left', 'full page: body rendered server side; head only: own head, empty body; bare shell: neither'],
                ['Speed', 'right', 'PageSpeed mobile performance score, when checked'],
                ['Google'],
                ['Worst'],
              ]}
            >
              {pages.map((p) => (
                <PageRow
                  key={p.path}
                  page={p}
                  findings={byPath.get(p.path) ?? []}
                  psi={run.psi?.[p.path]}
                  index={findings?.index_status?.[p.path]}
                />
              ))}
            </Table>
            <Note>
              What each URL returned before any JavaScript ran: what link previews, most AI crawlers and Bing&apos;s first pass see. Google
              renders JavaScript as well, later.
            </Note>
          </Section>
        </>
      )}
    </div>
  )
}
