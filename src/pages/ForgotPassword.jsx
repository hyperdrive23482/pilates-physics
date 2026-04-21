import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useEnrollment } from '../hooks/useEnrollment'

export default function ForgotPassword() {
  const { resetPasswordRequest } = useEnrollment()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle') // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')

    try {
      await resetPasswordRequest(email)
      setStatus('success')
    } catch (err) {
      setErrorMsg(err.message || 'Something went wrong. Try again.')
      setStatus('error')
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--color-bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
      }}
    >
      <div style={{ maxWidth: '420px', width: '100%' }}>
        <Link
          to="/"
          style={{
            display: 'inline-block',
            fontSize: '0.85rem',
            color: 'var(--color-ink-muted)',
            textDecoration: 'none',
            marginBottom: '2rem',
          }}
        >
          ← Back to home
        </Link>

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
          Password Reset
        </p>

        <h1
          style={{
            fontFamily: '"DM Serif Display", serif',
            fontSize: 'clamp(1.75rem, 4vw, 2.75rem)',
            lineHeight: '1.15',
            color: 'var(--color-ink)',
            margin: '0 0 1.25rem',
          }}
        >
          Reset your password
        </h1>

        <p
          style={{
            fontSize: '1rem',
            lineHeight: '1.75',
            color: 'var(--color-ink-muted)',
            margin: '0 0 2rem',
          }}
        >
          Enter your email and we'll send you a link to set a new password.
        </p>

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
              Check your inbox.
            </p>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-ink-muted)' }}>
              We sent a password reset link to <strong style={{ color: 'var(--color-ink)' }}>{email}</strong>.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <label
              style={{
                display: 'block',
                fontSize: '0.78rem',
                fontWeight: '500',
                color: 'var(--color-ink-muted)',
                marginBottom: '0.375rem',
              }}
            >
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={status === 'loading'}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                fontSize: '0.9rem',
                fontFamily: '"DM Sans", sans-serif',
                border: '1px solid var(--color-rule)',
                background: 'var(--color-surface)',
                color: 'var(--color-ink)',
                outline: 'none',
                marginBottom: '1.5rem',
                boxSizing: 'border-box',
              }}
            />

            <button
              type="submit"
              disabled={status === 'loading'}
              style={{
                width: '100%',
                padding: '0.75rem 1.5rem',
                fontSize: '0.9rem',
                fontWeight: '500',
                fontFamily: '"DM Sans", sans-serif',
                background: 'var(--color-accent)',
                color: '#1C1A17',
                border: 'none',
                cursor: status === 'loading' ? 'wait' : 'pointer',
              }}
            >
              {status === 'loading' ? 'Sending...' : 'Send Reset Link'}
            </button>

            {status === 'error' && (
              <p style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: '#e06c75' }}>
                {errorMsg}
              </p>
            )}
          </form>
        )}

        <p
          style={{
            marginTop: '1.5rem',
            fontSize: '0.85rem',
            color: 'var(--color-ink-muted)',
          }}
        >
          Remember your password?{' '}
          <Link
            to="/login"
            style={{ color: 'var(--color-accent)', textDecoration: 'underline' }}
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  )
}
