import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { useEnrollment } from '../hooks/useEnrollment'

export default function Profile() {
  const { user, loading, updateProfile } = useEnrollment()
  const navigate = useNavigate()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [status, setStatus] = useState('idle') // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState('')

  // Populate fields once user loads
  useEffect(() => {
    if (user) {
      setFirstName(user.user_metadata?.first_name || '')
      setLastName(user.user_metadata?.last_name || '')
      setEmail(user.email || '')
    }
  }, [user])

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      navigate('/login', { replace: true })
    }
  }, [loading, user, navigate])

  async function handleSubmit(e) {
    e.preventDefault()

    if (newPassword && newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.')
      setStatus('error')
      return
    }

    if (newPassword && newPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters.')
      setStatus('error')
      return
    }

    setStatus('loading')
    setErrorMsg('')

    try {
      const updates = { firstName, lastName }
      if (email !== user.email) updates.email = email
      if (newPassword) updates.password = newPassword

      await updateProfile(updates)
      setNewPassword('')
      setConfirmPassword('')
      setStatus('success')
    } catch (err) {
      setErrorMsg(err.message || 'Something went wrong. Try again.')
      setStatus('error')
    }
  }

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'var(--color-bg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: '"DM Sans", sans-serif',
          color: 'var(--color-ink-muted)',
          fontSize: '0.9rem',
        }}
      >
        Loading...
      </div>
    )
  }

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
    background: 'var(--color-surface)',
    color: 'var(--color-ink)',
    outline: 'none',
    marginBottom: '1rem',
    boxSizing: 'border-box',
  }

  const passwordInputStyle = {
    ...inputStyle,
    paddingRight: '2.75rem',
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
          to="/course"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.375rem',
            fontSize: '0.8rem',
            color: 'var(--color-ink-muted)',
            textDecoration: 'none',
            marginBottom: '1.5rem',
          }}
        >
          <ArrowLeft size={14} /> Back to Course
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
          Account
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
          Your Profile
        </h1>

        <form onSubmit={handleSubmit}>
          {/* Name fields */}
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>First Name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                disabled={status === 'loading'}
                style={inputStyle}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                disabled={status === 'loading'}
                style={inputStyle}
              />
            </div>
          </div>

          {/* Email */}
          <label style={labelStyle}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={status === 'loading'}
            style={inputStyle}
          />

          {/* Change password section */}
          <div
            style={{
              borderTop: '1px solid var(--color-rule)',
              marginTop: '0.5rem',
              paddingTop: '1.5rem',
              marginBottom: '0.5rem',
            }}
          >
            <p
              style={{
                fontSize: '0.78rem',
                fontWeight: '600',
                color: 'var(--color-ink)',
                marginBottom: '1rem',
              }}
            >
              Change Password
            </p>

            <label style={labelStyle}>New Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={status === 'loading'}
                minLength={6}
                placeholder="Leave blank to keep current"
                style={passwordInputStyle}
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

            <label style={labelStyle}>Confirm New Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={status === 'loading'}
                minLength={6}
                placeholder="Leave blank to keep current"
                style={passwordInputStyle}
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
              marginTop: '0.5rem',
            }}
          >
            {status === 'loading' ? 'Saving...' : 'Save Changes'}
          </button>

          {status === 'error' && (
            <p style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: '#e06c75' }}>
              {errorMsg}
            </p>
          )}

          {status === 'success' && (
            <p style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--color-accent)' }}>
              {email !== user.email
                ? 'Profile updated. Check your new email to confirm the address change.'
                : 'Profile updated successfully.'}
            </p>
          )}
        </form>
      </div>
    </div>
  )
}
