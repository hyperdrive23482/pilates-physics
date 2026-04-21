import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useEnrollment } from '../hooks/useEnrollment'

export default function Help() {
  const { user } = useEnrollment()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [website, setWebsite] = useState('')
  const [status, setStatus] = useState('idle')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (!user) return
    const first = user.user_metadata?.first_name || ''
    const last = user.user_metadata?.last_name || ''
    const full = `${first} ${last}`.trim()
    if (full) setName((prev) => prev || full)
    if (user.email) setEmail((prev) => prev || user.email)
  }, [user])

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message, website }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Something went wrong. Try again.')
      setStatus('success')
    } catch (err) {
      setErrorMsg(err.message || 'Something went wrong. Try again.')
      setStatus('error')
    }
  }

  const sectionStyle = {
    maxWidth: '720px',
    margin: '0 auto',
    padding: '6rem 2rem',
  }

  const h1Style = {
    fontFamily: '"DM Serif Display", serif',
    fontSize: 'clamp(2rem, 4vw, 3rem)',
    lineHeight: '1.15',
    color: 'var(--color-ink)',
    margin: '0 0 0.5rem',
  }

  const h2Style = {
    fontFamily: '"DM Serif Display", serif',
    fontSize: '1.35rem',
    lineHeight: '1.3',
    color: 'var(--color-ink)',
    margin: '2.5rem 0 0.75rem',
  }

  const h3Style = {
    fontFamily: '"DM Sans", sans-serif',
    fontSize: '1rem',
    fontWeight: '500',
    lineHeight: '1.4',
    color: 'var(--color-ink)',
    margin: '1.75rem 0 0.5rem',
  }

  const pStyle = {
    fontSize: '0.95rem',
    lineHeight: '1.75',
    color: 'var(--color-ink-muted)',
    margin: '0 0 1rem',
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

  return (
    <div style={sectionStyle}>
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
        Help
      </p>
      <h1 style={h1Style}>How can we help?</h1>
      <p style={pStyle}>
        Answers to common questions are below. If you don't see what you're looking for,
        send a note using the form at the bottom of the page and Kaleen will reply within
        a few days.
      </p>

      <h2 style={h2Style}>Frequently asked</h2>

      <h3 style={h3Style}>How do I access my purchased workshops?</h3>
      <p style={pStyle}>
        Log in and head to your{' '}
        <Link to="/portal" style={{ color: 'var(--color-accent)' }}>portal</Link>. Every
        workshop you've registered for appears there, including Zoom links for live
        sessions and recordings once they're posted.
      </p>

      <h3 style={h3Style}>Can I get a refund?</h3>
      <p style={pStyle}>
        Refund eligibility depends on the specific workshop or product and is stated at the
        time of purchase. See section 5 of our{' '}
        <Link to="/terms" style={{ color: 'var(--color-accent)' }}>Terms &amp; Conditions</Link>{' '}
        for the full policy, or reach out below with your order details.
      </p>

      <h3 style={h3Style}>I'm having trouble logging in.</h3>
      <p style={pStyle}>
        Try the{' '}
        <Link to="/forgot-password" style={{ color: 'var(--color-accent)' }}>password reset</Link>{' '}
        link on the login page — it sends a fresh sign-in email to your address. If the
        email doesn't arrive, check spam, then message us below and include the email you
        registered with.
      </p>

      <h3 style={h3Style}>Where are the recordings from live sessions?</h3>
      <p style={pStyle}>
        Recordings are posted to each workshop's portal page a few days after the live
        session wraps. If it's been more than a week, let us know.
      </p>

      <h3 style={h3Style}>Do you offer 1-on-1 mentorship?</h3>
      <p style={pStyle}>
        Mentorship slots are limited and open periodically. Mention "mentorship" in your
        message below and we'll let you know when the next cohort opens.
      </p>

      <h2 style={h2Style}>Send a message</h2>

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
            Thanks — your message is on its way.
          </p>
          <p style={{ fontSize: '0.9rem', color: 'var(--color-ink-muted)' }}>
            We'll reply within a few days. Check your inbox for a confirmation email.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <label style={labelStyle}>Name</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={status === 'loading'}
            maxLength={200}
            style={inputStyle}
          />

          <label style={labelStyle}>Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={status === 'loading'}
            maxLength={320}
            style={inputStyle}
          />

          <label style={labelStyle}>Message</label>
          <textarea
            required
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={status === 'loading'}
            maxLength={5000}
            rows={6}
            style={{ ...inputStyle, marginBottom: '1.5rem', resize: 'vertical', fontFamily: '"DM Sans", sans-serif' }}
          />

          <input
            type="text"
            name="website"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            style={{ display: 'none' }}
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
            {status === 'loading' ? 'Sending...' : 'Send message'}
          </button>

          {status === 'error' && (
            <p style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: '#e06c75' }}>
              {errorMsg}
            </p>
          )}
        </form>
      )}
    </div>
  )
}
