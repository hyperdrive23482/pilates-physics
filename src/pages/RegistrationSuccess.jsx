import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { ArrowRight, CheckCircle2, Mail } from 'lucide-react'

const POLL_INTERVAL_MS = 2000
const POLL_TIMEOUT_MS = 30_000

export default function RegistrationSuccess() {
  const { slug } = useParams()
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const [state, setState] = useState({ phase: 'polling', data: null })

  useEffect(() => {
    if (!sessionId) {
      setState({ phase: 'error', data: null })
      return
    }

    let cancelled = false
    const startedAt = Date.now()

    async function poll() {
      while (!cancelled) {
        try {
          const res = await fetch(`/api/checkout/verify-session?session_id=${encodeURIComponent(sessionId)}`)
          if (res.ok) {
            const data = await res.json()
            if (data.entitlement_granted) {
              if (!cancelled) setState({ phase: 'ready', data })
              return
            }
          }
        } catch {
          // swallow transient errors; poll loop continues
        }

        if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
          if (!cancelled) setState({ phase: 'timeout', data: null })
          return
        }
        await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS))
      }
    }

    poll()
    return () => {
      cancelled = true
    }
  }, [sessionId])

  return (
    <div
      style={{
        minHeight: '70vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '4rem 2rem',
      }}
    >
      <div
        style={{
          maxWidth: '520px',
          width: '100%',
          background: 'var(--color-surface)',
          padding: '3rem 2.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
          alignItems: 'flex-start',
        }}
      >
        {state.phase === 'polling' && (
          <>
            <h1
              style={{
                fontFamily: '"DM Serif Display", serif',
                fontSize: '1.75rem',
                color: 'var(--color-ink)',
                margin: 0,
              }}
            >
              Confirming your registration…
            </h1>
            <p style={{ fontSize: '0.95rem', lineHeight: 1.7, color: 'var(--color-ink-muted)', margin: 0 }}>
              Payment received. We're setting up your access — this usually takes a few seconds.
            </p>
          </>
        )}

        {state.phase === 'ready' && state.data?.is_new_user && (
          <>
            <Mail size={28} style={{ color: 'var(--color-accent)' }} />
            <h1
              style={{
                fontFamily: '"DM Serif Display", serif',
                fontSize: '1.75rem',
                color: 'var(--color-ink)',
                margin: 0,
              }}
            >
              Check your email
            </h1>
            <p style={{ fontSize: '0.95rem', lineHeight: 1.7, color: 'var(--color-ink-muted)', margin: 0 }}>
              We've emailed a magic link to <strong style={{ color: 'var(--color-ink)' }}>{state.data.email}</strong>.
              Click it to set your password and access your portal.
            </p>
          </>
        )}

        {state.phase === 'ready' && state.data?.is_returning_user && (
          <>
            <Mail size={28} style={{ color: 'var(--color-accent)' }} />
            <h1
              style={{
                fontFamily: '"DM Serif Display", serif',
                fontSize: '1.75rem',
                color: 'var(--color-ink)',
                margin: 0,
              }}
            >
              You're registered
            </h1>
            <p style={{ fontSize: '0.95rem', lineHeight: 1.7, color: 'var(--color-ink-muted)', margin: 0 }}>
              Looks like you already have an account. We've emailed a sign-in link to{' '}
              <strong style={{ color: 'var(--color-ink)' }}>{state.data.email}</strong> — click it to access your portal.
            </p>
          </>
        )}

        {state.phase === 'ready' && !state.data?.is_new_user && !state.data?.is_returning_user && (
          <>
            <CheckCircle2 size={28} style={{ color: 'var(--color-accent)' }} />
            <h1
              style={{
                fontFamily: '"DM Serif Display", serif',
                fontSize: '1.75rem',
                color: 'var(--color-ink)',
                margin: 0,
              }}
            >
              You're registered
            </h1>
            <p style={{ fontSize: '0.95rem', lineHeight: 1.7, color: 'var(--color-ink-muted)', margin: 0 }}>
              Your access is all set up. Head to your portal to get the Zoom link and materials.
            </p>
            <Link
              to={`/portal/${state.data?.slug || slug}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                fontSize: '0.9rem',
                fontWeight: 500,
                background: 'var(--color-accent)',
                color: '#1C1A17',
                textDecoration: 'none',
              }}
            >
              Go to your portal <ArrowRight size={16} />
            </Link>
          </>
        )}

        {state.phase === 'timeout' && (
          <>
            <h1
              style={{
                fontFamily: '"DM Serif Display", serif',
                fontSize: '1.75rem',
                color: 'var(--color-ink)',
                margin: 0,
              }}
            >
              Payment confirmed
            </h1>
            <p style={{ fontSize: '0.95rem', lineHeight: 1.7, color: 'var(--color-ink-muted)', margin: 0 }}>
              Your access is still being provisioned. Check your email in a few minutes, or contact
              support if you don't see anything.
            </p>
          </>
        )}

        {state.phase === 'error' && (
          <>
            <h1
              style={{
                fontFamily: '"DM Serif Display", serif',
                fontSize: '1.75rem',
                color: 'var(--color-ink)',
                margin: 0,
              }}
            >
              Missing session
            </h1>
            <p style={{ fontSize: '0.95rem', lineHeight: 1.7, color: 'var(--color-ink-muted)', margin: 0 }}>
              We couldn't find a checkout session on this page. If you just completed a payment,
              check your email for a confirmation.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
