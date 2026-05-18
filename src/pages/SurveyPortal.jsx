import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useEnrollment } from '../hooks/useEnrollment'
import { useWorkshop } from '../hooks/useWorkshops'
import { supabase } from '../lib/supabase'
import PortalNav from '../components/portal/PortalNav'
import DynamicSurveyForm from '../components/survey/DynamicSurveyForm'

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

export default function SurveyPortal() {
  const { slug } = useParams()
  const { user, loading: authLoading, signOut } = useEnrollment()
  const { workshop, loading: workshopLoading } = useWorkshop(slug)
  const navigate = useNavigate()

  const [submitted, setSubmitted] = useState(false)
  const [submissionCheckLoading, setSubmissionCheckLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login', { replace: true })
    }
  }, [authLoading, user, navigate])

  useEffect(() => {
    if (!user?.id || !workshop?.id) return
    let cancelled = false
    supabase
      .from('workshop_feedback')
      .select('id')
      .eq('user_id', user.id)
      .eq('webinar_id', workshop.id)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return
        if (data) setSubmitted(true)
        setSubmissionCheckLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [user?.id, workshop?.id])

  if (authLoading || !user || workshopLoading) {
    return <PortalLoading />
  }

  if (!workshop) {
    return (
      <PortalShell user={user} onSignOut={signOut}>
        <Eyebrow />
        <PageTitle>Workshop not found</PageTitle>
        <MutedParagraph>
          That workshop doesn't exist. Head back to{' '}
          <Link to="/portal" style={accentLinkStyle}>your portal</Link>.
        </MutedParagraph>
      </PortalShell>
    )
  }

  const config = workshop.survey_config
  const enabled = !!config?.enabled
  const now = Date.now()
  const opensAt = config?.opens_at ? Date.parse(config.opens_at) : null
  const closesAt = config?.closes_at ? Date.parse(config.closes_at) : null
  const isClosed = !enabled || (closesAt != null && now >= closesAt)
  const notYetOpen = enabled && opensAt != null && now < opensAt

  if (isClosed) {
    return (
      <PortalShell user={user} onSignOut={signOut}>
        <Eyebrow />
        <PageTitle>{workshop.title} survey</PageTitle>
        <MutedParagraph>
          The survey period is closed. Thanks for being part of the workshop. See the{' '}
          <Link to="/education" style={accentLinkStyle}>education</Link> page for upcoming sessions.
        </MutedParagraph>
      </PortalShell>
    )
  }

  if (notYetOpen) {
    const opensDate = opensAt ? new Date(opensAt).toLocaleString() : 'soon'
    return (
      <PortalShell user={user} onSignOut={signOut}>
        <Eyebrow />
        <PageTitle>{workshop.title} survey</PageTitle>
        <MutedParagraph>
          The survey opens after the workshop wraps ({opensDate}). Check back then. Your feedback shapes the next one.
        </MutedParagraph>
      </PortalShell>
    )
  }

  if (submissionCheckLoading) {
    return (
      <PortalShell user={user} onSignOut={signOut}>
        <MutedParagraph>Loading your survey...</MutedParagraph>
      </PortalShell>
    )
  }

  if (submitted) {
    return (
      <PortalShell user={user} onSignOut={signOut}>
        <Eyebrow />
        <PageTitle>Thanks, feedback received.</PageTitle>
        <MutedParagraph style={{ marginBottom: '1rem' }}>
          That's incredibly helpful. Watch the{' '}
          <Link to="/education" style={accentLinkStyle}>education</Link> page for the next workshop.
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
          Back to your portal
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
      body: JSON.stringify({ ...payload, webinar_slug: slug }),
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
      <PageTitle>{workshop.title} Feedback</PageTitle>
      <MutedParagraph style={{ marginBottom: '3rem' }}>
        Hey there! I have a quick favor to ask. Would you fill this out to help me make{' '}
        {workshop.title} even better next time? Takes about 5 minutes. Honest feedback is the most
        useful kind, even if it stings a little. Thank you!
      </MutedParagraph>

      <DynamicSurveyForm
        surveyConfig={config}
        showNameEmail={false}
        onSubmit={handleSubmit}
        onSuccess={() => setSubmitted(true)}
      />
    </PortalShell>
  )
}
