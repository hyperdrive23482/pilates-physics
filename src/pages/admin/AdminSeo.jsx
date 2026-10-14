import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useEnrollment } from '../../hooks/useEnrollment'
import { useAdminAPI } from '../../hooks/admin/useAdminAPI'
import AdminNav from '../../components/admin/AdminNav'
import DateRangeSelect from '../../components/admin/analytics/DateRangeSelect'
import { BAD, Muted, Note } from '../../components/admin/analytics/primitives'
import { DEFAULT_RANGE, isDateRange } from '../../components/admin/analytics/shared'
import AuditPanel from '../../components/admin/seo/AuditPanel'
import RecommendationsPanel from '../../components/admin/seo/RecommendationsPanel'
import PagesPanel from '../../components/admin/seo/PagesPanel'
import SearchPanel from '../../components/admin/seo/SearchPanel'

/**
 * /admin/seo, Phase 3b of docs/admin-analytics-engine-plan.md, ported from
 * remo's /superadmin/seo.
 *
 * Four tabs: Audit · Recommendations · Pages · Search. This file is the shell:
 * the tab strip (in ?tab= so a view can be linked), the range shared by Pages
 * and Search, the overview and latest-run findings both of the first two tabs
 * read, and the actions. One action runs at a time; its result or error shows
 * in the line under the header.
 *
 * The overview is re-read every few seconds while a run is `running` (a cron
 * crawl can be in flight when the page opens). A failed run is never left
 * `running`, so the poll always ends.
 */

const TABS = [
  { id: 'audit', label: 'Audit' },
  { id: 'recommendations', label: 'Recommendations' },
  { id: 'pages', label: 'Pages', ranged: true },
  { id: 'search', label: 'Search', ranged: true },
]
const POLL_MS = 3000

/** Pages or Search data for a range, refetched when `version` bumps. */
function useRangedSeo(action, range, version, enabled) {
  const { request } = useAdminAPI()
  const key = `${action}|${range}|${version}`
  const [state, setState] = useState({ data: null, error: null, loading: false, key: null })
  const latest = useRef(key)

  useEffect(() => {
    if (!enabled) return
    latest.current = key
    setState((s) => ({ ...s, loading: true, error: null }))
    request(`/api/admin/seo?action=${action}&range=${encodeURIComponent(range)}`)
      .then((data) => {
        if (latest.current === key) setState({ data, error: null, loading: false, key })
      })
      .catch((e) => {
        if (latest.current === key) setState((s) => ({ ...s, error: e.message, loading: false }))
      })
  }, [request, action, range, key, enabled])

  return { data: state.data, error: state.error, loading: state.loading, stale: state.key !== key && state.data !== null }
}

function describe(action, r) {
  switch (action) {
    case 'run-audit':
      return `Audit finished: ${r.pages} pages · ${r.errors} errors · ${r.warnings} warnings · ${r.infos} info · ${(r.ms / 1000).toFixed(1)} s`
    case 'run-psi':
      return `Page speed checked for ${r.path}: performance ${r.summary?.scores?.performance ?? '—'} · ${Math.round(r.ms / 1000)} s`
    case 'run-sync':
      return `Search Console ${r.backfill ? 'backfilled' : 'synced'}: ${r.window.start} to ${r.window.end} · ${r.query_rows} query rows · ${r.total_rows} page-days · newest ${r.newest_date ?? 'none'}`
    case 'run-inspect':
      return `Index status: ${r.indexed} of ${r.inspected} sitemap pages indexed · ${r.findings} finding${r.findings === 1 ? '' : 's'}${
        r.failures.length ? ` · ${r.failures.length} failed: ${r.failures[0].error}` : ''
      }`
    case 'recommend': {
      const o = r.narrative.output
      return `Recommendations written: ${o.top_changes.length} changes · ${o.rewrites.length} rewrites · ${o.content_ideas.length} ideas · $${Number(r.narrative.cost_usd).toFixed(3)}`
    }
    default:
      return 'Done.'
  }
}

