import { Link } from 'react-router-dom'
import { useWebinars } from '../hooks/useWebinars'
import WaitlistForm from '../components/ui/WaitlistForm'
import StatusBadge from '../components/portal/StatusBadge'
import { Calendar, Clock, ArrowRight } from 'lucide-react'

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

function CatalogCard({ webinar }) {
  const date = webinar.scheduled_at
    ? new Date(webinar.scheduled_at).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : null

  const price = webinar.price_cents
    ? `$${(webinar.price_cents / 100).toFixed(0)}`
    : 'Free'

  return (
    <Link
      to={`/workshops/${webinar.slug}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        padding: '2rem',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-rule)',
        textDecoration: 'none',
        transition: 'border-color 0.2s',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--color-accent)')}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--color-rule)')}
    >
      {webinar.hero_image_url && (
        <img
          src={webinar.hero_image_url}
          alt={webinar.title}
          style={{ width: '100%', aspectRatio: '16 / 9', objectFit: 'cover' }}
        />
      )}

      <StatusBadge status={webinar.status} />

      <h3
        style={{
          fontFamily: '"DM Serif Display", serif',
          fontSize: '1.25rem',
          lineHeight: '1.3',
          color: 'var(--color-ink)',
          margin: 0,
        }}
      >
        {webinar.title}
      </h3>

      {webinar.subtitle && (
        <p style={{ fontSize: '0.9rem', lineHeight: '1.6', color: 'var(--color-ink-muted)', margin: 0 }}>
          {webinar.subtitle}
        </p>
      )}

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1.25rem',
          fontSize: '0.8rem',
          color: 'var(--color-ink-muted)',
          flexWrap: 'wrap',
        }}
      >
        {date && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <Calendar size={13} /> {date}
          </span>
        )}
        {webinar.duration_min && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <Clock size={13} /> {webinar.duration_min} min
          </span>
        )}
        <span style={{ fontWeight: '600', color: 'var(--color-ink)' }}>{price}</span>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.375rem',
          fontSize: '0.85rem',
          fontWeight: '500',
          color: 'var(--color-accent)',
          marginTop: 'auto',
        }}
      >
        Learn more <ArrowRight size={14} />
      </div>
    </Link>
  )
}

export default function WebinarCatalog() {
  const { webinars, loading } = useWebinars()

  const published = webinars.filter((w) => w.status !== 'draft')
  const upcoming = published.filter((w) => w.status === 'upcoming' || w.status === 'live')
  const past = published.filter((w) => w.status === 'complete' || w.status === 'archived')

  return (
    <div>
      {/* Hero */}
      <section
        style={{
          borderBottom: '1px solid var(--color-rule)',
          background: 'var(--color-surface)',
        }}
      >
        <div
          style={{
            maxWidth: '1100px',
            margin: '0 auto',
            padding: '7rem 2rem 5rem',
          }}
        >
          <div style={{ maxWidth: '640px' }}>
            <p
              style={{
                fontSize: '0.7rem',
                fontWeight: '600',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: 'var(--color-accent)',
                marginBottom: '1.25rem',
              }}
            >
              Webinars
            </p>
            <h1
              style={{
                fontFamily: '"DM Serif Display", serif',
                fontSize: 'clamp(2rem, 4vw, 3rem)',
                lineHeight: '1.15',
                color: 'var(--color-ink)',
                margin: '0 0 1.5rem',
              }}
            >
              Live sessions for working instructors
            </h1>
            <p
              style={{
                fontSize: '1.05rem',
                lineHeight: '1.65',
                color: 'var(--color-ink-muted)',
                margin: 0,
              }}
            >
              Interactive webinars that give you a mechanical understanding of the equipment
              you teach on every day. Each session includes live Q&A, a full recording, and
              downloadable resources.
            </p>
          </div>
        </div>
      </section>

      <Rule />

      {/* Webinar listings */}
      <Section>
        {loading ? (
          <p style={{ color: 'var(--color-ink-muted)', fontSize: '0.9rem' }}>
            Loading webinars...
          </p>
        ) : published.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '3rem 0',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1.5rem',
            }}
          >
            <h2
              style={{
                fontFamily: '"DM Serif Display", serif',
                fontSize: '1.5rem',
                color: 'var(--color-ink)',
                margin: 0,
              }}
            >
              New sessions coming soon
            </h2>
            <p
              style={{
                fontSize: '0.95rem',
                color: 'var(--color-ink-muted)',
                maxWidth: '480px',
                lineHeight: '1.6',
                margin: 0,
              }}
            >
              Join the waitlist to be the first to know when registration opens.
            </p>
            <WaitlistForm compact />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
            {upcoming.length > 0 && (
              <div>
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
                  Upcoming Sessions
                </h2>
                <div className="catalog-grid">
                  {upcoming.map((w) => (
                    <CatalogCard key={w.id} webinar={w} />
                  ))}
                </div>
              </div>
            )}

            {past.length > 0 && (
              <div>
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
                <div className="catalog-grid">
                  {past.map((w) => (
                    <CatalogCard key={w.id} webinar={w} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Section>

      <Rule />

      {/* CTA */}
      <section style={{ background: 'var(--color-accent-light)' }}>
        <div
          style={{
            maxWidth: '680px',
            margin: '0 auto',
            padding: '5rem 2rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
            alignItems: 'flex-start',
          }}
        >
          <h2
            style={{
              fontFamily: '"DM Serif Display", serif',
              fontSize: 'clamp(1.5rem, 3vw, 2.25rem)',
              lineHeight: '1.2',
              color: 'var(--color-ink)',
              margin: 0,
            }}
          >
            Don't see what you're looking for?
          </h2>
          <p
            style={{
              fontSize: '0.95rem',
              lineHeight: '1.65',
              color: 'var(--color-ink-muted)',
              margin: 0,
            }}
          >
            Join the waitlist and you'll be the first to hear about new sessions.
          </p>
          <WaitlistForm compact style={{ width: '100%' }} />
        </div>
      </section>

      <style>{`
        .catalog-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
        }
        @media (max-width: 700px) {
          .catalog-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}
