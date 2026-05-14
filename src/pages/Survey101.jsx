import { useState } from 'react'
import { Link } from 'react-router-dom'

const WORKSHOP_TITLE = 'Pilates Physics 101'
const WORKSHOP_DATE = '2026-05-20'
// Browser local time — survey closes at midnight on June 1, 2026 wherever the respondent is.
const SURVEY_CUTOFF = new Date('2026-06-01T00:00:00')

const YEARS_OPTIONS = ['<1 year', '1-3 years', '4-7 years', '8-15 years', '15+ years']
const VALUABLE_OPTIONS = [
  { value: 'Framework', label: 'The Framework (Intention → Load → Feedback)' },
  {
    value: 'Background Physics',
    label: 'The Background Physics (springs, body weight, force vectors, free body diagrams)',
  },
  {
    value: 'Practical Application',
    label: 'The Practical Application (footwork, bridge, lunge, long stretch, serve-a-tray)',
  },
  { value: 'Wrap-Up Challenge worksheet', label: 'The Wrap-Up Challenge worksheet' },
]
const RUSHED_OPTIONS = [
  'Framework',
  'Background Physics',
  'Practical Application',
  'Wrap-Up',
  'Nothing — pacing felt right',
]
const LENGTH_OPTIONS = ["Could've been shorter", 'Just right', "Could've been longer"]
const SHARE_OPTIONS = [
  'Yes, with my first name',
  'Yes, but keep me anonymous',
  'No, please keep my responses private',
]

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

const fieldsetStyle = {
  border: 'none',
  padding: 0,
  margin: 0,
}

const sectionHeadingStyle = {
  fontFamily: '"DM Serif Display", serif',
  fontSize: '1.5rem',
  color: 'var(--color-ink)',
  marginBottom: '1.25rem',
  padding: 0,
}

const optionRowStyle = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '0.65rem',
  fontSize: '0.95rem',
  color: 'var(--color-ink)',
  cursor: 'pointer',
  padding: '0.45rem 0',
  lineHeight: '1.45',
}

const visuallyHidden = {
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0,
}

const accentLinkStyle = { color: 'var(--color-accent)' }

const initialFormData = {
  name: '',
  email: '',
  yearsTeaching: '',
  nps: '',
  changeThisWeek: '',
  ahaMoment: '',
  valuableSections: [],
  rushedSection: '',
  confusing: '',
  lengthFeedback: '',
  sharePermission: '',
  nextWorkshopTopic: '',
  anythingElse: '',
}

function Section({ children, style = {} }) {
  return (
    <section
      style={{
        maxWidth: '1100px',
        margin: '0 auto',
        padding: '6rem 2rem',
        ...style,
      }}
    >
      {children}
    </section>
  )
}

function Rule() {
  return (
    <hr style={{ border: 'none', borderTop: '1px solid var(--color-rule)', margin: 0 }} />
  )
}

function Hero({ eyebrow, title, intro }) {
  return (
    <section style={{ background: 'var(--color-bg)' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '7rem 2rem 5rem' }}>
        <div style={{ maxWidth: '720px' }}>
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
            {eyebrow}
          </p>
          <h1
            style={{
              fontFamily: '"DM Serif Display", serif',
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              lineHeight: '1.15',
              color: 'var(--color-ink)',
              margin: '0 0 1.5rem',
            }}
          >
            {title}
          </h1>
          {intro && (
            <p
              style={{
                fontSize: '1.1rem',
                lineHeight: '1.65',
                color: 'var(--color-ink-muted)',
                margin: 0,
              }}
            >
              {intro}
            </p>
          )}
        </div>
      </div>
    </section>
  )
}

