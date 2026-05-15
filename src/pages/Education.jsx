import { useState } from 'react'
import { Link } from 'react-router-dom'

const primaryButtonStyle = {
  display: 'inline-block',
  padding: '0.875rem 1.75rem',
  fontSize: '0.95rem',
  fontWeight: '500',
  fontFamily: '"DM Sans", sans-serif',
  background: 'var(--color-accent)',
  color: '#1C1A17',
  border: 'none',
  textDecoration: 'none',
  cursor: 'pointer',
}

const secondaryButtonStyle = {
  display: 'inline-block',
  padding: '0.75rem 1.5rem',
  fontSize: '0.9rem',
  fontWeight: '500',
  fontFamily: '"DM Sans", sans-serif',
  background: 'transparent',
  color: 'var(--color-accent)',
  border: '1px solid var(--color-accent)',
  textDecoration: 'none',
  cursor: 'pointer',
}

const labelStyle = {
  display: 'block',
  fontSize: '0.78rem',
  fontWeight: '500',
  color: 'var(--color-ink-muted)',
  marginBottom: '0.375rem',
}

const inputStyle = {
  width: '100%',
  padding: '0.75rem 1rem',
  fontSize: '0.9rem',
  fontFamily: '"DM Sans", sans-serif',
  border: '1px solid var(--color-rule)',
  background: 'var(--color-bg)',
  color: 'var(--color-ink)',
  outline: 'none',
  boxSizing: 'border-box',
}

function Section({ children, style = {}, className = '' }) {
  return (
    <section
      className={className}
      style={{
        maxWidth: '1100px',
        margin: '0 auto',
        padding: '6rem 2rem',
        ...style,
      }}
    >
      {children}
    </section>
  )
}

function Rule() {
  return (
    <hr style={{ border: 'none', borderTop: '1px solid var(--color-rule)', margin: 0 }} />
  )
}

const PATHS = [
  {
    eyebrow: '2-Hour Live Webinar',
    title: 'Pilates Physics 101',
    body: 'A focused 2-hour live session on the mechanics behind reformer springs and the equipment variables that change how a body is loaded. New to Pilates Physics? Start here.',
    meta: 'Next: May 20, 2026',
    ctaLabel: 'Learn more',
    to: '/pilates-physics-101',
  },
  {
    eyebrow: '3-Month Intensive',
    title: 'Pilates Physics 201',
    body: 'A small-cohort deep dive: free-body diagrams, chair and tower physics, and physics-based progression planning. Group lectures, homework, and monthly 1:1 calls. By application.',
    meta: 'Apply by July 19th.',
    ctaLabel: 'Learn more',
    to: '/pilates-physics-201',
  },
  {
    eyebrow: 'Private',
    title: '1:1 mentoring',
    body: 'One-off or ongoing private Ongoing private mentoring tailored to the questions you have right now — your clients, your studio, your equipment. Limited slots. $180 per session. Includes limited email support.',
    meta: 'By inquiry',
    ctaLabel: 'Inquire',
    href: '#inquiry',
  },
  {
    eyebrow: 'On-site at your studio',
    title: 'In-person workshops',
    body: 'Bring Pilates Physics to your studio or training program. Custom-built sessions from 1-6 hours either in-person or virtual.',
    meta: 'By inquiry',
    ctaLabel: 'Inquire',
    href: '#inquiry',
  },
]

