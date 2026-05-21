import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { useEnrollment } from '../hooks/useEnrollment'

const RESEND_COOLDOWN = 60

const labelStyle = {
  display: 'block',
  fontFamily: 'var(--font-mono)',
  fontSize: '0.7rem',
  fontWeight: '600',
  letterSpacing: '0.15em',
  textTransform: 'uppercase',
  color: 'var(--color-ink-muted)',
  marginBottom: '0.5rem',
}

const inputStyle = {
  width: '100%',
  padding: '0.75rem 1rem',
  fontSize: '0.9rem',
  fontFamily: 'var(--font-serif)',
  border: '1px solid var(--color-rule)',
  background: 'var(--color-surface)',
  color: 'var(--color-ink)',
  outline: 'none',
  boxSizing: 'border-box',
}

const primaryButtonStyle = {
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
}

const textButtonStyle = {
  background: 'none',
  border: 'none',
  padding: 0,
  fontFamily: 'var(--font-mono)',
  fontSize: '0.72rem',
  fontWeight: '600',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--color-accent)',
  textDecoration: 'underline',
  cursor: 'pointer',
}

const introStyle = {
  fontSize: '1rem',
  lineHeight: '1.7',
  color: 'var(--color-ink-muted)',
  margin: '0 0 1.75rem',
}

const errorStyle = {
  marginTop: '0.85rem',
  fontSize: '0.8rem',
  color: '#e06c75',
  lineHeight: '1.55',
}

// Supabase auth errors are terse and technical. Translate the ones a customer
// can actually hit into plain language that points at the next step.
function friendlyAuthError(err, context) {
  const raw = (err?.message || '').toLowerCase()
  if (raw.includes('signups not allowed') || raw.includes('user not found')) {
    return "We couldn't find an account for that email. Double-check the spelling, or try the address you signed up with."
  }
  if (raw.includes('security purposes') || raw.includes('rate limit')) {
    return 'That was just sent. Wait a moment before requesting another email.'
  }
  if (context === 'verify' && (raw.includes('expired') || raw.includes('invalid') || raw.includes('token'))) {
    return "That code didn't work. It may have expired. Use the code from the most recent email, or resend below."
  }
  if (context === 'password' && raw.includes('invalid login credentials')) {
    return 'That email and password did not match. If you never set a password, choose "Email me a sign-in link instead" below.'
  }
  return err?.message || 'Something went wrong. Please try again.'
}

