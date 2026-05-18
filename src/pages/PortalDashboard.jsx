import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useEnrollment } from '../hooks/useEnrollment'
import { useMyWorkshops } from '../hooks/useWorkshops'
import PortalNav from '../components/portal/PortalNav'
import WorkshopCard from '../components/portal/WorkshopCard'
import Pp101FeedbackBanner from '../components/portal/Pp101FeedbackBanner'
import { BookOpen, ArrowRight } from 'lucide-react'

export default function PortalDashboard() {
  const { user, loading: authLoading, signOut } = useEnrollment()
  const navigate = useNavigate()
  const { workshops, loading: workshopsLoading } = useMyWorkshops(user?.id)

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
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-ink-muted)',
          fontSize: '0.9rem',
        }}
      >
        Loading...
      </div>
    )
  }

  const firstName = user.user_metadata?.first_name || ''

  const tools = workshops.filter((w) => w.kind === 'tool')
  const nonTools = workshops.filter((w) => w.kind !== 'tool')
  const upcoming = nonTools.filter((w) => w.status === 'upcoming' || w.status === 'live')
  const completed = nonTools.filter((w) => w.status === 'complete')
  const archived = nonTools.filter((w) => w.status === 'archived')

  return (
    <div style={{ minHeight: '100vh' }}>
      <PortalNav user={user} onSignOut={signOut} />

      <main
        className="pp-main"
        style={{
          maxWidth: '960px',
          margin: '0 auto',
        }}
      >
        <Pp101FeedbackBanner user={user} workshops={workshops} />

        {/* Welcome */}
        <div style={{ marginBottom: '3rem' }}>
          <p className="pp-eyebrow" style={{ marginBottom: '0.75rem' }}>
            Your Portal
          </p>
          <h1 className="pp-page-title">
            {firstName ? `Welcome back, ${firstName}` : 'Welcome back'}
          </h1>
        </div>

        {workshopsLoading ? (
          <p style={{ color: 'var(--color-ink-muted)', fontSize: '0.9rem' }}>
            Loading your workshops...
          </p>
        ) : workshops.length === 0 ? (
          /* Empty state */
          <div
            className="pp-card"
            style={{
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
                fontSize: '1.25rem',
                color: 'var(--color-ink)',
                margin: 0,
              }}
            >
              No workshops yet
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
              You don't have access to any workshops yet. Browse available sessions and register for one.
            </p>
            <Link to="/education" className="pp-btn pp-btn--primary">
              Browse Workshops <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
            {/* Tools */}
            {tools.length > 0 && (
              <section>
                <h2 className="pp-section-label" style={{ marginBottom: '1.25rem' }}>
                  Tools
                </h2>
                <div className="portal-grid">
                  {tools.map((w) => (
                    <WorkshopCard key={w.id} workshop={w} linkTo={`/portal/${w.slug}`} />
                  ))}
                </div>
              </section>
            )}

            {/* Upcoming / Live */}
            {upcoming.length > 0 && (
              <section>
                <h2 className="pp-section-label" style={{ marginBottom: '1.25rem' }}>
                  Upcoming
                </h2>
                <div className="portal-grid">
                  {upcoming.map((w) => (
                    <WorkshopCard key={w.id} workshop={w} linkTo={`/portal/${w.slug}`} />
                  ))}
                </div>
              </section>
            )}

            {/* Completed */}
            {completed.length > 0 && (
              <section>
                <h2 className="pp-section-label" style={{ marginBottom: '1.25rem' }}>
                  Recordings Available
                </h2>
                <div className="portal-grid">
                  {completed.map((w) => (
                    <WorkshopCard key={w.id} workshop={w} linkTo={`/portal/${w.slug}`} />
                  ))}
                </div>
              </section>
            )}

            {/* Archived */}
            {archived.length > 0 && (
              <section>
                <h2 className="pp-section-label" style={{ marginBottom: '1.25rem' }}>
                  Past Sessions
                </h2>
                <div className="portal-grid">
                  {archived.map((w) => (
                    <WorkshopCard key={w.id} workshop={w} linkTo={`/portal/${w.slug}`} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* Browse more */}
        {workshops.length > 0 && (
          <div
            style={{
              marginTop: '3rem',
              paddingTop: '2rem',
              borderTop: '1px solid var(--color-rule)',
              textAlign: 'center',
            }}
          >
            <Link
              to="/education"
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
