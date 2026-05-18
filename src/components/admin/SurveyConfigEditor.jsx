import { useEffect, useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import { QUESTION_TYPES, validateSurveyConfig } from '../../../api/_lib/survey-validation.js'

const TYPE_LABELS = {
  nps: 'NPS (1-10)',
  single_select: 'Single choice',
  multi_select: 'Multiple choice',
  short_text: 'Short text',
  long_text: 'Long text',
}

function newId() {
  const rand = Math.random().toString(36).slice(2, 8)
  const ts = Date.now().toString(36).slice(-3)
  return `q_${rand}${ts}`
}

function toLocalInput(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function fromLocalInput(value) {
  if (!value) return null
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return null
  return d.toISOString()
}

function blankQuestion(type) {
  const base = { id: newId(), type, label: '', required: true }
  if (type === 'single_select' || type === 'multi_select') {
    base.options = ['']
  }
  return base
}

const EMPTY_CONFIG = {
  enabled: false,
  opens_at: null,
  closes_at: null,
  admin_email: null,
  questions: [],
}

export default function SurveyConfigEditor({
  value,
  responseCount = 0,
  onSave,
  saving = false,
}) {
  const initial = value && typeof value === 'object' ? value : EMPTY_CONFIG
  const [form, setForm] = useState(() => normalizeForForm(initial))
  const [pendingType, setPendingType] = useState('single_select')
  const [error, setError] = useState(null)

  useEffect(() => {
    setForm(normalizeForForm(value && typeof value === 'object' ? value : EMPTY_CONFIG))
    setError(null)
  }, [value])

  const locked = responseCount > 0
  const lockedHint = locked
    ? `This workshop already has ${responseCount} response${responseCount === 1 ? '' : 's'}. You can add or rename questions, but deleting or removing options would orphan existing data.`
    : null

  const validation = useMemo(() => {
    const payload = toConfigPayload(form)
    if (!form.enabled) return { ok: true }
    return validateSurveyConfig(payload)
  }, [form])

  function patch(p) {
    setForm((prev) => ({ ...prev, ...p }))
  }

  function updateQuestion(idx, patchObj) {
    setForm((prev) => {
      const next = prev.questions.slice()
      next[idx] = { ...next[idx], ...patchObj }
      return { ...prev, questions: next }
    })
  }

  function updateOption(qIdx, oIdx, value) {
    setForm((prev) => {
      const next = prev.questions.slice()
      const opts = next[qIdx].options.slice()
      opts[oIdx] = value
      next[qIdx] = { ...next[qIdx], options: opts }
      return { ...prev, questions: next }
    })
  }

  function addOption(qIdx) {
    setForm((prev) => {
      const next = prev.questions.slice()
      next[qIdx] = { ...next[qIdx], options: [...(next[qIdx].options ?? []), ''] }
      return { ...prev, questions: next }
    })
  }

  function removeOption(qIdx, oIdx) {
    setForm((prev) => {
      const next = prev.questions.slice()
      const opts = next[qIdx].options.slice()
      opts.splice(oIdx, 1)
      next[qIdx] = { ...next[qIdx], options: opts }
      return { ...prev, questions: next }
    })
  }

  function moveUp(idx) {
    if (idx === 0) return
    setForm((prev) => {
      const next = prev.questions.slice()
      ;[next[idx - 1], next[idx]] = [next[idx], next[idx - 1]]
      return { ...prev, questions: next }
    })
  }

  function moveDown(idx) {
    setForm((prev) => {
      if (idx >= prev.questions.length - 1) return prev
      const next = prev.questions.slice()
      ;[next[idx], next[idx + 1]] = [next[idx + 1], next[idx]]
      return { ...prev, questions: next }
    })
  }

  function removeQuestion(idx) {
    setForm((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== idx),
    }))
  }

  function addQuestion() {
    setForm((prev) => ({
      ...prev,
      questions: [...prev.questions, blankQuestion(pendingType)],
    }))
  }

  async function handleSave(e) {
    e.preventDefault()
    setError(null)
    const payload = toConfigPayload(form)
    if (form.enabled) {
      const check = validateSurveyConfig(payload)
      if (check.error) {
        setError(check.error)
        return
      }
    }
    try {
      await onSave(payload)
    } catch (err) {
      setError(err.message ?? 'Save failed')
    }
  }

  return (
    <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <SectionLabel>Survey timing</SectionLabel>

      {lockedHint && (
        <p
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-rule)',
            padding: '0.75rem 1rem',
            fontSize: '0.8rem',
            color: 'var(--color-ink-muted)',
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          {lockedHint}
        </p>
      )}

      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
        <input
          type="checkbox"
          checked={form.enabled}
          onChange={(e) => patch({ enabled: e.target.checked })}
        />
        <span>Enable post-workshop survey</span>
      </label>

      <div className="pp-grid-2">
        <Field label="Opens at" hint="Local time. Usually right when the workshop wraps.">
          <input
            type="datetime-local"
            value={form.opens_at_local}
            onChange={(e) => patch({ opens_at_local: e.target.value })}
            style={inputStyle}
          />
        </Field>
        <Field label="Closes at" hint="Local time. Responses are blocked after this moment.">
          <input
            type="datetime-local"
            value={form.closes_at_local}
            onChange={(e) => patch({ closes_at_local: e.target.value })}
            style={inputStyle}
          />
        </Field>
      </div>

      <Field
        label="Notification email"
        hint="Where to send each new submission. Leave blank to fall back to the default contact address."
      >
        <input
          type="email"
          value={form.admin_email}
          onChange={(e) => patch({ admin_email: e.target.value })}
          placeholder="kaleen@pilatesphysics.com"
          style={inputStyle}
        />
      </Field>

      <SectionLabel>Questions</SectionLabel>

      {form.questions.length === 0 ? (
        <p style={{ color: 'var(--color-ink-muted)', fontSize: '0.85rem', margin: 0 }}>
          No questions yet. Add the first one below.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {form.questions.map((q, idx) => (
            <QuestionCard
              key={q.id}
              question={q}
              index={idx}
              total={form.questions.length}
              locked={locked}
              onChange={(p) => updateQuestion(idx, p)}
              onUpdateOption={(oIdx, val) => updateOption(idx, oIdx, val)}
              onAddOption={() => addOption(idx)}
              onRemoveOption={(oIdx) => removeOption(idx, oIdx)}
              onMoveUp={() => moveUp(idx)}
              onMoveDown={() => moveDown(idx)}
              onRemove={() => removeQuestion(idx)}
            />
          ))}
        </div>
      )}

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          flexWrap: 'wrap',
          padding: '1rem',
          background: 'var(--color-surface)',
          border: '1px dashed var(--color-rule)',
        }}
      >
        <select
          value={pendingType}
          onChange={(e) => setPendingType(e.target.value)}
          style={{ ...inputStyle, padding: '0.5rem 0.7rem', minWidth: '180px' }}
        >
          {QUESTION_TYPES.map((t) => (
            <option key={t} value={t}>
              {TYPE_LABELS[t]}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={addQuestion}
          style={addButtonStyle}
        >
          <Plus size={14} /> Add question
        </button>
      </div>

      {error && (
        <p style={{ color: '#ff7d7d', fontSize: '0.85rem', margin: 0 }}>{error}</p>
      )}
      {!error && form.enabled && validation.error && (
        <p style={{ color: '#ffb74d', fontSize: '0.85rem', margin: 0 }}>
          Heads up: {validation.error}
        </p>
      )}

      <div>
        <button
          type="submit"
          disabled={saving}
          style={{
            padding: '0.75rem 1.5rem',
            background: 'var(--color-accent)',
            color: 'var(--color-accent-ink)',
            border: 'none',
            cursor: saving ? 'wait' : 'pointer',
            fontSize: '0.9rem',
            fontWeight: 500,
            fontFamily: 'var(--font-serif)',
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? 'Saving...' : 'Save survey'}
        </button>
      </div>
    </form>
  )
}

function QuestionCard({
  question,
  index,
  total,
  locked,
  onChange,
  onUpdateOption,
  onAddOption,
  onRemoveOption,
  onMoveUp,
  onMoveDown,
  onRemove,
}) {
  const isSelect = question.type === 'single_select' || question.type === 'multi_select'
  return (
    <div
      style={{
        border: '1px solid var(--color-rule)',
        background: 'var(--color-surface)',
        padding: '1rem 1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.8rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
        <span
          style={{
            fontSize: '0.7rem',
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--color-ink-muted)',
          }}
        >
          Q{index + 1} — {TYPE_LABELS[question.type] ?? question.type}
        </span>
        <div style={{ marginLeft: 'auto', display: 'inline-flex', gap: '0.3rem' }}>
          <IconButton onClick={onMoveUp} disabled={index === 0} title="Move up">
            <ArrowUp size={14} />
          </IconButton>
          <IconButton onClick={onMoveDown} disabled={index === total - 1} title="Move down">
            <ArrowDown size={14} />
          </IconButton>
          <IconButton
            onClick={onRemove}
            disabled={locked}
            title={locked ? 'Cannot delete after responses exist' : 'Delete question'}
          >
            <Trash2 size={14} />
          </IconButton>
        </div>
      </div>

      <Field label="Label">
        <textarea
          value={question.label}
          onChange={(e) => onChange({ label: e.target.value })}
          rows={2}
          style={{ ...inputStyle, fontFamily: 'inherit', resize: 'vertical' }}
        />
      </Field>

      <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
        <input
          type="checkbox"
          checked={!!question.required}
          onChange={(e) => onChange({ required: e.target.checked })}
        />
        <span>Required</span>
      </label>

      {isSelect && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <span
            style={{
              fontSize: '0.7rem',
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--color-ink-muted)',
            }}
          >
            Options
          </span>
          {(question.options ?? []).map((opt, oIdx) => (
            <div key={oIdx} style={{ display: 'flex', gap: '0.4rem' }}>
              <input
                type="text"
                value={opt}
                onChange={(e) => onUpdateOption(oIdx, e.target.value)}
                style={{ ...inputStyle, flex: 1 }}
              />
              <IconButton
                onClick={() => onRemoveOption(oIdx)}
                disabled={locked || (question.options?.length ?? 0) <= 1}
                title={locked ? 'Cannot remove options after responses exist' : 'Remove option'}
              >
                <Trash2 size={14} />
              </IconButton>
            </div>
          ))}
          <button
            type="button"
            onClick={onAddOption}
            style={{
              ...addButtonStyle,
              alignSelf: 'flex-start',
              padding: '0.4rem 0.7rem',
              fontSize: '0.8rem',
            }}
          >
            <Plus size={12} /> Add option
          </button>
        </div>
      )}
    </div>
  )
}

function IconButton({ children, onClick, disabled, title }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '28px',
        height: '28px',
        background: 'transparent',
        color: disabled ? 'var(--color-ink-muted)' : 'var(--color-ink)',
        border: '1px solid var(--color-rule)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {children}
    </button>
  )
}