export default function Login() {
  const { user, signIn, signInWithLink, verifyEmailCode } = useEnrollment()
  const navigate = useNavigate()

  const [mode, setMode] = useState('link') // 'link' | 'password'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [code, setCode] = useState('')

  const [linkSent, setLinkSent] = useState(false)
  const [linkBusy, setLinkBusy] = useState(false)
  const [linkError, setLinkError] = useState('')
  const [resent, setResent] = useState(false)
  const [resendIn, setResendIn] = useState(0)

  const [pwBusy, setPwBusy] = useState(false)
  const [pwError, setPwError] = useState('')

  // Already signed in: skip the form entirely.
  useEffect(() => {
    if (user) navigate('/portal', { replace: true })
  }, [user, navigate])

  // Tick the resend cooldown down to zero, one second at a time.
  useEffect(() => {
    if (resendIn <= 0) return
    const t = setTimeout(() => setResendIn((s) => Math.max(0, s - 1)), 1000)
    return () => clearTimeout(t)
  }, [resendIn])

  async function handleSendLink(e) {
    e.preventDefault()
    setLinkBusy(true)
    setLinkError('')
    try {
      await signInWithLink(email.trim().toLowerCase())
      setLinkSent(true)
      setResent(false)
      setResendIn(RESEND_COOLDOWN)
    } catch (err) {
      setLinkError(friendlyAuthError(err, 'send'))
    } finally {
      setLinkBusy(false)
    }
  }

  async function handleVerifyCode(e) {
    e.preventDefault()
    setLinkBusy(true)
    setLinkError('')
    try {
      await verifyEmailCode(email.trim().toLowerCase(), code)
      navigate('/portal', { replace: true })
    } catch (err) {
      setLinkError(friendlyAuthError(err, 'verify'))
      setLinkBusy(false)
    }
  }

  async function handleResend() {
    if (resendIn > 0 || linkBusy) return
    setLinkError('')
    setResent(false)
    setResendIn(RESEND_COOLDOWN)
    try {
      await signInWithLink(email.trim().toLowerCase())
      setResent(true)
    } catch (err) {
      setLinkError(friendlyAuthError(err, 'send'))
      setResendIn(0)
    }
  }

  async function handlePasswordLogin(e) {
    e.preventDefault()
    setPwBusy(true)
    setPwError('')
    try {
      await signIn(email.trim().toLowerCase(), password)
      navigate('/portal', { replace: true })
    } catch (err) {
      setPwError(friendlyAuthError(err, 'password'))
      setPwBusy(false)
    }
  }

  function goToPasswordMode() {
    setMode('password')
    setLinkError('')
  }

  function goToLinkMode() {
    setMode('link')
    setPwError('')
  }

  function useDifferentEmail() {
    setLinkSent(false)
    setCode('')
    setLinkError('')
    setResent(false)
    setResendIn(0)
  }

  const cleanEmail = email.trim().toLowerCase()
  const codeReady = code.length === 6
  const eyebrow = linkSent ? 'Check Your Inbox' : 'Welcome Back'
  const heading = linkSent ? "You're almost in" : 'Log in to your account'

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
          {eyebrow}
        </p>

        <h1
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(1.75rem, 4vw, 2.75rem)',
            lineHeight: '1.15',
            color: 'var(--color-ink)',
            margin: '0 0 1.5rem',
          }}
        >
          {heading}
        </h1>

        {/* ---- Magic link: request stage ---- */}
        {mode === 'link' && !linkSent && (
          <>
            <p style={introStyle}>
              Enter your email and we'll send you a link to log in. No password to remember.
            </p>

            <form onSubmit={handleSendLink}>
              <label htmlFor="login-email" style={labelStyle}>
                Email
              </label>
              <input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={linkBusy}
                autoComplete="email"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                inputMode="email"
                style={{ ...inputStyle, marginBottom: '1.25rem' }}
              />

              <button
                type="submit"
                disabled={linkBusy}
                style={{ ...primaryButtonStyle, cursor: linkBusy ? 'wait' : 'pointer' }}
              >
                {linkBusy ? 'Sending…' : 'Email me a sign-in link'}
              </button>

              {linkError && <p style={errorStyle}>{linkError}</p>}
            </form>

            <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
              <button type="button" onClick={goToPasswordMode} style={textButtonStyle}>
                Log in with a password instead
              </button>
            </div>
          </>
        )}

        {/* ---- Magic link: sent stage (link in the email + code entry here) ---- */}
        {mode === 'link' && linkSent && (
          <>
            <p style={introStyle}>
              We emailed a sign-in link and a 6-digit code to{' '}
              <strong style={{ color: 'var(--color-ink)' }}>{cleanEmail}</strong>. Click the
              link in that email, or enter the code below. If it's not there within a minute,
              check your spam folder.
            </p>

            <form onSubmit={handleVerifyCode}>
              <label htmlFor="login-code" style={labelStyle}>
                6-digit code
              </label>
              <input
                id="login-code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]*"
                maxLength={6}
                required
                autoFocus
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                  if (linkError) setLinkError('')
                }}
                disabled={linkBusy}
                style={{
                  ...inputStyle,
                  marginBottom: '1.25rem',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '1.5rem',
                  letterSpacing: '0.4em',
                  textAlign: 'center',
                }}
              />

              <button
                type="submit"
                disabled={linkBusy || !codeReady}
                style={{
                  ...primaryButtonStyle,
                  cursor: linkBusy || !codeReady ? 'not-allowed' : 'pointer',
                  opacity: codeReady ? 1 : 0.55,
                }}
              >
                {linkBusy ? 'Verifying…' : 'Verify code & log in'}
              </button>

              {linkError && <p style={errorStyle}>{linkError}</p>}
            </form>

            <div
              style={{
                marginTop: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.85rem',
              }}
            >
              {resent && (
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-accent)' }}>
                  Sent. Use the code from the newest email.
                </p>
              )}
              <button
                type="button"
                onClick={handleResend}
                disabled={resendIn > 0 || linkBusy}
                style={{
                  ...textButtonStyle,
                  color: resendIn > 0 ? 'var(--color-ink-muted)' : 'var(--color-accent)',
                  textDecoration: resendIn > 0 ? 'none' : 'underline',
                  cursor: resendIn > 0 || linkBusy ? 'default' : 'pointer',
                }}
              >
                {resendIn > 0 ? `Resend email in ${resendIn}s` : "Didn't get it? Resend email"}
              </button>
              <button type="button" onClick={useDifferentEmail} style={textButtonStyle}>
                Use a different email
              </button>
            </div>
          </>
        )}

        {/* ---- Password login ---- */}
        {mode === 'password' && (
          <>
            <form onSubmit={handlePasswordLogin}>
              <label htmlFor="login-email-pw" style={labelStyle}>
                Email
              </label>
              <input
                id="login-email-pw"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={pwBusy}
                autoComplete="email"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                inputMode="email"
                style={{ ...inputStyle, marginBottom: '1rem' }}
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <label htmlFor="login-password" style={labelStyle}>
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
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={pwBusy}
                  autoComplete="current-password"
                  style={{
                    ...inputStyle,
                    padding: '0.75rem 2.75rem 0.75rem 1rem',
                    marginBottom: '1.5rem',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
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
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <button
                type="submit"
                disabled={pwBusy}
                style={{ ...primaryButtonStyle, cursor: pwBusy ? 'wait' : 'pointer' }}
              >
                {pwBusy ? 'Signing in…' : 'Log in'}
              </button>

              {pwError && <p style={errorStyle}>{pwError}</p>}
            </form>

            <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
              <button type="button" onClick={goToLinkMode} style={textButtonStyle}>
                Email me a sign-in link instead
              </button>
            </div>
          </>
        )}

        <div className="pp-card" style={{ marginTop: '1.5rem' }}>
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
