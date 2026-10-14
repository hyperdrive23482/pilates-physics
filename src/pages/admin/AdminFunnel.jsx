import { Link } from 'react-router-dom'
import { useEnrollment } from '../../hooks/useEnrollment'
import AdminNav from '../../components/admin/AdminNav'

/**
 * Phase 2 of docs/admin-analytics-engine-plan.md. The route and nav entry
 * exist so the shape of the admin is final; the page itself is built once
 * Phase 0 has accrued enough data to be worth charting.
 */
export default function AdminFunnel() {
  const { user, signOut } = useEnrollment()
  return (
    <div style={{ minHeight: '100vh' }}>
      <AdminNav user={user} onSignOut={signOut} />
      <main className="pp-main" style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <p className="pp-eyebrow" style={{ marginBottom: '0.5rem' }}>
          Admin
        </p>
        <h1 className="pp-page-title" style={{ marginBottom: '1.5rem' }}>
          Funnel
        </h1>
        <div className="pp-card" style={{ maxWidth: 640 }}>
          <p style={{ margin: '0 0 0.75rem', color: 'var(--color-ink)', fontSize: '0.95rem' }}>
            Not built yet. This page will show the six-step period funnel: web traffic, calculator leads, the
            offer window, the $39 course, core workshops, and repeat buyers, each with its sources.
          </p>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-ink-muted)' }}>
            It depends on data that started accruing with Phase 0. Check the data sources strip on{' '}
            <Link to="/admin/analytics" style={{ color: 'var(--color-accent)' }}>
              Analytics
            </Link>{' '}
            to see what has landed so far. Plan: docs/admin-analytics-engine-plan.md, section 6.
          </p>
        </div>
      </main>
    </div>
  )
}
