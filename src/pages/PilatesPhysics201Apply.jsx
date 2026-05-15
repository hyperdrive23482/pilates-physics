import { useState } from 'react'
import { Link } from 'react-router-dom'

const primaryButtonStyle = {
  display: 'inline-block',
  padding: '0.875rem 1.75rem',
  fontSize: '0.95rem',
  fontWeight: '500',
  fontFamily: '"DM Sans", sans-serif',
  background: 'var(--color-accent)',
  color: '#1C1A17',
  border: 'none',
  textDecoration: 'none',
  cursor: 'pointer',
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
  background: 'var(--color-bg)',
  color: 'var(--color-ink)',
  outline: 'none',
  boxSizing: 'border-box',
}

const EQUIPMENT_OPTIONS = ['Reformer', 'Tower', 'Chair', 'Cadillac', 'Other']

export default function PilatesPhysics201Apply() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [city, setCity] = useState('')
  const [yearsTeaching, setYearsTeaching] = useState('')
  const [mainCareer, setMainCareer] = useState('')
  const [privatesPerWeek, setPrivatesPerWeek] = useState('')
  const [groupsPerWeek, setGroupsPerWeek] = useState('')
  const [equipment, setEquipment] = useState([])
  const [trainingBackground, setTrainingBackground] = useState('')
  const [physicsBackground, setPhysicsBackground] = useState('')
  const [completedPP101, setCompletedPP101] = useState('')
  const [goalsAndInterest, setGoalsAndInterest] = useState('')
  const [paymentPlan, setPaymentPlan] = useState('')
  const [acknowledgement, setAcknowledgement] = useState(false)
  const [website, setWebsite] = useState('')
  const [status, setStatus] = useState('idle')
  const [errorMsg, setErrorMsg] = useState('')

  function toggleEquipment(option) {
    setEquipment((prev) =>
      prev.includes(option) ? prev.filter((x) => x !== option) : [...prev, option]
    )
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (equipment.length === 0) {
      setErrorMsg('Please select at least one piece of equipment.')
      setStatus('error')
      return
    }
    if (!acknowledgement) {
      setErrorMsg('Please acknowledge the participation expectations to continue.')
      setStatus('error')
      return
    }
    setStatus('loading')
    setErrorMsg('')

    try {
      const res = await fetch('/api/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'application',
          name,
          email,
          city,
          yearsTeaching,
          mainCareer,
          privatesPerWeek,
          groupsPerWeek,
          equipment,
          trainingBackground,
          physicsBackground,
          completedPP101,
          goalsAndInterest,
          paymentPlan,
          acknowledgement,
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

  return (
    <div
      style={{
        maxWidth: '720px',
        margin: '0 auto',
        padding: '5rem 2rem 6rem',
      }}
    >
      <Link
        to="/pilates-physics-201"
        style={{
          color: 'var(--color-accent)',
          fontSize: '0.9rem',
          fontWeight: '500',
          textDecoration: 'none',
          display: 'inline-block',
          marginBottom: '2.5rem',
        }}
      >
        ← Back to PP-201 details
      </Link>

      <p
        style={{
          fontSize: '0.7rem',
          fontWeight: '600',
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          color: 'var(--color-accent)',
          marginBottom: '1rem',
        }}
      >
        Pilates Physics 201
      </p>
      <h1
        style={{
          fontFamily: '"DM Serif Display", serif',
          fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)',
          lineHeight: '1.2',
          color: 'var(--color-ink)',
          margin: '0 0 1rem',
        }}
      >
        Apply to join the next cohort
      </h1>
      <p
        style={{
          fontSize: '1rem',
          lineHeight: '1.7',
          color: 'var(--color-ink-muted)',
          margin: '0 0 2.5rem',
        }}
      >
        Applications close on July 19, but I review them on a
        first-come-first-serve basis. Tell me a little bit about yourself and
        why you want to take this course, and I'll get back to you within 10
        business days.
      </p>

      <div
        style={{
          background: 'var(--color-surface)',
          padding: '2.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
        }}
      >
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
              Thanks — your application is in.
            </p>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-ink-muted)', margin: 0 }}>
              I review every application personally. Expect a reply within a week.
              Check your inbox for a confirmation email.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
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
            </div>

            <div>
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
            </div>

            <div>
              <label style={labelStyle}>City / region</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                disabled={status === 'loading'}
                maxLength={200}
                placeholder="Helps me gauge timezone for the cohort"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Years teaching Pilates</label>
              <select
                required
                value={yearsTeaching}
                onChange={(e) => setYearsTeaching(e.target.value)}
                disabled={status === 'loading'}
                style={inputStyle}
              >
                <option value="">Select one…</option>
                <option value="<1">&lt;1 year</option>
                <option value="1-3">1-3 years</option>
                <option value="4-7">4-7 years</option>
                <option value="8+">8+ years</option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>Is teaching Pilates your main career?</label>
              <select
                required
                value={mainCareer}
                onChange={(e) => setMainCareer(e.target.value)}
                disabled={status === 'loading'}
                style={inputStyle}
              >
                <option value="">Select one…</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Privates per week (avg)</label>
                <input
                  type="number"
                  required
                  min={0}
                  max={100}
                  value={privatesPerWeek}
                  onChange={(e) => setPrivatesPerWeek(e.target.value)}
                  disabled={status === 'loading'}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Group classes per week (avg)</label>
                <input
                  type="number"
                  required
                  min={0}
                  max={100}
                  value={groupsPerWeek}
                  onChange={(e) => setGroupsPerWeek(e.target.value)}
                  disabled={status === 'loading'}
                  style={inputStyle}
                />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Equipment you have regular access to</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.25rem' }}>
                {EQUIPMENT_OPTIONS.map((option) => (
                  <label
                    key={option}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: '0.9rem',
                      color: 'var(--color-ink)',
                      cursor: status === 'loading' ? 'wait' : 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={equipment.includes(option)}
                      onChange={() => toggleEquipment(option)}
                      disabled={status === 'loading'}
                      style={{ accentColor: 'var(--color-accent)' }}
                    />
                    {option}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label style={labelStyle}>
                Your training, certifications, and any interesting workshops you've taken
              </label>
              <textarea
                required
                value={trainingBackground}
                onChange={(e) => setTrainingBackground(e.target.value)}
                disabled={status === 'loading'}
                maxLength={2000}
                rows={4}
                style={{ ...inputStyle, resize: 'vertical', fontFamily: '"DM Sans", sans-serif' }}
              />
            </div>

            <div>
              <label style={labelStyle}>
                Describe any previous physics, math, or engineering training you've had
              </label>
              <p
                style={{
                  fontSize: '0.78rem',
                  lineHeight: '1.5',
                  color: 'var(--color-ink-muted)',
                  margin: '-0.125rem 0 0.5rem',
                }}
              >
                Not required. The course will cover the basic math concepts you need to know.
              </p>
              <textarea
                value={physicsBackground}
                onChange={(e) => setPhysicsBackground(e.target.value)}
                disabled={status === 'loading'}
                maxLength={2000}
                rows={4}
                style={{ ...inputStyle, resize: 'vertical', fontFamily: '"DM Sans", sans-serif' }}
              />
            </div>

            <div>
              <label style={labelStyle}>Have you completed Pilates Physics 101?</label>
              <select
                required
                value={completedPP101}
                onChange={(e) => setCompletedPP101(e.target.value)}
                disabled={status === 'loading'}
                style={inputStyle}
              >
                <option value="">Select one…</option>
                <option value="yes">Yes</option>
                <option value="add-to-purchase">No, I need to add this course to my purchase</option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>
                Why are you interested in PP-201, and what do you hope to get out of it?
              </label>
              <textarea
                required
                value={goalsAndInterest}
                onChange={(e) => setGoalsAndInterest(e.target.value)}
                disabled={status === 'loading'}
                maxLength={2000}
                rows={5}
                style={{ ...inputStyle, resize: 'vertical', fontFamily: '"DM Sans", sans-serif' }}
              />
            </div>

            <div>
              <label style={labelStyle}>Which payment plan would you be most interested in?</label>
              <select
                required
                value={paymentPlan}
                onChange={(e) => setPaymentPlan(e.target.value)}
                disabled={status === 'loading'}
                style={inputStyle}
              >
                <option value="">Select one…</option>
                <option value="upfront">$1,500 single up-front payment</option>
                <option value="monthly">$600/mo for 3 months</option>
              </select>
            </div>

            <label
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.625rem',
                fontSize: '0.85rem',
                lineHeight: '1.55',
                color: 'var(--color-ink)',
                cursor: status === 'loading' ? 'wait' : 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={acknowledgement}
                onChange={(e) => setAcknowledgement(e.target.checked)}
                disabled={status === 'loading'}
                style={{ accentColor: 'var(--color-accent)', marginTop: '0.25rem', flexShrink: 0 }}
              />
              <span>
                I understand that to get the most out of this mentorship, live attendance,
                proactive scheduling of 1:1s, and completion of homework are important.
                Life happens, but being able to fully participate makes the program better.
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
                ...primaryButtonStyle,
                width: '100%',
                cursor: status === 'loading' ? 'wait' : 'pointer',
              }}
            >
              {status === 'loading' ? 'Sending…' : 'Submit application'}
            </button>

            {status === 'error' && (
              <p style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#e06c75' }}>
                {errorMsg}
              </p>
            )}
          </form>
        )}
      </div>
    </div>
  )
}
