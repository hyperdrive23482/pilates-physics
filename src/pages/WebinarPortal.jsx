import { useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useEnrollment } from '../hooks/useEnrollment'
import { useWebinar } from '../hooks/useWebinars'
import { useEntitlements } from '../hooks/useEntitlements'
import { useWebinarContent } from '../hooks/useWebinarContent'
import PortalNav from '../components/portal/PortalNav'
import StatusBadge from '../components/portal/StatusBadge'
import ZoomInfo from '../components/portal/ZoomInfo'
import ContentItem from '../components/portal/ContentItem'
import QuestionForm from '../components/portal/QuestionForm'
import ToolHost from '../components/portal/ToolHost'

export default function WebinarPortal() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { user, loading: authLoading, signOut } = useEnrollment()
  const { webinar, loading: webinarLoading } = useWebinar(slug)
  const { hasAccess, loading: entLoading } = useEntitlements(user?.id)
  const { content, loading: contentLoading } = useWebinarContent(webinar?.id, webinar?.status)

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login', { replace: true })
    }
  }, [authLoading, user, navigate])

  // Check entitlement once loaded
  const allLoaded = !authLoading && !webinarLoading && !entLoading
  const canAccess = webinar && hasAccess(webinar.id)

  if (!allLoaded) {
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

  if (!webinar) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
        <PortalNav user={user} onSignOut={signOut} />
        <main style={{ maxWidth: '680px', margin: '0 auto', padding: '6rem 2rem', textAlign: 'center' }}>
          <h1
            style={{
              fontFamily: '"DM Serif Display", serif',
              fontSize: '1.5rem',
              color: 'var(--color-ink)',
              marginBottom: '1rem',
            }}
          >
            Webinar not found
          </h1>
          <Link to="/portal" style={{ color: 'var(--color-accent)', textDecoration: 'none', fontSize: '0.9rem' }}>
            Back to dashboard
          </Link>
        </main>
      </div>
    )
  }

  if (!canAccess) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
        <PortalNav user={user} onSignOut={signOut} />
        <main style={{ maxWidth: '680px', margin: '0 auto', padding: '6rem 2rem', textAlign: 'center' }}>
          <h1
            style={{
              fontFamily: '"DM Serif Display", serif',
              fontSize: '1.5rem',
              color: 'var(--color-ink)',
              marginBottom: '1rem',
            }}
          >
            Access required
          </h1>
          <p style={{ color: 'var(--color-ink-muted)', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>
            You don't have access to this webinar. Register to get access.
          </p>
          <Link
            to={`/workshops/${slug}`}
            style={{
              display: 'inline-block',
              padding: '0.75rem 1.5rem',
              background: 'var(--color-accent)',
              color: '#1C1A17',
              textDecoration: 'none',
              fontSize: '0.9rem',
              fontWeight: '500',
            }}
          >
            View webinar details
          </Link>
        </main>
      </div>
    )
  }

  const isTool = webinar.kind === 'tool'
  const isPreWebinar = !isTool && (webinar.status === 'upcoming' || webinar.status === 'live')
  const isPostWebinar = !isTool && (webinar.status === 'complete' || webinar.status === 'archived')

  const recordings = content.filter((c) => c.type === 'recording')
  const downloads = content.filter((c) => c.type === 'download' || c.type === 'slide_deck')
  const bonusAndResources = content.filter(
    (c) => c.type === 'bonus' || c.type === 'resource' || c.type === 'link'
  )

  const date = webinar.scheduled_at
    ? new Date(webinar.scheduled_at).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : null

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <PortalNav user={user} onSignOut={signOut} />

      <main
        style={{
          maxWidth: isTool ? '1080px' : '760px',
          margin: '0 auto',
          padding: '5.5rem 2rem 4rem',
        }}
      >
        {/* Back link */}
        <Link
          to="/portal"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.375rem',
            fontSize: '0.8rem',
            color: 'var(--color-ink-muted)',
            textDecoration: 'none',
            marginBottom: '2rem',
          }}
        >
          <ArrowLeft size={14} /> Back to dashboard
        </Link>

        {/* Header */}
        <div style={{ marginBottom: '2.5rem' }}>
          <StatusBadge status={isTool ? 'tool' : webinar.status} />
          <h1
            style={{
              fontFamily: '"DM Serif Display", serif',
              fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
              lineHeight: '1.15',
              color: 'var(--color-ink)',
              margin: '1rem 0 0.5rem',
            }}
          >
            {webinar.title}
          </h1>
          {webinar.subtitle && (
            <p
              style={{
                fontSize: '1rem',
                lineHeight: '1.6',
                color: 'var(--color-ink-muted)',
                margin: 0,
              }}
            >
              {webinar.subtitle}
            </p>
          )}
          {!isTool && date && (
            <p
              style={{
                fontSize: '0.85rem',
                color: 'var(--color-ink-muted)',
                marginTop: '0.75rem',
              }}
            >
              {date}
              {webinar.duration_min ? ` \u00B7 ${webinar.duration_min} minutes` : ''}
            </p>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Tool body (replaces the standard webinar sections) */}
          {isTool && <ToolHost webinar={webinar} />}

          {/* Zoom info (pre-webinar only) */}
          {isPreWebinar && <ZoomInfo webinar={webinar} />}

          {/* Recordings (post-webinar) */}
          {isPostWebinar && recordings.length > 0 && (
            <section>
              <h2
                style={{
                  fontSize: '0.7rem',
                  fontWeight: '600',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color: 'var(--color-ink-muted)',
                  marginBottom: '1rem',
                }}
              >
                Recording
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {recordings.map((item) => (
                  <ContentItem key={item.id} item={item} />
                ))}
              </div>
            </section>
          )}

          {/* Webinar recording_url fallback (if no content items but url exists) */}
          {isPostWebinar && recordings.length === 0 && webinar.recording_url && (
            <section>
              <h2
                style={{
                  fontSize: '0.7rem',
                  fontWeight: '600',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color: 'var(--color-ink-muted)',
                  marginBottom: '1rem',
                }}
              >
                Recording
              </h2>
              <ContentItem
                item={{
                  id: 'main-recording',
                  type: 'recording',
                  title: 'Session Recording',
                  file_url: webinar.recording_url,
                }}
              />
            </section>
          )}

          {/* Downloads */}
          {!isTool && downloads.length > 0 && (
            <section>
              <h2
                style={{
                  fontSize: '0.7rem',
                  fontWeight: '600',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color: 'var(--color-ink-muted)',
                  marginBottom: '1rem',
                }}
              >
                Downloads
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                {downloads.map((item) => (
                  <ContentItem key={item.id} item={item} />
                ))}
              </div>
            </section>
          )}

          {/* Bonus content & resources */}
          {!isTool && bonusAndResources.length > 0 && (
            <section>
              <h2
                style={{
                  fontSize: '0.7rem',
                  fontWeight: '600',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color: 'var(--color-ink-muted)',
                  marginBottom: '1rem',
                }}
              >
                Resources
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                {bonusAndResources.map((item) => (
                  <ContentItem key={item.id} item={item} />
                ))}
              </div>
            </section>
          )}

          {/* Question form (pre-webinar) */}
          {isPreWebinar && <QuestionForm webinarId={webinar.id} userId={user.id} />}

          {/* Description */}
          {!isTool && webinar.description && (
            <section>
              <h2
                style={{
                  fontSize: '0.7rem',
                  fontWeight: '600',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color: 'var(--color-ink-muted)',
                  marginBottom: '1rem',
                }}
              >
                About This Session
              </h2>
              <p
                style={{
                  fontSize: '0.95rem',
                  lineHeight: '1.75',
                  color: 'var(--color-ink-muted)',
                  margin: 0,
                  whiteSpace: 'pre-line',
                }}
              >
                {webinar.description}
              </p>
            </section>
          )}
        </div>
      </main>
    </div>
  )
}
