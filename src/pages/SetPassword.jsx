import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { useEnrollment } from '../hooks/useEnrollment'

export default function SetPassword() {
  const { setPassword } = useEnrollment()
  const navigate = useNavigate()
  const [password, setPasswordValue] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [status, setStatus] = useState('idle') // idle | loading | error
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (password !== confirm) {
      setErrorMsg('Passwords do not match.')
      setStatus('error')
      return
    }
    setStatus('loading')
    setErrorMsg('')

    try {
      await setPassword(password)
      navigate('/course', { replace: true })
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
          Almost There
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
          Set your password
        </h1>

        <p
          style={{
            fontSize: '1rem',
            lineHeight: '1.75',
            color: 'var(--color-ink-muted)',
            margin: '0 0 2rem',
          }}
        >
          Choose a password you'll use to log in. Must be at least 6 characters.
        </p>

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
            Password
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              minLength={6}
              value={password}
              onChange={(e) => setPasswordValue(e.target.value)}
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
                marginBottom: '1rem',
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

          <label
            style={{
              display: 'block',
              fontSize: '0.78rem',
              fontWeight: '500',
              color: 'var(--color-ink-muted)',
              marginBottom: '0.375rem',
            }}
          >
            Confirm Password
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type={showConfirm ? 'text' : 'password'}
              required
              minLength={6}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
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
              onClick={() => setShowConfirm((v) => !v)}
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
              aria-label={showConfirm ? 'Hide password' : 'Show password'}
            >
              {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
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
            {status === 'loading' ? 'Setting password...' : 'Set Password & Start Course'}
          </button>

          {status === 'error' && (
            <p style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: '#e06c75' }}>
              {errorMsg}
            </p>
          )}
        </form>
      </div>
    </div>
  )
}
