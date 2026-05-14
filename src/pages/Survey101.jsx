import { useState } from 'react'
import { Link } from 'react-router-dom'
import WorkshopFeedbackForm from '../components/survey/WorkshopFeedbackForm'

const WORKSHOP_TITLE = 'Pilates Physics 101'
// Browser local time — survey closes at midnight on June 1, 2026 wherever the respondent is.
const SURVEY_CUTOFF = new Date('2026-06-01T00:00:00')

const accentLinkStyle = { color: 'var(--color-accent)' }

function Section({ children, style = {} }) {
  return (
    <section
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

function Hero({ eyebrow, title, intro }) {
  return (
    <section style={{ background: 'var(--color-bg)' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '7rem 2rem 5rem' }}>
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
            {eyebrow}
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
            {title}
          </h1>
          {intro && (
            <p
              style={{
                fontSize: '1.1rem',
                lineHeight: '1.65',
                color: 'var(--color-ink-muted)',
                margin: 0,
              }}
            >
              {intro}
            </p>
          )}
        </div>
      </div>
    </section>
  )
}

export default function Survey101() {
  const isClosed = new Date() >= SURVEY_CUTOFF

  if (isClosed) {
    return (
      <div>
        <Hero eyebrow="Workshop Feedback" title={`${WORKSHOP_TITLE} survey`} />
        <Rule />
        <Section style={{ maxWidth: '720px' }}>
          <p
            style={{
              fontSize: '1.1rem',
              lineHeight: '1.7',
              color: 'var(--color-ink-muted)',
              margin: 0,
            }}
          >
            The survey period is closed. Please see the{' '}
            <Link to="/education" style={accentLinkStyle}>
              education
            </Link>{' '}
            page for upcoming workshops.
          </p>
        </Section>
      </div>
    )
  }

  return <OpenSurvey />
}

function OpenSurvey() {
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit(payload) {
    const res = await fetch('/api/survey-feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || 'Something went wrong. Try again.')
  }

  if (submitted) {
    return (
      <div>
        <Hero eyebrow="Workshop Feedback" title="Thanks — feedback received." />
        <Rule />
        <Section style={{ maxWidth: '720px' }}>
          <p
            style={{
              fontSize: '1.1rem',
              lineHeight: '1.7',
              color: 'var(--color-ink-muted)',
              margin: 0,
            }}
          >
            That's incredibly helpful. Watch the{' '}
            <Link to="/education" style={accentLinkStyle}>
              education
            </Link>{' '}
            page for the next workshop.
          </p>
        </Section>
      </div>
    )
  }

  return (
    <div>
      <Hero
        eyebrow="Workshop Feedback"
        title={`${WORKSHOP_TITLE} Feedback`}
        intro="Hey there! I have a quick favor to ask.  Would you fill this out to help me make Pilates Physics 101 even better next time? Takes about 5 minutes. Honest feedback is the most useful kind, even if it stings a little. Thank you!"
      />

      <Rule />

      <section style={{ background: 'var(--color-surface)' }}>
        <Section style={{ maxWidth: '720px' }}>
          <WorkshopFeedbackForm
            showNameEmail
            onSubmit={handleSubmit}
            onSuccess={() => setSubmitted(true)}
          />
        </Section>
      </section>
    </div>
  )
}
