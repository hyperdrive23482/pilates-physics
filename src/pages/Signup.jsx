import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useEnrollment } from '../hooks/useEnrollment'

export default function Signup() {
  const { user, signUp } = useEnrollment()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState('idle') // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (user) navigate('/course', { replace: true })
  }, [user, navigate])

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')

    try {
      await signUp(email, password)
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
          Free Course — Pilates Physics
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
          Create your account
        </h1>

        <p
          style={{
            fontSize: '1rem',
            lineHeight: '1.75',
            color: 'var(--color-ink-muted)',
            margin: '0 0 2rem',
          }}
        >
          Sign up to access four modules on spring physics, force environments,
          and a transferable framework for reasoning about any exercise.
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
              Check your inbox to confirm your email.
            </p>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-ink-muted)' }}>
              Once confirmed, you can{' '}
              <Link
                to="/login"
                style={{ color: 'var(--color-accent)', textDecoration: 'underline' }}
              >
                log in
              </Link>{' '}
              and start the course.
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
                marginBottom: '1rem',
                boxSizing: 'border-box',
              }}
            />

            <label
              style={{
                display: 'block',
                fontSize: '0.78rem',
                fontWeight: '500',
                color: 'var(--color-ink-muted)',
                marginBottom: '0.375rem',
              }}
            >
              Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
              {status === 'loading' ? 'Creating account...' : 'Create Account'}
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
          Already have an account?{' '}
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
