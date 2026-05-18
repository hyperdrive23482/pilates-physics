import { useState } from 'react'

const YEARS_OPTIONS = [
  "I'm not an instructor",
  'I am in teacher training',
  '<1 year',
  '1-3 years',
  '4-9 years',
  '10+ years',
]
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
  fontFamily: 'var(--font-serif)',
  background: 'var(--color-accent)',
  color: 'var(--color-accent-ink)',
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
  fontFamily: 'var(--font-serif)',
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
  fontFamily: 'var(--font-serif)',
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

/**
 * Workshop feedback form body. The page wraps it with hero + section chrome and
 * supplies an `onSubmit` that performs the actual network call (the form is
 * agnostic to auth / API specifics). When `showNameEmail` is false, the page is
 * expected to supply identity from the auth context.
 */
export default function WorkshopFeedbackForm({
  showNameEmail = true,
  onSubmit,
  onSuccess,
  submitLabel = 'Send feedback',
}) {
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
      const payload = {
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
      }
      if (showNameEmail) {
        payload.name = formData.name
        payload.email = formData.email
      }
      await onSubmit(payload)
      setStatus('success')
      if (onSuccess) onSuccess()
    } catch (err) {
      setErrorMsg(err.message || 'Something went wrong. Try again.')
      setStatus('error')
    }
  }

  const disabled = status === 'loading'

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      {/* ── About you ──────────────────────────────────────────────── */}
      <fieldset style={fieldsetStyle}>
        <legend style={sectionHeadingStyle}>About you</legend>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {showNameEmail && (
            <>
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
            </>
          )}

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

      <hr style={{ border: 'none', borderTop: '1px solid var(--color-rule)', margin: 0 }} />

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
                      color: selected ? 'var(--color-accent-ink)' : 'var(--color-ink)',
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
              style={{ ...inputStyle, resize: 'vertical', fontFamily: 'var(--font-serif)' }}
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
              style={{ ...inputStyle, resize: 'vertical', fontFamily: 'var(--font-serif)' }}
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
              style={{ ...inputStyle, resize: 'vertical', fontFamily: 'var(--font-serif)' }}
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
              style={{ ...inputStyle, resize: 'vertical', fontFamily: 'var(--font-serif)' }}
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
              style={{ ...inputStyle, resize: 'vertical', fontFamily: 'var(--font-serif)' }}
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
        {disabled ? 'Sending…' : submitLabel}
      </button>

      {status === 'error' && (
        <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#e06c75' }}>
          {errorMsg}
        </p>
      )}

      <style>{`
        @media (max-width: 700px) {
          .nps-row {
            gap: 0.3rem !important;
          }
        }
      `}</style>
    </form>
  )
}
