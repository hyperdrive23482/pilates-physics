import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, ArrowRight } from 'lucide-react'
import { useEnrollment } from '../../hooks/useEnrollment'
import { useAdminAPI } from '../../hooks/admin/useAdminAPI'
import AdminNav from '../../components/admin/AdminNav'
import StatCard from '../../components/admin/StatCard'

function formatCents(cents) {
  return `$${((cents ?? 0) / 100).toFixed(2)}`
}

export default function AdminDashboard() {
  const { user, signOut } = useEnrollment()
  const { request } = useAdminAPI()
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    request('/api/admin/analytics-summary')
      .then(setData)
      .catch((e) => setError(e.message))
  }, [request])

  const totals = data?.totals
  const upcoming = (data?.per_workshop ?? []).filter((w) => ['upcoming', 'live'].includes(w.status))

  return (
    <div style={{ minHeight: '100vh' }}>
      <AdminNav user={user} onSignOut={signOut} />

      <main className="pp-main" style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <div className="pp-header-row" style={{ marginBottom: '2rem' }}>
          <div>
            <p className="pp-eyebrow" style={{ marginBottom: '0.5rem' }}>
              Admin
            </p>
            <h1 className="pp-page-title">
              Dashboard
            </h1>
          </div>
          <Link to="/admin/workshops/new" className="pp-btn pp-btn--primary">
            <Plus size={14} /> New workshop
          </Link>
        </div>

        {error && <p style={{ color: '#ff7d7d', fontSize: '0.85rem' }}>{error}</p>}
        {!data && !error && (
          <p style={{ color: 'var(--color-ink-muted)', fontSize: '0.9rem' }}>Loading…</p>
        )}

        {totals && (
          <>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '1rem',
                marginBottom: '3rem',
              }}
            >
              <StatCard label="Workshops" value={totals.total_workshops} />
              <StatCard label="Users" value={totals.total_users} />
              <StatCard label="Enrollments" value={totals.total_enrollments} />
              <StatCard label="Revenue" value={formatCents(totals.total_revenue_cents)} />
              <StatCard label="Questions" value={totals.total_questions} />
              <StatCard
                label="Stripe events"
                value={totals.stripe_event_count}
                sublabel={totals.stripe_failed_events > 0 ? `${totals.stripe_failed_events} failed` : 'all processed'}
              />
            </div>

            <section>
              <h2 className="pp-section-label" style={{ marginBottom: '1rem' }}>
                Upcoming / live
              </h2>
              {upcoming.length === 0 ? (
                <p style={{ color: 'var(--color-ink-muted)', fontSize: '0.9rem' }}>
                  No upcoming workshops.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {upcoming.map((w) => (
                    <Link
                      key={w.id}
                      to={`/admin/workshops/${w.slug}/edit`}
                      className="pp-card"
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.9rem 1rem',
                        textDecoration: 'none',
                        color: 'var(--color-ink)',
                      }}
                    >
                      <span style={{ fontSize: '0.95rem' }}>{w.title}</span>
                      <span
                        style={{
                          fontSize: '0.8rem',
                          color: 'var(--color-ink-muted)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                        }}
                      >
                        <span style={{ color: 'var(--color-ink)', fontFamily: 'ui-monospace, SFMono-Regular, monospace' }}>
                          {formatCents(w.revenue_cents)}
                        </span>
                        {w.enrollments} enrolled
                        {w.scheduled_at ? ` · ${new Date(w.scheduled_at).toLocaleString()}` : ''}
                        <ArrowRight size={14} />
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  )
}
