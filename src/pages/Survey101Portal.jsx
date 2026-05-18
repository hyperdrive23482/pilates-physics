import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useEnrollment } from '../hooks/useEnrollment'
import { supabase } from '../lib/supabase'
import PortalNav from '../components/portal/PortalNav'
import WorkshopFeedbackForm from '../components/survey/WorkshopFeedbackForm'

const WORKSHOP_TITLE = 'Pilates Physics 101'
const WORKSHOP_DATE = '2026-05-20'
// Workshop runs 11am–1pm PDT on May 20 — survey opens when it wraps.
const SURVEY_OPENS = new Date('2026-05-20T13:00:00-07:00')
const SURVEY_CUTOFF = new Date('2026-06-01T00:00:00')

const accentLinkStyle = { color: 'var(--color-accent)' }

function PortalShell({ user, onSignOut, children }) {
  return (
    <div style={{ minHeight: '100vh' }}>
      <PortalNav user={user} onSignOut={onSignOut} />
      <main className="pp-main" style={{ maxWidth: '720px', margin: '0 auto' }}>
        {children}
      </main>
    </div>
  )
}

function PortalLoading() {
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

function Eyebrow() {
  return (
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
      Workshop Feedback
    </p>
  )
}

function PageTitle({ children }) {
  return (
    <h1
      style={{
        fontFamily: 'var(--font-serif)',
        fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
        lineHeight: '1.15',
        color: 'var(--color-ink)',
        margin: '0 0 1.5rem',
      }}
    >
      {children}
    </h1>
  )
}

function MutedParagraph({ children, style = {} }) {
  return (
    <p
      style={{
        fontSize: '1.05rem',
        lineHeight: '1.7',
        color: 'var(--color-ink-muted)',
        margin: 0,
        ...style,
      }}
    >
      {children}
    </p>
  )
}

export default function Survey101Portal() {
  const { user, loading: authLoading, signOut } = useEnrollment()
  const navigate = useNavigate()

  const [submitted, setSubmitted] = useState(false)
  const [submissionCheckLoading, setSubmissionCheckLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login', { replace: true })
    }
  }, [authLoading, user, navigate])

  useEffect(() => {
    if (!user?.id) return
    let cancelled = false
    supabase
      .from('workshop_feedback')
      .select('id')
      .eq('user_id', user.id)
      .eq('workshop_title', WORKSHOP_TITLE)
      .eq('workshop_date', WORKSHOP_DATE)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return
        if (data) setSubmitted(true)
        setSubmissionCheckLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [user?.id])

  if (authLoading || !user) {
    return <PortalLoading />
  }

  const now = new Date()
  const isClosed = now >= SURVEY_CUTOFF
  const notYetOpen = now < SURVEY_OPENS

  if (isClosed) {
    return (
      <PortalShell user={user} onSignOut={signOut}>
        <Eyebrow />
        <PageTitle>{WORKSHOP_TITLE} survey</PageTitle>
        <MutedParagraph>
          The survey period is closed. Thanks for being part of the workshop — see the{' '}
          <Link to="/education" style={accentLinkStyle}>
            education
          </Link>{' '}
          page for upcoming sessions.
        </MutedParagraph>
      </PortalShell>
    )
  }

  if (notYetOpen) {
    return (
      <PortalShell user={user} onSignOut={signOut}>
        <Eyebrow />
        <PageTitle>{WORKSHOP_TITLE} survey</PageTitle>
        <MutedParagraph>
          The survey opens after the workshop wraps on May 20. Check back then — your feedback shapes the next one.
        </MutedParagraph>
      </PortalShell>
    )
  }

  if (submissionCheckLoading) {
    return (
      <PortalShell user={user} onSignOut={signOut}>
        <MutedParagraph>Loading your survey…</MutedParagraph>
      </PortalShell>
    )
  }

  if (submitted) {
    return (
      <PortalShell user={user} onSignOut={signOut}>
        <Eyebrow />
        <PageTitle>Thanks — feedback received.</PageTitle>
        <MutedParagraph style={{ marginBottom: '1rem' }}>
          That's incredibly helpful. Watch the{' '}
          <Link to="/education" style={accentLinkStyle}>
            education
          </Link>{' '}
          page for the next workshop.
        </MutedParagraph>
        <Link
          to="/portal"
          style={{
            display: 'inline-block',
            marginTop: '1.5rem',
            fontSize: '0.9rem',
            color: 'var(--color-accent)',
            textDecoration: 'none',
            fontWeight: '500',
          }}
        >
          ← Back to your portal
        </Link>
      </PortalShell>
    )
  }

  async function handleSubmit(payload) {
    const { data: sessionData } = await supabase.auth.getSession()
    const token = sessionData?.session?.access_token
    if (!token) throw new Error('Your session has expired. Please log in again.')

    const res = await fetch('/api/survey-feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    })
    const data = await res.json().catch(() => ({}))
    if (res.status === 409) {
      setSubmitted(true)
      return
    }
    if (!res.ok) throw new Error(data.error || 'Something went wrong. Try again.')
  }

  return (
    <PortalShell user={user} onSignOut={signOut}>
      <Eyebrow />
      <PageTitle>{WORKSHOP_TITLE} Feedback</PageTitle>
      <MutedParagraph style={{ marginBottom: '3rem' }}>
        Hey there! I have a quick favor to ask.  Would you fill this out to help me make{' '}
        {WORKSHOP_TITLE} even better next time? Takes about 5 minutes. Honest feedback is the most
        useful kind, even if it stings a little. Thank you!
      </MutedParagraph>

      <WorkshopFeedbackForm
        showNameEmail={false}
        onSubmit={handleSubmit}
        onSuccess={() => setSubmitted(true)}
      />
    </PortalShell>
  )
}
