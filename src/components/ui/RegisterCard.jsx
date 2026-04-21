import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useEnrollment } from '../../hooks/useEnrollment'
import { supabase } from '../../lib/supabase'
import WaitlistForm from './WaitlistForm'

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

export default function RegisterCard({ webinar }) {
  const { user, signOut } = useEnrollment()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const price = webinar.price_cents
    ? `$${(webinar.price_cents / 100).toFixed(0)}`
    : 'Free'

  const registrationOpen =
    webinar.stripe_price_id && ['upcoming', 'live'].includes(webinar.status)

  if (!registrationOpen) {
    return (
      <>
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
        <p style={{ fontSize: '0.78rem', color: 'var(--color-ink-muted)', margin: 0 }}>
          No spam. Unsubscribe anytime.
        </p>
      </>
    )
  }

  async function handleSubmit(e) {
    e?.preventDefault()
    setStatus('loading')
    setErrorMsg('')

    try {
      const headers = { 'Content-Type': 'application/json' }
      if (user) {
        const { data } = await supabase.auth.getSession()
        const token = data.session?.access_token
        if (token) headers.Authorization = `Bearer ${token}`
      }

      const body = user
        ? { slug: webinar.slug }
        : { slug: webinar.slug, email, firstName, lastName }

      const res = await fetch('/api/checkout/create-session', {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      })

      if (res.status === 409) {
        const data = await res.json()
        setStatus('already_enrolled')
        setErrorMsg(data.portalUrl || `/portal/${webinar.slug}`)
        return
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `Request failed (${res.status})`)
      }

      const { url } = await res.json()
      window.location.href = url
    } catch (err) {
      setErrorMsg(err.message || 'Something went wrong. Try again.')
      setStatus('error')
    }
  }

  if (status === 'already_enrolled') {
    return (
      <>
        <h3
          style={{
            fontFamily: '"DM Serif Display", serif',
            fontSize: '1.3rem',
            color: 'var(--color-ink)',
            margin: 0,
          }}
        >
          You're already registered
        </h3>
        <p style={{ fontSize: '0.95rem', lineHeight: '1.7', color: 'var(--color-ink-muted)', margin: 0 }}>
          Head to your portal to access this webinar.
        </p>
        <Link
          to={errorMsg}
          style={{
            display: 'inline-block',
            padding: '0.75rem 1.5rem',
            fontSize: '0.9rem',
            fontWeight: '500',
            background: 'var(--color-accent)',
            color: '#1C1A17',
            textDecoration: 'none',
            textAlign: 'center',
          }}
        >
          Go to your portal →
        </Link>
      </>
    )
  }

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
        <span
          style={{
            fontFamily: '"DM Serif Display", serif',
            fontSize: '2.25rem',
            color: 'var(--color-ink)',
            lineHeight: 1,
          }}
        >
          {price}
        </span>
        <span style={{ fontSize: '0.85rem', color: 'var(--color-ink-muted)' }}>
          one-time
        </span>
      </div>

      {user ? (
        <>
          <p style={{ fontSize: '0.9rem', color: 'var(--color-ink-muted)', margin: 0 }}>
            Registering as <strong style={{ color: 'var(--color-ink)' }}>{user.email}</strong>
            {' · '}
            <button
              type="button"
              onClick={signOut}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                color: 'var(--color-accent)',
                textDecoration: 'underline',
                cursor: 'pointer',
                font: 'inherit',
              }}
            >
              Not you? Log out
            </button>
          </p>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={status === 'loading'}
            style={{
              width: '100%',
              padding: '0.875rem 1.5rem',
              fontSize: '0.95rem',
              fontWeight: '500',
              fontFamily: '"DM Sans", sans-serif',
              background: 'var(--color-accent)',
              color: '#1C1A17',
              border: 'none',
              cursor: status === 'loading' ? 'wait' : 'pointer',
            }}
          >
            {status === 'loading' ? 'Redirecting to Stripe…' : `Register — ${price}`}
          </button>
        </>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>First name</label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                disabled={status === 'loading'}
                style={inputStyle}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Last name</label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                disabled={status === 'loading'}
                style={inputStyle}
              />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={status === 'loading'}
              style={inputStyle}
            />
            <p style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)', margin: '0.5rem 0 0' }}>
              Use this email for your account — please use the same email during payment.
            </p>
          </div>
          <button
            type="submit"
            disabled={status === 'loading'}
            style={{
              width: '100%',
              padding: '0.875rem 1.5rem',
              fontSize: '0.95rem',
              fontWeight: '500',
              fontFamily: '"DM Sans", sans-serif',
              background: 'var(--color-accent)',
              color: '#1C1A17',
              border: 'none',
              cursor: status === 'loading' ? 'wait' : 'pointer',
            }}
          >
            {status === 'loading' ? 'Redirecting to Stripe…' : `Register — ${price}`}
          </button>
        </form>
      )}

      {status === 'error' && (
        <p style={{ fontSize: '0.8rem', color: '#e06c75', margin: 0 }}>{errorMsg}</p>
      )}

      <p style={{ fontSize: '0.78rem', color: 'var(--color-ink-muted)', margin: 0 }}>
        Secure checkout via Stripe. Already registered?{' '}
        <Link to="/login" style={{ color: 'var(--color-accent)', textDecoration: 'underline' }}>
          Log in
        </Link>
        .
      </p>
    </>
  )
}
