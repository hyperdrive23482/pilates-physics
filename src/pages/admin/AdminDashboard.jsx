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
  const upcoming = (data?.per_webinar ?? []).filter((w) => ['upcoming', 'live'].includes(w.status))

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <AdminNav user={user} onSignOut={signOut} />

      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '6rem 2rem 4rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', marginBottom: '2rem' }}>
          <div>
            <p
              style={{
                fontSize: '0.7rem',
                fontWeight: 600,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: 'var(--color-accent)',
                marginBottom: '0.5rem',
              }}
            >
              Admin
            </p>
            <h1
              style={{
                fontFamily: '"DM Serif Display", serif',
                fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
                lineHeight: 1.15,
                color: 'var(--color-ink)',
                margin: 0,
              }}
            >
              Dashboard
            </h1>
          </div>
          <Link
            to="/admin/webinars/new"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.75rem 1.25rem',
              background: 'var(--color-accent)',
              color: '#1C1A17',
              textDecoration: 'none',
              fontSize: '0.85rem',
              fontWeight: 500,
            }}
          >
            <Plus size={14} /> New webinar
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
              <StatCard label="Webinars" value={totals.total_webinars} />
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
              <h2
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color: 'var(--color-ink-muted)',
                  marginBottom: '1rem',
                }}
              >
                Upcoming / live
              </h2>
              {upcoming.length === 0 ? (
                <p style={{ color: 'var(--color-ink-muted)', fontSize: '0.9rem' }}>
                  No upcoming webinars.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {upcoming.map((w) => (
                    <Link
                      key={w.id}
                      to={`/admin/webinars/${w.slug}/edit`}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.9rem 1rem',
                        background: 'var(--color-surface)',
                        border: '1px solid var(--color-rule)',
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
