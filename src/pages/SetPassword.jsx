import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { useEnrollment } from '../hooks/useEnrollment'
import ExpiredLinkNotice from '../components/ui/ExpiredLinkNotice'
import TroubleLoggingIn from '../components/ui/TroubleLoggingIn'
import { friendlyAuthError } from '../lib/authErrors'

export default function SetPassword() {
  const { user, loading, setPassword } = useEnrollment()
  const navigate = useNavigate()
  const [password, setPasswordValue] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [status, setStatus] = useState('idle') // idle | loading | error
  const [errorMsg, setErrorMsg] = useState('')
  const [sessionLost, setSessionLost] = useState(false)

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
      // The session can lapse while the form sits open. updateUser() then fails
      // with "Auth session missing!". Route to the recovery screen instead of
      // showing a dead-end message.
      if ((err?.message || '').toLowerCase().includes('session missing')) {
        setSessionLost(true)
        return
      }
      setErrorMsg(friendlyAuthError(err, 'setpassword'))
      setStatus('error')
    }
  }

  // Hydrating the session from storage.
  if (loading) {
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
        Loading…
      </div>
    )
  }

  // No session: the link expired, was already used, was opened in a context that
  // dropped the session (common with in-app email browsers), or the session
  // lapsed while the form sat open. Either way updateUser() would fail, so show
  // a recovery path instead.
  if (!user || sessionLost) {
    return <ExpiredLinkNotice />
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
        <p className="pp-eyebrow" style={{ marginBottom: '1.25rem' }}>
          Almost There
        </p>

        <h1
          style={{
            fontFamily: 'var(--font-serif)',
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
                fontFamily: 'var(--font-serif)',
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
              fontFamily: 'var(--font-mono)',
              fontSize: '0.7rem',
              fontWeight: '600',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: 'var(--color-ink-muted)',
              marginBottom: '0.5rem',
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
            {status === 'loading' ? 'Setting password…' : 'Set Password & Start Course'}
          </button>

          {status === 'error' && (
            <p style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: '#e06c75' }}>
              {errorMsg}
            </p>
          )}
        </form>

        <TroubleLoggingIn />
      </div>
    </div>
  )
}
