import { useParams, Link } from 'react-router-dom'
import { useWebinar } from '../hooks/useWebinars'
import WaitlistForm from '../components/ui/WaitlistForm'
import StatusBadge from '../components/portal/StatusBadge'
import { Calendar, Clock, DollarSign, Video, FileText, Download, ArrowRight } from 'lucide-react'

function Section({ children, style = {} }) {
  return (
    <section style={{ maxWidth: '1100px', margin: '0 auto', padding: '6rem 2rem', ...style }}>
      {children}
    </section>
  )
}

function Rule() {
  return <hr style={{ border: 'none', borderTop: '1px solid var(--color-rule)', margin: 0 }} />
}

export default function WebinarSalesPage() {
  const { slug } = useParams()
  const { webinar, loading } = useWebinar(slug)

  if (loading) {
    return (
      <div
        style={{
          padding: '10rem 2rem',
          textAlign: 'center',
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
      <div style={{ padding: '10rem 2rem', textAlign: 'center' }}>
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
        <Link
          to="/courses"
          style={{ color: 'var(--color-accent)', textDecoration: 'none', fontSize: '0.9rem' }}
        >
          Browse all webinars
        </Link>
      </div>
    )
  }

  const date = webinar.scheduled_at
    ? new Date(webinar.scheduled_at).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : null

  const time = webinar.scheduled_at
    ? new Date(webinar.scheduled_at).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        timeZoneName: 'short',
      })
    : null

  const price = webinar.price_cents
    ? `$${(webinar.price_cents / 100).toFixed(0)}`
    : 'Free'

  return (
    <div>
      {/* Hero */}
      <section
        style={{
          backgroundImage: webinar.hero_image_url
            ? `url(${webinar.hero_image_url})`
            : 'url(/images/homepage/webinar-hero-image.JPG)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.55)',
          }}
        />
        <div
          style={{
            maxWidth: '1100px',
            margin: '0 auto',
            padding: '7rem 2rem 5rem',
            position: 'relative',
          }}
        >
          <div style={{ maxWidth: '680px' }}>
            <div style={{ marginBottom: '1.25rem' }}>
              <StatusBadge status={webinar.status} />
            </div>
            <h1
              style={{
                fontFamily: '"DM Serif Display", serif',
                fontSize: 'clamp(2rem, 4vw, 3rem)',
                lineHeight: '1.15',
                color: '#fff',
                margin: '0 0 1.5rem',
              }}
            >
              {webinar.title}
            </h1>
            {webinar.subtitle && (
              <p
                style={{
                  fontSize: '1.1rem',
                  lineHeight: '1.65',
                  color: 'rgba(255, 255, 255, 0.85)',
                  margin: '0 0 2rem',
                }}
              >
                {webinar.subtitle}
              </p>
            )}

            <WaitlistForm compact />

            <p
              style={{
                fontSize: '0.78rem',
                color: 'rgba(255, 255, 255, 0.7)',
                marginTop: '1rem',
              }}
            >
              Registration opens soon. Join the waitlist to be first to know. No spam.
            </p>
          </div>
        </div>
      </section>

      <Rule />

      {/* Details & Register */}
      <Section>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '4rem',
            alignItems: 'start',
          }}
          className="sales-details-grid"
        >
          {/* Left: details */}
          <div>
            <h2
              style={{
                fontFamily: '"DM Serif Display", serif',
                fontSize: 'clamp(1.5rem, 3vw, 2.25rem)',
                lineHeight: '1.2',
                color: 'var(--color-ink)',
                margin: '0 0 2rem',
              }}
            >
              Details
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {[
                { label: 'Date', value: date || 'TBD', icon: Calendar },
                { label: 'Time', value: time || 'TBD', icon: Clock },
                { label: 'Duration', value: webinar.duration_min ? `${webinar.duration_min} minutes` : 'TBD', icon: Clock },
                { label: 'Format', value: 'Live via Zoom, recording included', icon: Video },
                { label: 'Price', value: price, icon: DollarSign },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.25rem',
                    paddingBottom: '1.25rem',
                    borderBottom: '1px solid var(--color-rule)',
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: '600',
                      letterSpacing: '0.15em',
                      textTransform: 'uppercase',
                      color: 'var(--color-accent)',
                    }}
                  >
                    {item.label}
                  </span>
                  <span style={{ fontSize: '1rem', color: 'var(--color-ink)' }}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: register card */}
          <div
            style={{
              background: 'var(--color-surface)',
              padding: '2.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem',
            }}
          >
            <h3
              style={{
                fontFamily: '"DM Serif Display", serif',
                fontSize: '1.3rem',
                color: 'var(--color-ink)',
                margin: 0,
              }}
            >
              Registration opens soon
            </h3>
            <p
              style={{
                fontSize: '0.95rem',
                lineHeight: '1.7',
                color: 'var(--color-ink-muted)',
                margin: 0,
              }}
            >
              Join the waitlist and we'll notify you as soon as registration opens.
            </p>
            <WaitlistForm />
            <p
              style={{
                fontSize: '0.78rem',
                color: 'var(--color-ink-muted)',
                margin: 0,
              }}
            >
              No spam. Unsubscribe anytime.
            </p>
          </div>
        </div>
      </Section>

      <Rule />

      {/* What's included */}
      <section style={{ background: 'var(--color-surface)' }}>
        <Section>
          <h2
            style={{
              fontFamily: '"DM Serif Display", serif',
              fontSize: 'clamp(1.5rem, 3vw, 2.25rem)',
              lineHeight: '1.2',
              color: 'var(--color-ink)',
              margin: '0 0 3rem',
            }}
          >
            What's included
          </h2>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '1.5rem',
            }}
            className="sales-included-grid"
          >
            {[
              {
                icon: Video,
                label: 'Live Session',
                desc: 'Real-time instruction with live Q&A. Ask questions, get answers, go deeper on the topics that matter to your practice.',
              },
              {
                icon: FileText,
                label: 'Full Recording',
                desc: "Can't attend live? The full recording is shared within 24 hours and available in your portal.",
              },
              {
                icon: Download,
                label: 'Downloadable Resources',
                desc: 'Reference materials and resources you can use in the studio, available before and after the session.',
              },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  padding: '2rem',
                  background: 'var(--color-surface-raised)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                }}
              >
                <item.icon size={24} style={{ color: 'var(--color-accent)' }} />
                <h3
                  style={{
                    fontFamily: '"DM Serif Display", serif',
                    fontSize: '1.1rem',
                    color: 'var(--color-ink)',
                    margin: 0,
                  }}
                >
                  {item.label}
                </h3>
                <p
                  style={{
                    fontSize: '0.95rem',
                    lineHeight: '1.7',
                    color: 'var(--color-ink-muted)',
                    margin: 0,
                  }}
                >
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </Section>
      </section>

      <Rule />

      {/* Description */}
      {webinar.description && (
        <>
          <Section>
            <div style={{ maxWidth: '720px' }}>
              <h2
                style={{
                  fontFamily: '"DM Serif Display", serif',
                  fontSize: 'clamp(1.5rem, 3vw, 2.25rem)',
                  lineHeight: '1.2',
                  color: 'var(--color-ink)',
                  margin: '0 0 2rem',
                }}
              >
                About this session
              </h2>
              <p
                style={{
                  fontSize: '1rem',
                  lineHeight: '1.8',
                  color: 'var(--color-ink-muted)',
                  whiteSpace: 'pre-line',
                  margin: 0,
                }}
              >
                {webinar.description}
              </p>
            </div>
          </Section>
          <Rule />
        </>
      )}

      {/* Already registered? */}
      <section style={{ background: 'var(--color-surface)' }}>
        <div
          style={{
            maxWidth: '680px',
            margin: '0 auto',
            padding: '4rem 2rem',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <p style={{ fontSize: '0.95rem', color: 'var(--color-ink-muted)', margin: 0 }}>
            Already registered?
          </p>
          <Link
            to="/login"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
              fontSize: '0.9rem',
              fontWeight: '500',
              color: 'var(--color-accent)',
              textDecoration: 'none',
            }}
          >
            Log in to your portal <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      <style>{`
        @media (max-width: 900px) {
          .sales-details-grid {
            grid-template-columns: 1fr !important;
            gap: 2.5rem !important;
          }
          .sales-included-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}
