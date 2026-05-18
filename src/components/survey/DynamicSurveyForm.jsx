import { useState } from 'react'

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

const fieldsetStyle = { border: 'none', padding: 0, margin: 0 }

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

function initialResponseValue(question) {
  if (question.type === 'multi_select') return []
  return ''
}

export default function DynamicSurveyForm({
  surveyConfig,
  showNameEmail = true,
  onSubmit,
  onSuccess,
  submitLabel = 'Send feedback',
}) {
  const questions = surveyConfig?.questions ?? []
  const [responses, setResponses] = useState(() => {
    const init = {}
    for (const q of questions) init[q.id] = initialResponseValue(q)
    return init
  })
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [website, setWebsite] = useState('')
  const [status, setStatus] = useState('idle')
  const [errorMsg, setErrorMsg] = useState('')

  function update(qid, value) {
    setResponses((prev) => ({ ...prev, [qid]: value }))
  }

  function toggleMulti(qid, option) {
    setResponses((prev) => {
      const current = Array.isArray(prev[qid]) ? prev[qid] : []
      const next = current.includes(option)
        ? current.filter((v) => v !== option)
        : [...current, option]
      return { ...prev, [qid]: next }
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setErrorMsg('')

    for (const q of questions) {
      if (!q.required) continue
      const v = responses[q.id]
      const empty =
        v == null ||
        (typeof v === 'string' && v.trim() === '') ||
        (Array.isArray(v) && v.length === 0)
      if (empty) {
        setErrorMsg(`Please answer: ${q.label}`)
        setStatus('error')
        return
      }
    }

    setStatus('loading')
    try {
      const payload = { responses, website }
      if (showNameEmail) {
        payload.name = name
        payload.email = email
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
      {showNameEmail && (
        <fieldset style={fieldsetStyle}>
          <legend style={sectionHeadingStyle}>About you</legend>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label htmlFor="sf-name" style={labelStyle}>Name</label>
              <input
                id="sf-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={disabled}
                maxLength={200}
                style={inputStyle}
              />
            </div>
            <div>
              <label htmlFor="sf-email" style={labelStyle}>Email</label>
              <input
                id="sf-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={disabled}
                maxLength={320}
                style={inputStyle}
              />
            </div>
          </div>
        </fieldset>
      )}

      {showNameEmail && questions.length > 0 && (
        <hr style={{ border: 'none', borderTop: '1px solid var(--color-rule)', margin: 0 }} />
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {questions.map((q) => (
          <QuestionView
            key={q.id}
            question={q}
            value={responses[q.id]}
            onChange={(v) => update(q.id, v)}
            onToggleMulti={(opt) => toggleMulti(q.id, opt)}
            disabled={disabled}
          />
        ))}
      </div>

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
        {disabled ? 'Sending...' : submitLabel}
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

function QuestionView({ question, value, onChange, onToggleMulti, disabled }) {
  switch (question.type) {
    case 'nps':
      return <NpsQuestion question={question} value={value} onChange={onChange} disabled={disabled} />
    case 'single_select':
      return <SingleSelectQuestion question={question} value={value} onChange={onChange} disabled={disabled} />
    case 'multi_select':
      return <MultiSelectQuestion question={question} value={value} onToggleMulti={onToggleMulti} disabled={disabled} />
    case 'short_text':
      return <ShortTextQuestion question={question} value={value} onChange={onChange} disabled={disabled} />
    case 'long_text':
      return <LongTextQuestion question={question} value={value} onChange={onChange} disabled={disabled} />
    default:
      return null
  }
}

function NpsQuestion({ question, value, onChange, disabled }) {
  return (
    <fieldset style={fieldsetStyle}>
      <legend style={labelStyle}>{question.label}</legend>
      <div
        className="nps-row"
        style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}
      >
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
          const selected = String(value) === String(n)
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
                name={question.id}
                value={n}
                checked={selected}
                onChange={() => onChange(n)}
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
        <span>1, not at all</span>
        <span>10, absolutely</span>
      </div>
    </fieldset>
  )
}

function SingleSelectQuestion({ question, value, onChange, disabled }) {
  return (
    <fieldset style={fieldsetStyle}>
      <legend style={labelStyle}>{question.label}</legend>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
        {(question.options ?? []).map((option) => (
          <label key={option} style={optionRowStyle}>
            <input
              type="radio"
              name={question.id}
              value={option}
              checked={value === option}
              onChange={(e) => onChange(e.target.value)}
              disabled={disabled}
              required={question.required}
            />
            <span>{option}</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}

function MultiSelectQuestion({ question, value, onToggleMulti, disabled }) {
  const arr = Array.isArray(value) ? value : []
  return (
    <fieldset style={fieldsetStyle}>
      <legend style={labelStyle}>{question.label}</legend>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
        {(question.options ?? []).map((option) => (
          <label key={option} style={optionRowStyle}>
            <input
              type="checkbox"
              checked={arr.includes(option)}
              onChange={() => onToggleMulti(option)}
              disabled={disabled}
              style={{ marginTop: '0.25rem' }}
            />
            <span>{option}</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}

function ShortTextQuestion({ question, value, onChange, disabled }) {
  return (
    <div>
      <label htmlFor={question.id} style={labelStyle}>{question.label}</label>
      <input
        id={question.id}
        type="text"
        required={question.required}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        maxLength={200}
        style={inputStyle}
      />
    </div>
  )
}

function LongTextQuestion({ question, value, onChange, disabled }) {
  return (
    <div>
      <label htmlFor={question.id} style={labelStyle}>{question.label}</label>
      <textarea
        id={question.id}
        required={question.required}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        maxLength={2000}
        rows={4}
        style={{ ...inputStyle, resize: 'vertical', fontFamily: 'var(--font-serif)' }}
      />
    </div>
  )
}