function SectionLabel({ children }) {
  return (
    <h3
      style={{
        fontSize: '0.7rem',
        fontWeight: 600,
        letterSpacing: '0.15em',
        textTransform: 'uppercase',
        color: 'var(--color-ink-muted)',
        margin: 0,
      }}
    >
      {children}
    </h3>
  )
}

function Field({ label, hint, children }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
      <span
        style={{
          fontSize: '0.7rem',
          fontWeight: 600,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--color-ink-muted)',
        }}
      >
        {label}
      </span>
      {children}
      {hint ? (
        <span style={{ fontSize: '0.72rem', color: 'var(--color-ink-muted)' }}>{hint}</span>
      ) : null}
    </label>
  )
}

const inputStyle = {
  padding: '0.6rem 0.75rem',
  background: 'var(--color-bg)',
  color: 'var(--color-ink)',
  border: '1px solid var(--color-rule)',
  fontSize: '0.9rem',
  fontFamily: 'var(--font-serif)',
  outline: 'none',
}

const addButtonStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.35rem',
  padding: '0.5rem 0.8rem',
  background: 'transparent',
  color: 'var(--color-ink)',
  border: '1px solid var(--color-rule)',
  cursor: 'pointer',
  fontSize: '0.85rem',
  fontFamily: 'var(--font-serif)',
}

function normalizeForForm(config) {
  const questions = Array.isArray(config?.questions)
    ? config.questions.map((q) => ({
        ...q,
        id: q.id || newId(),
        required: q.required !== false,
        options: Array.isArray(q.options) ? q.options.slice() : undefined,
      }))
    : []
  return {
    enabled: !!config?.enabled,
    opens_at_local: toLocalInput(config?.opens_at),
    closes_at_local: toLocalInput(config?.closes_at),
    admin_email: config?.admin_email ?? '',
    questions,
  }
}

function toConfigPayload(form) {
  return {
    enabled: !!form.enabled,
    opens_at: fromLocalInput(form.opens_at_local),
    closes_at: fromLocalInput(form.closes_at_local),
    admin_email: form.admin_email?.trim() || null,
    questions: form.questions.map((q) => {
      const base = {
        id: q.id,
        type: q.type,
        label: (q.label ?? '').trim(),
        required: !!q.required,
      }
      if (q.type === 'single_select' || q.type === 'multi_select') {
        base.options = (q.options ?? [])
          .map((o) => (typeof o === 'string' ? o.trim() : ''))
          .filter((o) => o.length > 0)
      }
      return base
    }),
  }
}
