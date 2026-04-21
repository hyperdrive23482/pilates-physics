import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { useEnrollment } from '../hooks/useEnrollment'

export default function Login() {
  const { user, signIn } = useEnrollment()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [status, setStatus] = useState('idle') // idle | loading | error
  const [errorMsg, setErrorMsg] = useState('')

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
          Welcome Back
        </p>

        <h1
          style={{
            fontFamily: '"DM Serif Display", serif',
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

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
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
            <Link
              to="/forgot-password"
              style={{
                fontSize: '0.75rem',
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
            {status === 'loading' ? 'Signing in...' : 'Log In'}
          </button>

          {status === 'error' && (
            <p style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: '#e06c75' }}>
              {errorMsg}
            </p>
          )}
        </form>

        <p
          style={{
            marginTop: '1.5rem',
            fontSize: '0.85rem',
            color: 'var(--color-ink-muted)',
            lineHeight: '1.5',
          }}
        >
          This portal is available to workshop participants only. An account is created for you when you purchase a workshop.
        </p>
      </div>
    </div>
  )
}
