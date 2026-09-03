import { useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { track } from '../lib/track'
import { useEnrollment } from '../hooks/useEnrollment'
import { useWorkshop } from '../hooks/useWorkshops'
import { useEntitlements } from '../hooks/useEntitlements'
import { useWorkshopContent } from '../hooks/useWorkshopContent'
import PortalNav from '../components/portal/PortalNav'
import StatusBadge from '../components/portal/StatusBadge'
import ZoomInfo from '../components/portal/ZoomInfo'
import ContentItem from '../components/portal/ContentItem'
import QuestionForm from '../components/portal/QuestionForm'
import ToolHost from '../components/portal/ToolHost'
import CoursePlayer from '../components/portal/course/CoursePlayer'
import CertificateButton from '../components/portal/CertificateButton'

export default function WorkshopPortal() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { user, loading: authLoading, signOut } = useEnrollment()
  const { workshop, loading: workshopLoading } = useWorkshop(slug)
  const { hasAccess, loading: entLoading } = useEntitlements(user?.id)
  const { content } = useWorkshopContent(workshop?.id, workshop?.status)

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login', { replace: true })
    }
  }, [authLoading, user, navigate])

  // Record the visit once per workshop per mount. hasAccess is a fresh closure
  // every render and cannot go in a dep array, so guard on the id last sent.
  const viewLogged = useRef(null)
  useEffect(() => {
    if (entLoading || !workshop?.id) return
    if (viewLogged.current === workshop.id) return
    if (!hasAccess(workshop.id)) return
    viewLogged.current = workshop.id
    track('portal_view', { webinar_id: workshop.id })
  })

  // Check entitlement once loaded
  const allLoaded = !authLoading && !workshopLoading && !entLoading
  const canAccess = workshop && hasAccess(workshop.id)

  if (!allLoaded) {
    return (
      <div
        style={{
          minHeight: '100vh',
                    display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'var(--font-serif)',
          color: 'var(--color-ink-muted)',
          fontSize: '0.9rem',
        }}
      >
        Loading...
      </div>
    )
  }

  if (!workshop) {
    return (
      <div style={{ minHeight: '100vh' }}>
        <PortalNav user={user} onSignOut={signOut} />
        <main style={{ maxWidth: '680px', margin: '0 auto', padding: '6rem 2rem', textAlign: 'center' }}>
          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '1.5rem',
              color: 'var(--color-ink)',
              marginBottom: '1rem',
            }}
          >
            Workshop not found
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
      <div style={{ minHeight: '100vh' }}>
        <PortalNav user={user} onSignOut={signOut} />
        <main style={{ maxWidth: '680px', margin: '0 auto', padding: '6rem 2rem', textAlign: 'center' }}>
          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '1.5rem',
              color: 'var(--color-ink)',
              marginBottom: '1rem',
            }}
          >
            Access required
          </h1>
          <p style={{ color: 'var(--color-ink-muted)', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>
            You don't have access to this workshop. Register to get access.
          </p>
          <Link
            to={`/workshops/${slug}`}
            style={{
              display: 'inline-block',
              padding: '0.75rem 1.5rem',
              background: 'var(--color-accent)',
              color: 'var(--color-accent-ink)',
              textDecoration: 'none',
              fontSize: '0.9rem',
              fontWeight: '500',
            }}
          >
            View workshop details
          </Link>
        </main>
      </div>
    )
  }

  // A course is delivered here, in order, and owns its own layout: a module
  // list, a player, and the attachments belonging to whichever module is open.
  // It shares none of the workshop chrome, because there is no event behind it
  // to have a date, a Zoom room or a replay.
  const isCourse = workshop.kind === 'course'

  // Tools and resources both render through ToolHost (a React component keyed
  // by slug) and skip the workshop chrome (dates, recordings, downloads).
  const isInteractive = workshop.kind === 'tool' || workshop.kind === 'resource'
  const isPlainWorkshop = !isInteractive && !isCourse
  const isPreWorkshop =
    isPlainWorkshop && (workshop.status === 'upcoming' || workshop.status === 'live')
  const isPostWorkshop =
    isPlainWorkshop &&
    (workshop.status === 'awaiting_recording' ||
      workshop.status === 'complete' ||
      workshop.status === 'archived')
  const hasRecording =
    isPlainWorkshop && (workshop.status === 'complete' || workshop.status === 'archived')

  const recordings = content.filter((c) => c.type === 'recording')
  const downloads = content.filter((c) => c.type === 'download' || c.type === 'slide_deck')
  const bonusAndResources = content.filter(
    (c) => c.type === 'bonus' || c.type === 'resource' || c.type === 'link'
  )

  const date = workshop.scheduled_at
    ? new Date(workshop.scheduled_at).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : null

  return (
    <div style={{ minHeight: '100vh' }}>
      <PortalNav user={user} onSignOut={signOut} />

      <main
        className="pp-main"
        style={{
          maxWidth: isInteractive || isCourse ? '1080px' : '760px',
          margin: '0 auto',
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
          <StatusBadge status={isInteractive || isCourse ? workshop.kind : workshop.status} />
          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
              lineHeight: '1.15',
              color: 'var(--color-ink)',
              margin: '1rem 0 0.5rem',
            }}
          >
            {workshop.title}
          </h1>
          {workshop.subtitle && (
            <p
              style={{
                fontSize: '1rem',
                lineHeight: '1.6',
                color: 'var(--color-ink-muted)',
                margin: 0,
              }}
            >
              {workshop.subtitle}
            </p>
          )}
          {isPlainWorkshop && date && (
            <p
              style={{
                fontSize: '0.85rem',
                color: 'var(--color-ink-muted)',
                marginTop: '0.75rem',
              }}
            >
              {date}
              {workshop.duration_min ? ` \u00B7 ${workshop.duration_min} minutes` : ''}
            </p>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Tool body (replaces the standard workshop sections) */}
          {isInteractive && <ToolHost workshop={workshop} />}

          {/* Course body: module list, player, per-module attachments. */}
          {isCourse && <CoursePlayer workshop={workshop} userId={user?.id} />}

          {/* Zoom info (pre-workshop only) */}
          {isPreWorkshop && <ZoomInfo workshop={workshop} />}

          {/* Certificate of completion (post-workshop) */}
          {isPostWorkshop && (
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
                Certificate
              </h2>
              <CertificateButton workshop={workshop} user={user} />
            </section>
          )}

          {/* Recordings (post-workshop, only once a recording exists) */}
          {hasRecording && recordings.length > 0 && (
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
                  <ContentItem key={item.id} item={item} webinarId={workshop.id} />
                ))}
              </div>
            </section>
          )}

          {/* Workshop recording_url fallback (if no content items but url exists) */}
          {hasRecording && recordings.length === 0 && workshop.recording_url && (
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
                webinarId={workshop.id}
                item={{
                  id: 'main-recording',
                  type: 'recording',
                  title: 'Session Recording',
                  file_url: workshop.recording_url,
                }}
              />
            </section>
          )}

          {/* Awaiting-recording notice */}
          {workshop.status === 'awaiting_recording' && (
            <section
              style={{
                padding: '1.25rem 1.5rem',
                border: '1px solid var(--color-rule)',
                background: 'var(--color-surface)',
              }}
            >
              <h2
                style={{
                  fontSize: '0.7rem',
                  fontWeight: '600',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color: 'var(--color-ink-muted)',
                  marginBottom: '0.5rem',
                }}
              >
                Recording
              </h2>
              <p
                style={{
                  fontSize: '0.9rem',
                  lineHeight: '1.6',
                  color: 'var(--color-ink-muted)',
                  margin: 0,
                }}
              >
                The recording will be posted here once it's ready.
              </p>
            </section>
          )}

          {/* Downloads */}
          {isPlainWorkshop && downloads.length > 0 && (
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
                  <ContentItem key={item.id} item={item} webinarId={workshop.id} />
                ))}
              </div>
            </section>
          )}

          {/* Bonus content & resources */}
          {isPlainWorkshop && bonusAndResources.length > 0 && (
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
                  <ContentItem key={item.id} item={item} webinarId={workshop.id} />
                ))}
              </div>
            </section>
          )}

          {/* Question form (pre-workshop) */}
          {isPreWorkshop && <QuestionForm workshopId={workshop.id} userId={user.id} />}

          {/* Description */}
          {isPlainWorkshop && workshop.description && (
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
                {workshop.description}
              </p>
            </section>
          )}
        </div>
      </main>
    </div>
  )
}
