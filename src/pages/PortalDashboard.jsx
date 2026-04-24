import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useEnrollment } from '../hooks/useEnrollment'
import { useMyWebinars } from '../hooks/useWebinars'
import PortalNav from '../components/portal/PortalNav'
import WebinarCard from '../components/portal/WebinarCard'
import { BookOpen, ArrowRight } from 'lucide-react'

export default function PortalDashboard() {
  const { user, loading: authLoading, signOut } = useEnrollment()
  const navigate = useNavigate()
  const { webinars, loading: webinarsLoading } = useMyWebinars(user?.id)

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login', { replace: true })
    }
  }, [authLoading, user, navigate])

  if (authLoading || !user) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'var(--color-bg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: '"DM Sans", sans-serif',
          color: 'var(--color-ink-muted)',
          fontSize: '0.9rem',
        }}
      >
        Loading...
      </div>
    )
  }

  const firstName = user.user_metadata?.first_name || ''

  const tools = webinars.filter((w) => w.kind === 'tool')
  const nonTools = webinars.filter((w) => w.kind !== 'tool')
  const upcoming = nonTools.filter((w) => w.status === 'upcoming' || w.status === 'live')
  const completed = nonTools.filter((w) => w.status === 'complete')
  const archived = nonTools.filter((w) => w.status === 'archived')

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <PortalNav user={user} onSignOut={signOut} />

      <main
        className="pp-main"
        style={{
          maxWidth: '960px',
          margin: '0 auto',
        }}
      >
        {/* Welcome */}
        <div style={{ marginBottom: '3rem' }}>
          <p
            style={{
              fontSize: '0.7rem',
              fontWeight: '600',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: 'var(--color-accent)',
              marginBottom: '0.75rem',
            }}
          >
            Your Portal
          </p>
          <h1
            style={{
              fontFamily: '"DM Serif Display", serif',
              fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
              lineHeight: '1.15',
              color: 'var(--color-ink)',
              margin: 0,
            }}
          >
            {firstName ? `Welcome back, ${firstName}` : 'Welcome back'}
          </h1>
        </div>

        {webinarsLoading ? (
          <p style={{ color: 'var(--color-ink-muted)', fontSize: '0.9rem' }}>
            Loading your webinars...
          </p>
        ) : webinars.length === 0 ? (
          /* Empty state */
          <div
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-rule)',
              padding: '3rem 2rem',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1.25rem',
            }}
          >
            <BookOpen size={36} style={{ color: 'var(--color-ink-muted)' }} />
            <h2
              style={{
                fontFamily: '"DM Serif Display", serif',
                fontSize: '1.25rem',
                color: 'var(--color-ink)',
                margin: 0,
              }}
            >
              No webinars yet
            </h2>
            <p
              style={{
                fontSize: '0.9rem',
                color: 'var(--color-ink-muted)',
                margin: 0,
                maxWidth: '400px',
                lineHeight: '1.6',
              }}
            >
              You don't have access to any webinars yet. Browse available sessions and register for one.
            </p>
            <Link
              to="/workshops"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.375rem',
                padding: '0.75rem 1.5rem',
                background: 'var(--color-accent)',
                color: '#1C1A17',
                textDecoration: 'none',
                fontSize: '0.9rem',
                fontWeight: '500',
                fontFamily: '"DM Sans", sans-serif',
              }}
            >
              Browse Webinars <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
            {/* Tools */}
            {tools.length > 0 && (
              <section>
                <h2
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: '600',
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    color: 'var(--color-ink-muted)',
                    marginBottom: '1.25rem',
                  }}
                >
                  Tools
                </h2>
                <div className="portal-grid">
                  {tools.map((w) => (
                    <WebinarCard key={w.id} webinar={w} linkTo={`/portal/${w.slug}`} />
                  ))}
                </div>
              </section>
            )}

            {/* Upcoming / Live */}
            {upcoming.length > 0 && (
              <section>
                <h2
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: '600',
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    color: 'var(--color-ink-muted)',
                    marginBottom: '1.25rem',
                  }}
                >
                  Upcoming
                </h2>
                <div className="portal-grid">
                  {upcoming.map((w) => (
                    <WebinarCard key={w.id} webinar={w} linkTo={`/portal/${w.slug}`} />
                  ))}
                </div>
              </section>
            )}

            {/* Completed */}
            {completed.length > 0 && (
              <section>
                <h2
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: '600',
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    color: 'var(--color-ink-muted)',
                    marginBottom: '1.25rem',
                  }}
                >
                  Recordings Available
                </h2>
                <div className="portal-grid">
                  {completed.map((w) => (
                    <WebinarCard key={w.id} webinar={w} linkTo={`/portal/${w.slug}`} />
                  ))}
                </div>
              </section>
            )}

            {/* Archived */}
            {archived.length > 0 && (
              <section>
                <h2
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: '600',
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    color: 'var(--color-ink-muted)',
                    marginBottom: '1.25rem',
                  }}
                >
                  Past Sessions
                </h2>
                <div className="portal-grid">
                  {archived.map((w) => (
                    <WebinarCard key={w.id} webinar={w} linkTo={`/portal/${w.slug}`} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* Browse more */}
        {webinars.length > 0 && (
          <div
            style={{
              marginTop: '3rem',
              paddingTop: '2rem',
              borderTop: '1px solid var(--color-rule)',
              textAlign: 'center',
            }}
          >
            <Link
              to="/workshops"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.375rem',
                fontSize: '0.9rem',
                color: 'var(--color-accent)',
                textDecoration: 'none',
                fontWeight: '500',
              }}
            >
              Browse workshops <ArrowRight size={14} />
            </Link>
          </div>
        )}
      </main>

      <style>{`
        .portal-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.25rem;
        }
        @media (max-width: 700px) {
          .portal-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}