export default function Survey101() {
  const isClosed = new Date() >= SURVEY_CUTOFF

  if (isClosed) {
    return (
      <div>
        <Hero eyebrow="Workshop Feedback" title={`${WORKSHOP_TITLE} survey`} />
        <Rule />
        <Section style={{ maxWidth: '720px' }}>
          <p
            style={{
              fontSize: '1.1rem',
              lineHeight: '1.7',
              color: 'var(--color-ink-muted)',
              margin: 0,
            }}
          >
            The survey period is closed. Please see the{' '}
            <Link to="/education" style={accentLinkStyle}>
              education
            </Link>{' '}
            page for upcoming workshops.
          </p>
        </Section>
      </div>
    )
  }

  return <OpenSurvey />
}

function OpenSurvey() {
  const [formData, setFormData] = useState(initialFormData)
  const [website, setWebsite] = useState('')
  const [status, setStatus] = useState('idle')
  const [errorMsg, setErrorMsg] = useState('')

  function update(field, value) {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  function toggleValuable(option) {
    setFormData((prev) => {
      const current = prev.valuableSections
      const next = current.includes(option)
        ? current.filter((item) => item !== option)
        : [...current, option]
      return { ...prev, valuableSections: next }
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()

    // Custom-rendered controls — native `required` can't show validation UI on
    // visually-hidden radios, so we check explicitly.
    if (!formData.nps) {
      setErrorMsg('Please choose a score from 1 to 10 for question 1.')
      setStatus('error')
      return
    }
    if (formData.valuableSections.length === 0) {
      setErrorMsg('Please check at least one section for question 4.')
      setStatus('error')
      return
    }

    setStatus('loading')
    setErrorMsg('')

    try {
      const res = await fetch('/api/survey-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          years_teaching: formData.yearsTeaching,
          nps_score: Number(formData.nps),
          change_this_week: formData.changeThisWeek,
          aha_moment: formData.ahaMoment,
          valuable_sections: formData.valuableSections,
          rushed_section: formData.rushedSection,
          confusing: formData.confusing,
          length_feedback: formData.lengthFeedback,
          share_permission: formData.sharePermission,
          next_workshop_topic: formData.nextWorkshopTopic,
          anything_else: formData.anythingElse,
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

  if (status === 'success') {
    return (
      <div>
        <Hero eyebrow="Workshop Feedback" title="Thanks — feedback received." />
        <Rule />
        <Section style={{ maxWidth: '720px' }}>
          <p
            style={{
              fontSize: '1.1rem',
              lineHeight: '1.7',
              color: 'var(--color-ink-muted)',
              margin: 0,
            }}
          >
            That's incredibly helpful. Watch the{' '}
            <Link to="/education" style={accentLinkStyle}>
              education
            </Link>{' '}
            page for the next workshop.
          </p>
        </Section>
      </div>
    )
  }

  const disabled = status === 'loading'

  return (
    <div>
      <Hero
        eyebrow="Workshop Feedback"
        title={`${WORKSHOP_TITLE} — your feedback`}
        intro="Hey! Quick favor — would you fill this out to help me make Pilates Physics 101 even better next time? Takes about 5 minutes. Honest feedback is the most useful kind, even if it stings a little. Thank you for being part of this."
      />

      <Rule />

      <section style={{ background: 'var(--color-surface)' }}>
        <Section style={{ maxWidth: '720px' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
            {/* ── About you ──────────────────────────────────────────────── */}
            <fieldset style={fieldsetStyle}>
              <legend style={sectionHeadingStyle}>About you</legend>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label htmlFor="sf-name" style={labelStyle}>
                    Name
                  </label>
                  <input
                    id="sf-name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => update('name', e.target.value)}
                    disabled={disabled}
                    maxLength={200}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label htmlFor="sf-email" style={labelStyle}>
                    Email
                  </label>
                  <input
                    id="sf-email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => update('email', e.target.value)}
                    disabled={disabled}
                    maxLength={320}
                    style={inputStyle}
                  />
                </div>

                <fieldset style={fieldsetStyle}>
                  <legend style={labelStyle}>How many years have you been teaching Pilates?</legend>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                    {YEARS_OPTIONS.map((option) => (
                      <label key={option} style={optionRowStyle}>
                        <input
                          type="radio"
                          name="yearsTeaching"
                          value={option}
                          checked={formData.yearsTeaching === option}
                          onChange={(e) => update('yearsTeaching', e.target.value)}
                          disabled={disabled}
                          required
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              </div>
            </fieldset>

            <Rule />

            {/* ── The workshop ───────────────────────────────────────────── */}
            <fieldset style={fieldsetStyle}>
              <legend style={sectionHeadingStyle}>The workshop</legend>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {/* Q1 — NPS */}
                <fieldset style={fieldsetStyle}>
                  <legend style={labelStyle}>
                    1. On a scale of 1–10, how likely are you to recommend this workshop to another Pilates instructor?
                  </legend>
                  <div
                    className="nps-row"
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '0.5rem',
                      marginTop: '0.5rem',
                    }}
                  >
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
                      const selected = String(formData.nps) === String(n)
                      return (
                        <label
                          key={n}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minWidth: '2.5rem',
                            padding: '0.55rem 0.75rem',
                            border: `1px solid ${selected ? 'var(--color-accent)' : 'var(--color-rule)'}`,
                            background: selected ? 'var(--color-accent)' : 'var(--color-bg)',
                            color: selected ? '#1C1A17' : 'var(--color-ink)',
                            cursor: 'pointer',
                            fontSize: '0.95rem',
                            fontWeight: '500',
                            userSelect: 'none',
                          }}
                        >
                          <input
                            type="radio"
                            name="nps"
                            value={n}
                            checked={selected}
                            onChange={(e) => update('nps', e.target.value)}
                            disabled={disabled}
                            style={visuallyHidden}
                          />
                          {n}
                        </label>
                      )
                    })}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginTop: '0.6rem',
                      fontSize: '0.78rem',
                      color: 'var(--color-ink-muted)',
                    }}
                  >
                    <span>1 — not at all</span>
                    <span>10 — absolutely</span>
                  </div>
                </fieldset>

                {/* Q2 — change this week */}
                <div>
                  <label htmlFor="sf-change" style={labelStyle}>
                    2. What's one thing from today that's going to change how you teach this week?
                  </label>
                  <textarea
                    id="sf-change"
                    required
                    value={formData.changeThisWeek}
                    onChange={(e) => update('changeThisWeek', e.target.value)}
                    disabled={disabled}
                    maxLength={2000}
                    rows={4}
                    style={{ ...inputStyle, resize: 'vertical', fontFamily: '"DM Sans", sans-serif' }}
                  />
                </div>

                {/* Q3 — aha moment */}
                <div>
                  <label htmlFor="sf-aha" style={labelStyle}>
                    3. What was your favorite "aha" moment from the workshop?
                  </label>
                  <textarea
                    id="sf-aha"
                    required
                    value={formData.ahaMoment}
                    onChange={(e) => update('ahaMoment', e.target.value)}
                    disabled={disabled}
                    maxLength={2000}
                    rows={4}
                    style={{ ...inputStyle, resize: 'vertical', fontFamily: '"DM Sans", sans-serif' }}
                  />
                </div>

                {/* Q4 — valuable sections (multi-select) */}
                <fieldset style={fieldsetStyle}>
                  <legend style={labelStyle}>
                    4. Which section was most valuable for you? (check all that apply)
                  </legend>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                    {VALUABLE_OPTIONS.map((option) => (
                      <label key={option.value} style={optionRowStyle}>
                        <input
                          type="checkbox"
                          checked={formData.valuableSections.includes(option.value)}
                          onChange={() => toggleValuable(option.value)}
                          disabled={disabled}
                          style={{ marginTop: '0.25rem' }}
                        />
                        <span>{option.label}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>

                {/* Q5 — rushed section */}
                <fieldset style={fieldsetStyle}>
                  <legend style={labelStyle}>
                    5. Was there a section that felt rushed, or that you wanted more time with?
                  </legend>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                    {RUSHED_OPTIONS.map((option) => (
                      <label key={option} style={optionRowStyle}>
                        <input
                          type="radio"
                          name="rushedSection"
                          value={option}
                          checked={formData.rushedSection === option}
                          onChange={(e) => update('rushedSection', e.target.value)}
                          disabled={disabled}
                          required
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>

                {/* Q6 — confusing */}
                <div>
                  <label htmlFor="sf-confusing" style={labelStyle}>
                    6. Was anything confusing or that you'd want explained differently? (this is where you tell me what to fix)
                  </label>
                  <textarea
                    id="sf-confusing"
                    required
                    value={formData.confusing}
                    onChange={(e) => update('confusing', e.target.value)}
                    disabled={disabled}
                    maxLength={2000}
                    rows={4}
                    style={{ ...inputStyle, resize: 'vertical', fontFamily: '"DM Sans", sans-serif' }}
                  />
                </div>

                {/* Q7 — length feedback */}
                <fieldset style={fieldsetStyle}>
                  <legend style={labelStyle}>7. How was the overall length?</legend>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                    {LENGTH_OPTIONS.map((option) => (
                      <label key={option} style={optionRowStyle}>
                        <input
                          type="radio"
                          name="lengthFeedback"
                          value={option}
                          checked={formData.lengthFeedback === option}
                          onChange={(e) => update('lengthFeedback', e.target.value)}
                          disabled={disabled}
                          required
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>

                {/* Q8 — share permission */}
                <fieldset style={fieldsetStyle}>
                  <legend style={labelStyle}>
                    8. Can I share your feedback? I sometimes quote student feedback publicly to help other instructors decide if this workshop is for them.
                  </legend>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                    {SHARE_OPTIONS.map((option) => (
                      <label key={option} style={optionRowStyle}>
                        <input
                          type="radio"
                          name="sharePermission"
                          value={option}
                          checked={formData.sharePermission === option}
                          onChange={(e) => update('sharePermission', e.target.value)}
                          disabled={disabled}
                          required
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>

                {/* Q9 — next workshop topic (optional) */}
                <div>
                  <label htmlFor="sf-next-topic" style={labelStyle}>
                    9. What would you like to learn in the next workshop? (optional)
                  </label>
                  <textarea
                    id="sf-next-topic"
                    value={formData.nextWorkshopTopic}
                    onChange={(e) => update('nextWorkshopTopic', e.target.value)}
                    disabled={disabled}
                    maxLength={2000}
                    rows={3}
                    style={{ ...inputStyle, resize: 'vertical', fontFamily: '"DM Sans", sans-serif' }}
                  />
                </div>

                {/* Q10 — anything else (optional) */}
                <div>
                  <label htmlFor="sf-anything-else" style={labelStyle}>
                    10. Anything else you want me to know? (optional)
                  </label>
                  <textarea
                    id="sf-anything-else"
                    value={formData.anythingElse}
                    onChange={(e) => update('anythingElse', e.target.value)}
                    disabled={disabled}
                    maxLength={2000}
                    rows={3}
                    style={{ ...inputStyle, resize: 'vertical', fontFamily: '"DM Sans", sans-serif' }}
                  />
                </div>
              </div>
            </fieldset>

            {/* Honeypot */}
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
              disabled={disabled}
              style={{
                ...primaryButtonStyle,
                width: '100%',
                cursor: disabled ? 'wait' : 'pointer',
              }}
            >
              {disabled ? 'Sending…' : 'Send feedback'}
            </button>

            {status === 'error' && (
              <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#e06c75' }}>
                {errorMsg}
              </p>
            )}
          </form>
        </Section>
      </section>

      <style>{`
        @media (max-width: 700px) {
          .nps-row {
            gap: 0.3rem !important;
          }
        }
      `}</style>
    </div>
  )
}
