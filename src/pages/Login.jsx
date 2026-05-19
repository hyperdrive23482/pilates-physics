import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { useEnrollment } from '../hooks/useEnrollment'

export default function Login() {
  const { user, signIn, resetPasswordRequest } = useEnrollment()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [status, setStatus] = useState('idle') // idle | loading | error
  const [errorMsg, setErrorMsg] = useState('')
  const [resendStatus, setResendStatus] = useState('idle') // idle | loading | success | error
  const [resendErrorMsg, setResendErrorMsg] = useState('')

  useEffect(() => {
    if (user) navigate('/course', { replace: true })
  }, [user, navigate])

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')

    try {
      await signIn(email, password)
      navigate('/course', { replace: true })
    } catch (err) {
      setErrorMsg(err.message || 'Invalid email or password.')
      setStatus('error')
    }
  }

  async function handleResend() {
    if (!email) {
      setResendErrorMsg('Enter your email above first.')
      setResendStatus('error')
      return
    }
    setResendStatus('loading')
    setResendErrorMsg('')
    try {
      await resetPasswordRequest(email)
      setResendStatus('success')
    } catch (err) {
      setResendErrorMsg(err.message || 'Something went wrong. Try again.')
      setResendStatus('error')
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
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

        <p className="pp-eyebrow" style={{ marginBottom: '1.25rem' }}>
          Welcome Back
        </p>

        <h1
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(1.75rem, 4vw, 2.75rem)',
            lineHeight: '1.15',
            color: 'var(--color-ink)',
            margin: '0 0 2rem',
          }}
        >
          Log in to your account
        </h1>

        <form onSubmit={handleSubmit}>
          <label
            style={{
              display: 'block',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.7rem',
              fontWeight: '600',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: 'var(--color-ink-muted)',
              marginBottom: '0.5rem',
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
              fontFamily: 'var(--font-serif)',
              border: '1px solid var(--color-rule)',
              background: 'var(--color-surface)',
              color: 'var(--color-ink)',
              outline: 'none',
              marginBottom: '1rem',
              boxSizing: 'border-box',
            }}
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <label
              style={{
                display: 'block',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.7rem',
                fontWeight: '600',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: 'var(--color-ink-muted)',
                marginBottom: '0.5rem',
              }}
            >
              Password
            </label>
            <Link
              to="/forgot-password"
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.65rem',
                fontWeight: '600',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--color-accent)',
                textDecoration: 'none',
              }}
            >
              Forgot password?
            </Link>
          </div>
          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={status === 'loading'}
              style={{
                width: '100%',
                padding: '0.75rem 2.75rem 0.75rem 1rem',
                fontSize: '0.9rem',
                fontFamily: 'var(--font-serif)',
                border: '1px solid var(--color-rule)',
                background: 'var(--color-surface)',
                color: 'var(--color-ink)',
                outline: 'none',
                marginBottom: '1.5rem',
                boxSizing: 'border-box',
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              tabIndex={-1}
              style={{
                position: 'absolute',
                right: '0.75rem',
                top: '0.7rem',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--color-ink-muted)',
                padding: 0,
                display: 'flex',
              }}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <button
            type="submit"
            disabled={status === 'loading'}
            style={{
              width: '100%',
              padding: '0.85rem 1.5rem',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.78rem',
              fontWeight: '600',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              background: 'var(--color-accent)',
              color: 'var(--color-accent-ink)',
              border: 'none',
              cursor: status === 'loading' ? 'wait' : 'pointer',
            }}
          >
            {status === 'loading' ? 'Signing in…' : 'Log In'}
          </button>

          {status === 'error' && (
            <p style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: '#e06c75' }}>
              {errorMsg}
            </p>
          )}

          <div style={{ marginTop: '1.25rem', textAlign: 'center' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-ink-muted)', margin: '0 0 0.5rem' }}>
              Didn't receive your welcome email?
            </p>
            {resendStatus === 'success' ? (
              <p
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.7rem',
                  fontWeight: '600',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'var(--color-accent)',
                  margin: 0,
                }}
              >
                Sent. Check your inbox.
              </p>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={resendStatus === 'loading'}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.7rem',
                  fontWeight: '600',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'var(--color-accent)',
                  textDecoration: 'underline',
                  cursor: resendStatus === 'loading' ? 'wait' : 'pointer',
                }}
              >
                {resendStatus === 'loading' ? 'Sending…' : 'Resend access link'}
              </button>
            )}
            {resendStatus === 'error' && (
              <p style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#e06c75' }}>
                {resendErrorMsg}
              </p>
            )}
          </div>
        </form>

        <div className="pp-card" style={{ marginTop: '1.5rem' }}>
          <p className="pp-section-label" style={{ margin: '0 0 0.5rem' }}>
            Workshop participants
          </p>
          <p
            style={{
              margin: 0,
              fontSize: '0.85rem',
              color: 'var(--color-ink-muted)',
              lineHeight: '1.55',
            }}
          >
            This portal is available to workshop participants only. An account is created for you when you purchase a workshop.
          </p>
        </div>
      </div>
    </div>
  )
}