export default function Education() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [interest, setInterest] = useState('')
  const [message, setMessage] = useState('')
  const [website, setWebsite] = useState('')
  const [status, setStatus] = useState('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')

    try {
      const res = await fetch('/api/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'inquiry', name, email, interest, message, website }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Something went wrong. Try again.')
      setStatus('success')
    } catch (err) {
      setErrorMsg(err.message || 'Something went wrong. Try again.')
      setStatus('error')
    }
  }

  return (
    <div>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section
        style={{
          backgroundImage: 'url(/images/homepage/hero-image-2.JPG)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(28, 26, 23, 0.7)',
          }}
        />
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            maxWidth: '1100px',
            margin: '0 auto',
            padding: '7rem 2rem 5rem',
          }}
        >
          <div style={{ maxWidth: '720px' }}>
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
              Education
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
              Four ways to learn the physics of Pilates
            </h1>
            <p
              style={{
                fontSize: '1.1rem',
                lineHeight: '1.65',
                color: 'var(--color-ink-muted)',
                margin: 0,
              }}
            >
              From a 2-hour intro to a 3-month intensive to private mentoring — pick
              the depth that fits where you are right now.
            </p>
          </div>
        </div>
      </section>

      <Rule />

      {/* ── The four paths ───────────────────────────────────────────────── */}
      <Section>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '1.5rem',
          }}
          className="paths-grid"
        >
          {PATHS.map((path) => (
            <div
              key={path.title}
              style={{
                padding: '2.25rem',
                background: 'var(--color-surface-raised)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
              }}
            >
              <p
                style={{
                  fontSize: '0.7rem',
                  fontWeight: '600',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color: 'var(--color-accent)',
                  margin: 0,
                }}
              >
                {path.eyebrow}
              </p>
              <h2
                style={{
                  fontFamily: '"DM Serif Display", serif',
                  fontSize: '1.5rem',
                  lineHeight: '1.2',
                  color: 'var(--color-ink)',
                  margin: 0,
                }}
              >
                {path.title}
              </h2>
              <p
                style={{
                  fontSize: '0.95rem',
                  lineHeight: '1.7',
                  color: 'var(--color-ink-muted)',
                  margin: 0,
                  flex: 1,
                }}
              >
                {path.body}
              </p>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  paddingTop: '0.5rem',
                  borderTop: '1px solid var(--color-rule)',
                  marginTop: '0.5rem',
                }}
              >
                <span
                  style={{
                    fontSize: '0.85rem',
                    color: 'var(--color-ink)',
                    fontWeight: '500',
                  }}
                >
                  {path.meta}
                </span>
                {path.to ? (
                  <Link to={path.to} style={secondaryButtonStyle}>
                    {path.ctaLabel} →
                  </Link>
                ) : (
                  <a href={path.href} style={secondaryButtonStyle}>
                    {path.ctaLabel} →
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Rule />

      {/* ── Inquiry form ─────────────────────────────────────────────────── */}
      <section style={{ background: 'var(--color-surface)' }}>
        <Section style={{ maxWidth: '720px' }}>
          <div id="inquiry" style={{ scrollMarginTop: '5rem' }}>
            <p
              style={{
                fontSize: '0.7rem',
                fontWeight: '600',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: 'var(--color-accent)',
                marginBottom: '1rem',
              }}
            >
              Inquire
            </p>
            <h2
              style={{
                fontFamily: '"DM Serif Display", serif',
                fontSize: 'clamp(1.5rem, 3vw, 2.25rem)',
                lineHeight: '1.2',
                color: 'var(--color-ink)',
                margin: '0 0 1rem',
              }}
            >
              Inquire about 1:1 mentoring or in-person workshops
            </h2>
            <p
              style={{
                fontSize: '1rem',
                lineHeight: '1.7',
                color: 'var(--color-ink-muted)',
                margin: '0 0 2.5rem',
              }}
            >
              Tell me a little about what you're looking for — your studio, your
              clients, your timeline — and I'll get back to you within a few days.
            </p>
          </div>

          {status === 'success' ? (
            <div>
              <p
                style={{
                  fontFamily: '"DM Serif Display", serif',
                  fontSize: '1.25rem',
                  color: 'var(--color-accent)',
                  marginBottom: '0.75rem',
                }}
              >
                Thanks — your inquiry is on its way.
              </p>
              <p style={{ fontSize: '0.9rem', color: 'var(--color-ink-muted)' }}>
                I'll reply within a few days. Check your inbox for a confirmation email.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={labelStyle}>Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={status === 'loading'}
                  maxLength={200}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={status === 'loading'}
                  maxLength={320}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>I'm interested in</label>
                <select
                  required
                  value={interest}
                  onChange={(e) => setInterest(e.target.value)}
                  disabled={status === 'loading'}
                  style={inputStyle}
                >
                  <option value="">Select one…</option>
                  <option value="1:1 mentoring">1:1 mentoring</option>
                  <option value="In-person workshop">In-person workshop</option>
                  <option value="Both">Both</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>Tell me more</label>
                <textarea
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={status === 'loading'}
                  maxLength={2000}
                  rows={6}
                  placeholder="What are you looking for? Where are you located? Any timeline?"
                  style={{ ...inputStyle, resize: 'vertical', fontFamily: '"DM Sans", sans-serif' }}
                />
              </div>

              <input
                type="text"
                name="website"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                style={{ display: 'none' }}
              />

              <button
                type="submit"
                disabled={status === 'loading'}
                style={{
                  ...primaryButtonStyle,
                  width: '100%',
                  cursor: status === 'loading' ? 'wait' : 'pointer',
                }}
              >
                {status === 'loading' ? 'Sending…' : 'Send inquiry'}
              </button>

              {status === 'error' && (
                <p style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#e06c75' }}>
                  {errorMsg}
                </p>
              )}
            </form>
          )}
        </Section>
      </section>

      <style>{`
        @media (max-width: 700px) {
          .paths-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}