export default function AdminSeo() {
  const { user, signOut } = useEnrollment()
  const { request } = useAdminAPI()
  const [searchParams, setSearchParams] = useSearchParams()
  const tabId = TABS.some((t) => t.id === searchParams.get('tab')) ? searchParams.get('tab') : TABS[0].id
  const tab = TABS.find((t) => t.id === tabId)

  const [range, setRange] = useState(() => {
    try {
      const saved = window.localStorage.getItem('pp.admin.range')
      return isDateRange(saved) ? saved : DEFAULT_RANGE
    } catch {
      return DEFAULT_RANGE
    }
  })
  const [overview, setOverview] = useState(null)
  const [findings, setFindings] = useState(null)
  const [loadError, setLoadError] = useState(null)
  const [busy, setBusy] = useState(null)
  const [notice, setNotice] = useState(null)
  const [version, setVersion] = useState(0)

  const pagesState = useRangedSeo('pages', range, version, tabId === 'pages')
  const searchState = useRangedSeo('search', range, version, tabId === 'search')

  const loadOverview = useCallback(async () => {
    try {
      const o = await request('/api/admin/seo?action=overview')
      setOverview(o)
      return o
    } catch (e) {
      setLoadError(e.message)
      return null
    }
  }, [request])

  const loadFindings = useCallback(async () => {
    try {
      setFindings(await request('/api/admin/seo?action=findings'))
    } catch (e) {
      setLoadError(e.message)
    }
  }, [request])

  useEffect(() => {
    loadOverview()
    loadFindings()
  }, [loadOverview, loadFindings])

  const inFlight = overview?.latest?.status === 'running' && busy !== 'run-audit'
  useEffect(() => {
    if (!inFlight) return undefined
    const id = setInterval(async () => {
      const o = await loadOverview()
      if (o && o.latest?.status !== 'running') loadFindings()
    }, POLL_MS)
    return () => clearInterval(id)
  }, [inFlight, loadOverview, loadFindings])

  async function act(action, body = {}) {
    setBusy(action)
    setNotice(null)
    try {
      const r = await request('/api/admin/seo', { method: 'POST', body: { action, ...body } })
      setNotice({ tone: 'ok', text: describe(action, r) })
      if (action === 'run-sync') setVersion((v) => v + 1)
      await Promise.all([loadOverview(), loadFindings()])
    } catch (e) {
      setNotice({ tone: 'bad', text: e.message })
      await loadOverview()
    } finally {
      setBusy(null)
    }
  }

  async function setDismissals(action, items) {
    try {
      for (const item of items) await request('/api/admin/seo', { method: 'POST', body: { action, ...item } })
      await loadFindings()
    } catch (e) {
      setNotice({ tone: 'bad', text: e.message })
    }
  }

  function changeRange(next) {
    setRange(next)
    try {
      window.localStorage.setItem('pp.admin.range', next)
    } catch {
      // Per-browser convenience only.
    }
  }

  function selectTab(id) {
    const next = new URLSearchParams(searchParams)
    if (id === TABS[0].id) next.delete('tab')
    else next.set('tab', id)
    setSearchParams(next, { replace: true })
  }

  const ready = overview !== null && findings !== null

  return (
    <div style={{ minHeight: '100vh' }}>
      <AdminNav user={user} onSignOut={signOut} />

      <main className="pp-main" style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <div className="pp-header-row" style={{ marginBottom: '1.5rem' }}>
          <div>
            <p className="pp-eyebrow" style={{ marginBottom: '0.5rem' }}>
              Admin
            </p>
            <h1 className="pp-page-title">SEO</h1>
          </div>
          {tab.ranged ? <DateRangeSelect value={range} onChange={changeRange} /> : null}
        </div>

        <nav
          className="pp-tabs-scroll"
          aria-label="SEO tabs"
          style={{ display: 'flex', gap: '1.5rem', borderBottom: '1px solid var(--color-rule)', marginBottom: '1.5rem' }}
        >
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => selectTab(t.id)}
              aria-current={t.id === tabId ? 'page' : undefined}
              style={{
                background: 'transparent',
                border: 'none',
                color: t.id === tabId ? 'var(--color-ink)' : 'var(--color-ink-muted)',
                borderBottom: t.id === tabId ? '2px solid var(--color-accent)' : '2px solid transparent',
                padding: '0.5rem 0',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontFamily: 'var(--font-serif)',
                whiteSpace: 'nowrap',
              }}
            >
              {t.label}
            </button>
          ))}
        </nav>

        {notice ? (
          <Note tone={notice.tone === 'bad' ? 'bad' : 'muted'} style={{ margin: '0 0 1.5rem', fontSize: '0.8rem' }}>
            {notice.text}
          </Note>
        ) : null}
        {loadError && !ready ? <p style={{ color: BAD, fontSize: '0.85rem' }}>{loadError}</p> : null}
        {!ready && !loadError ? <Muted style={{ fontSize: '0.9rem' }}>Loading…</Muted> : null}

        {ready && tabId === 'audit' ? (
          <AuditPanel
            overview={overview}
            findings={findings}
            busy={busy}
            onRunAudit={() => act('run-audit')}
            onRunPsi={(path) => act('run-psi', { path })}
            onRunInspect={() => act('run-inspect')}
          />
        ) : null}
        {ready && tabId === 'recommendations' ? (
          <RecommendationsPanel
            findings={findings}
            overview={overview}
            busy={busy}
            onRunAudit={() => act('run-audit')}
            onRecommend={() => act('recommend')}
            onDismiss={(items) => setDismissals('dismiss', items)}
            onUndismiss={(items) => setDismissals('undismiss', items)}
          />
        ) : null}
        {ready && tabId === 'pages' ? <PagesPanel state={pagesState} /> : null}
        {ready && tabId === 'search' ? (
          <SearchPanel
            state={searchState}
            gscConnected={Boolean(overview?.config?.gsc)}
            busy={busy}
            onRunSync={(backfill) => act('run-sync', { backfill })}
          />
        ) : null}
      </main>
    </div>
  )
}
