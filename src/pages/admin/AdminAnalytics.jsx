import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useEnrollment } from '../../hooks/useEnrollment'
import AdminNav from '../../components/admin/AdminNav'
import DateRangeSelect from '../../components/admin/analytics/DateRangeSelect'
import RevenueTab from '../../components/admin/analytics/tabs/RevenueTab'
import ProductsTab from '../../components/admin/analytics/tabs/ProductsTab'
import LearnersTab from '../../components/admin/analytics/tabs/LearnersTab'
import AudienceTab from '../../components/admin/analytics/tabs/AudienceTab'
import EngagementTab from '../../components/admin/analytics/tabs/EngagementTab'
import { DEFAULT_RANGE, isDateRange } from '../../components/admin/analytics/shared'

/**
 * /admin/analytics, Phase 1 of docs/admin-analytics-engine-plan.md.
 *
 * Five tabs, each backed by its own route under /api/admin/analytics so a
 * slow or failing source costs one tab. The tab lives in ?tab= so a view can
 * be linked; the range is one control shared by every tab and remembered
 * per browser. Learners is all time by nature and says so.
 */
const TABS = [
  { id: 'revenue', label: 'Revenue', Component: RevenueTab },
  { id: 'products', label: 'Products', Component: ProductsTab },
  { id: 'learners', label: 'Learners', Component: LearnersTab, allTime: true },
  { id: 'audience', label: 'Audience', Component: AudienceTab },
  { id: 'engagement', label: 'Engagement', Component: EngagementTab },
]

export default function AdminAnalytics() {
  const { user, signOut } = useEnrollment()
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

  return (
    <div style={{ minHeight: '100vh' }}>
      <AdminNav user={user} onSignOut={signOut} />

      <main className="pp-main" style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <div className="pp-header-row" style={{ marginBottom: '1.5rem' }}>
          <div>
            <p className="pp-eyebrow" style={{ marginBottom: '0.5rem' }}>
              Admin
            </p>
            <h1 className="pp-page-title">Analytics</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <DateRangeSelect value={range} onChange={changeRange} />
            {tab.allTime ? (
              <span style={{ fontSize: '0.7rem', color: 'var(--color-ink-dim)' }}>This tab is all time</span>
            ) : null}
          </div>
        </div>

        <nav
          className="pp-tabs-scroll"
          aria-label="Analytics tabs"
          style={{
            display: 'flex',
            gap: '1.5rem',
            borderBottom: '1px solid var(--color-rule)',
            marginBottom: '2rem',
          }}
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

        <tab.Component key={tab.id} range={range} />
      </main>
    </div>
  )
}
