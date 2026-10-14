import { Link } from 'react-router-dom'
import { useEnrollment } from '../../hooks/useEnrollment'
import AdminNav from '../../components/admin/AdminNav'

/**
 * Phase 3 of docs/admin-analytics-engine-plan.md. The route and nav entry
 * exist so the shape of the admin is final; the dashboard is built after the
 * SEO foundations (sitemap, robots, per-page head, JSON-LD) ship.
 */
export default function AdminSeo() {
  const { user, signOut } = useEnrollment()
  return (
    <div style={{ minHeight: '100vh' }}>
      <AdminNav user={user} onSignOut={signOut} />
      <main className="pp-main" style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <p className="pp-eyebrow" style={{ marginBottom: '0.5rem' }}>
          Admin
        </p>
        <h1 className="pp-page-title" style={{ marginBottom: '1.5rem' }}>
          SEO
        </h1>
        <div className="pp-card" style={{ maxWidth: 640 }}>
          <p style={{ margin: '0 0 0.75rem', color: 'var(--color-ink)', fontSize: '0.95rem' }}>
            Not built yet. This page will hold the site audit, ranked recommendations, a per-page report
            card joining PostHog and Search Console, and search query data.
          </p>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-ink-muted)' }}>
            The site has no sitemap, robots.txt or per-page meta today, so the foundations come first. Plan:
            docs/admin-analytics-engine-plan.md, section 7. Traffic data is accruing on{' '}
            <Link to="/admin/analytics" style={{ color: 'var(--color-accent)' }}>
              Analytics
            </Link>
            .
          </p>
        </div>
      </main>
    </div>
  )
}
