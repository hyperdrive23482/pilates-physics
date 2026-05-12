import { useState, useEffect } from 'react'
import { useEnrollment } from '../hooks/useEnrollment'

const APPLICATIONS_CLOSE = new Date('2026-05-15T00:00:00-07:00')

export default function Assist() {
  const { user } = useEnrollment()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [location, setLocation] = useState('')
  const [hasComputer, setHasComputer] = useState('')
  const [certifiedWhen, setCertifiedWhen] = useState('')
  const [teachingLoad, setTeachingLoad] = useState('')
  const [zoomExperience, setZoomExperience] = useState('')
  const [whyInterested, setWhyInterested] = useState('')
  const [available, setAvailable] = useState(false)
  const [website, setWebsite] = useState('')
  const [status, setStatus] = useState('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const isClosed = new Date() >= APPLICATIONS_CLOSE

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
      const res = await fetch('/api/assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          location,
          hasComputer,
          certifiedWhen,
          teachingLoad,
          zoomExperience,
          whyInterested,
          available,
          website,
        }),
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
    margin: '0 0 1.25rem',
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
    margin: '1.5rem 0 0.5rem',
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

  const textareaStyle = {
    ...inputStyle,
    resize: 'vertical',
    fontFamily: '"DM Sans", sans-serif',
  }

  const selectStyle = {
    ...inputStyle,
    appearance: 'auto',
  }

  const charCountStyle = {
    fontSize: '0.7rem',
    color: 'var(--color-ink-dim)',
    textAlign: 'right',
    marginTop: '0.25rem',
    marginBottom: '1rem',
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
        Apply to assist me during my live May 20th workshop
      </p>
      <h1 style={h1Style}>Attend my workshop for FREE</h1>

      <p
        style={{
          fontFamily: '"DM Serif Display", serif',
          fontSize: '1.1rem',
          color: 'var(--color-accent)',
          margin: '0 0 0.5rem',
        }}
      >
        1 spot available.
      </p>
      <p style={{ ...pStyle, fontStyle: 'italic', margin: 0 }}>
        This is a barter, not a paid role: you attend the workshop free ($99 value) in
        exchange for light assistance.
      </p>
      <h2 style={h2Style}>Date and Time</h2>
      <p style={pStyle}>Wednesday May 20th, 10:40am–1:20pm Pacific Time (GMT-7)</p>
      <p style={{ ...pStyle, fontStyle: 'italic' }}>
        20 mins before and after the workshop, plus minor admin during the workshop.
      </p>

      <h2 style={h2Style}>Responsibilities</h2>

      <h3 style={h3Style}>Before the workshop</h3>
      <p style={pStyle}>
        Login and together on zoom with Kaleen, review zoom procedures, check recording
        setup, and familiarize with controls. (10:40–11:00am Pacific Time)
      </p>

      <h3 style={h3Style}>During the workshop</h3>
      <p style={pStyle}>
        Ensure participants are muted unless called upon, immediately notify Kaleen if
        she cannot be seen or heard, and share links to resources (provided by me) if
        applicable to questions in the chat. (11:00am–1:00pm Pacific Time)
      </p>

      <h3 style={h3Style}>After the workshop</h3>
      <p style={pStyle}>
        Quick review of tech performance during workshop to capture lessons learned or
        ideas for next time.
      </p>

      <h2 style={h2Style}>Who this is for</h2>
      <p style={pStyle}>
        You must be tech savvy, very familiar with zoom controls and virtual meeting
        etiquette, and punctual. This opportunity is best for certified instructors with
        1–3 years teaching experience using a reformer.
      </p>

      <p
        style={{
          ...pStyle,
          fontStyle: 'italic',
          marginTop: '1.5rem',
        }}
      >
        Applications close on May 14th, 2026. You will be notified on May 15th, 2026
        whether you have been selected.
      </p>

      <h2 style={h2Style}>{isClosed ? 'Applications closed' : 'Apply below'}</h2>

      {isClosed ? (
        <p style={pStyle}>
          Applications closed on 5/14/26. The selected assistant will be notified on
          5/15/26.
        </p>
      ) : status === 'success' ? (
        <div>
          <p
            style={{
              fontFamily: '"DM Serif Display", serif',
              fontSize: '1.25rem',
              color: 'var(--color-accent)',
              marginBottom: '0.75rem',
            }}
          >
            Thanks — your application is in.
          </p>
          <p style={{ fontSize: '0.9rem', color: 'var(--color-ink-muted)' }}>
            You'll hear back on 5/15/26 either way. Check your inbox for a confirmation
            email.
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

          <label style={labelStyle}>Location</label>
          <input
            type="text"
            required
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            disabled={status === 'loading'}
            maxLength={200}
            placeholder="City, region"
            style={inputStyle}
          />

          <label style={labelStyle}>
            Do you have access to a laptop/desktop computer during this time period?
          </label>
          <select
            required
            value={hasComputer}
            onChange={(e) => setHasComputer(e.target.value)}
            disabled={status === 'loading'}
            style={selectStyle}
          >
            <option value="" disabled>
              Select one
            </option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>

          <label style={labelStyle}>When did you become fully certified?</label>
          <input
            type="text"
            required
            value={certifiedWhen}
            onChange={(e) => setCertifiedWhen(e.target.value)}
            disabled={status === 'loading'}
            maxLength={200}
            placeholder="Month / year"
            style={inputStyle}
          />

          <label style={labelStyle}>
            What is your current teaching load? (privates/groups/quantities)
          </label>
          <textarea
            required
            value={teachingLoad}
            onChange={(e) => setTeachingLoad(e.target.value)}
            disabled={status === 'loading'}
            maxLength={750}
            rows={3}
            style={{ ...textareaStyle, marginBottom: 0 }}
          />
          <div style={charCountStyle}>{teachingLoad.length} / 750</div>

          <label style={labelStyle}>
            What is your experience with zoom? The more specific the better.
          </label>
          <textarea
            required
            value={zoomExperience}
            onChange={(e) => setZoomExperience(e.target.value)}
            disabled={status === 'loading'}
            maxLength={750}
            rows={4}
            style={{ ...textareaStyle, marginBottom: 0 }}
          />
          <div style={charCountStyle}>{zoomExperience.length} / 750</div>

          <label style={labelStyle}>Why are you interested in Pilates Physics?</label>
          <textarea
            required
            value={whyInterested}
            onChange={(e) => setWhyInterested(e.target.value)}
            disabled={status === 'loading'}
            maxLength={750}
            rows={4}
            style={{ ...textareaStyle, marginBottom: 0 }}
          />
          <div style={{ ...charCountStyle, marginBottom: '1.5rem' }}>
            {whyInterested.length} / 750
          </div>

          <label
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.6rem',
              marginBottom: '1.5rem',
              cursor: status === 'loading' ? 'wait' : 'pointer',
              fontSize: '0.85rem',
              lineHeight: '1.5',
              color: 'var(--color-ink-muted)',
            }}
          >
            <input
              type="checkbox"
              required
              checked={available}
              onChange={(e) => setAvailable(e.target.checked)}
              disabled={status === 'loading'}
              style={{
                marginTop: '0.25rem',
                flexShrink: 0,
                accentColor: 'var(--color-accent)',
                cursor: status === 'loading' ? 'wait' : 'pointer',
              }}
            />
            <span>
              I am available and have access to reliable wifi from 10:40am–1:20pm
              Pacific Time (GMT-7) on May 20th, 2026.
            </span>
          </label>

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
            {status === 'loading' ? 'Submitting...' : 'Submit application'}
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
