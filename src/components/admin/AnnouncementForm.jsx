import { useEffect, useRef, useState } from 'react'
import AnnouncementBar from '../ui/AnnouncementBar'
import { draftBase, readDraft, writeDraft, clearDraft } from '../../lib/formDrafts'
import DraftRestoredNotice from './DraftRestoredNotice'

function toLocalInput(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const EMPTY_FORM = {
  message: '',
  link_url: '',
  link_text: '',
  starts_at: '',
  ends_at: '',
  enabled: true,
}

function formFromRow(row) {
  return {
    message: row.message ?? '',
    link_url: row.link_url ?? '',
    link_text: row.link_text ?? '',
    starts_at: toLocalInput(row.starts_at),
    ends_at: toLocalInput(row.ends_at),
    enabled: row.enabled ?? true,
  }
}

export default function AnnouncementForm({
  initial,
  onSubmit,
  submitLabel = 'Save',
  busy = false,
  // Where unsaved typing is kept: one per announcement, or 'new'. Omit to turn
  // drafts off. See src/lib/formDrafts.js.
  draftKey = null,
}) {
  const storageKey = draftKey ? `announcement:${draftKey}` : null
  const [form, setForm] = useState(EMPTY_FORM)
  const [error, setError] = useState(null)
  const [dirty, setDirty] = useState(false)
  const [restored, setRestored] = useState(false)

  // Reload the form only when the row itself changes (a different
  // announcement, or a save), not whenever the page re-renders.
  const loadedBaseRef = useRef(undefined)

  useEffect(() => {
    const base = draftBase(initial)
    if (loadedBaseRef.current === base) return
    loadedBaseRef.current = base

    const draft = readDraft(storageKey, base)
    if (draft) {
      setForm({ ...EMPTY_FORM, ...draft })
      setDirty(true)
      setRestored(true)
      return
    }

    setForm(initial ? formFromRow(initial) : EMPTY_FORM)
    setDirty(false)
    setRestored(false)
  }, [initial, storageKey])

  useEffect(() => {
    if (dirty) writeDraft(storageKey, loadedBaseRef.current, form)
  }, [storageKey, dirty, form])

  function discardDraft() {
    clearDraft(storageKey)
    setForm(initial ? formFromRow(initial) : EMPTY_FORM)
    setDirty(false)
    setRestored(false)
    setError(null)
  }

  function update(field, value) {
    setDirty(true)
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    if (!form.message.trim()) return setError('Message is required')
    if (!form.starts_at) return setError('Start date is required')
    if (form.ends_at && new Date(form.ends_at) <= new Date(form.starts_at)) {
      return setError('End date must be after start date')
    }
    const url = form.link_url.trim()
    const text = form.link_text.trim()
    if ((url && !text) || (!url && text)) {
      return setError('Link URL and Link text must both be filled, or both empty')
    }

    const payload = {
      message: form.message.trim(),
      link_url: url || null,
      link_text: text || null,
      starts_at: new Date(form.starts_at).toISOString(),
      ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
      enabled: !!form.enabled,
    }

    try {
      await onSubmit(payload)
      clearDraft(storageKey)
      setDirty(false)
      setRestored(false)
    } catch (err) {
      setError(err.message ?? 'Save failed')
    }
  }

  const now = Date.now()
  const startsDate = form.starts_at ? new Date(form.starts_at) : null
  const endsDate = form.ends_at ? new Date(form.ends_at) : null
  const isFuture = startsDate && startsDate.getTime() > now
  const isExpired = endsDate && endsDate.getTime() <= now
  const previewAnnouncement = {
    message: form.message,
    link_url: form.link_url.trim() || null,
    link_text: form.link_text.trim() || null,
  }

  let statusNote = null
  if (!form.enabled) {
    statusNote = 'Currently disabled — bar will not appear on the site.'
  } else if (isFuture) {
    statusNote = endsDate
      ? `Will appear at ${startsDate.toLocaleString()} and hide at ${endsDate.toLocaleString()}.`
      : `Will appear at ${startsDate.toLocaleString()}.`
  } else if (isExpired) {
    statusNote = `Expired at ${endsDate.toLocaleString()} — bar no longer shows.`
  } else if (endsDate) {
    statusNote = `Will hide at ${endsDate.toLocaleString()}.`
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            gap: '0.75rem',
            flexWrap: 'wrap',
          }}
        >
          <span
            style={{
              fontSize: '0.7rem',
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--color-ink-muted)',
            }}
          >
            Preview
          </span>
          {statusNote && (
            <span style={{ fontSize: '0.72rem', color: 'var(--color-ink-muted)' }}>{statusNote}</span>
          )}
        </div>
        {form.message.trim() ? (
          <AnnouncementBar variant="preview" announcement={previewAnnouncement} />
        ) : (
          <div
            style={{
              height: '2.5rem',
              width: '100%',
              border: '1px dashed var(--color-rule)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.78rem',
              color: 'var(--color-ink-muted)',
              fontFamily: 'var(--font-serif)',
            }}
          >
            Type a message below to see the preview
          </div>
        )}
        <span style={{ fontSize: '0.72rem', color: 'var(--color-ink-muted)' }}>
          This is how the bar will appear on the site.
        </span>
      </div>

      <Field label="Message *">
        <textarea
          value={form.message}
          onChange={(e) => update('message', e.target.value)}
          style={{ ...inputStyle, minHeight: '80px', resize: 'vertical', fontFamily: 'inherit' }}
          rows={3}
          required
        />
      </Field>

      <Row>
        <Field label="Link URL" hint="Optional. Internal route (/workshops) or external (https://…)">
          <input
            type="text"
            value={form.link_url}
            onChange={(e) => update('link_url', e.target.value)}
            style={inputStyle}
          />
        </Field>
        <Field label="Link text" hint="Optional. Required if Link URL is set.">
          <input
            type="text"
            value={form.link_text}
            onChange={(e) => update('link_text', e.target.value)}
            style={inputStyle}
          />
        </Field>
      </Row>

      <Row>
        <Field label="Starts at *" hint="Local time. Bar shows once this passes.">
          <input
            type="datetime-local"
            value={form.starts_at}
            onChange={(e) => update('starts_at', e.target.value)}
            style={inputStyle}
            required
          />
        </Field>
        <Field
          label="Ends at"
          hint="Optional. Local time. Bar hides once this passes, even with no replacement scheduled."
        >
          <input
            type="datetime-local"
            value={form.ends_at}
            onChange={(e) => update('ends_at', e.target.value)}
            style={inputStyle}
          />
        </Field>
      </Row>

      <Field label="Enabled" hint="Uncheck to hide this announcement without deleting it.">
        <label
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.6rem 0',
            fontSize: '0.9rem',
            color: 'var(--color-ink)',
          }}
        >
          <input
            type="checkbox"
            checked={form.enabled}
            onChange={(e) => update('enabled', e.target.checked)}
          />
          <span>Enabled</span>
        </label>
      </Field>

      {restored && dirty && <DraftRestoredNotice onDiscard={discardDraft} />}

      {error && (
        <p style={{ color: '#ff7d7d', fontSize: '0.85rem', margin: 0 }}>{error}</p>
      )}

      <div>
        <button
          type="submit"
          disabled={busy}
          style={{
            padding: '0.75rem 1.5rem',
            background: 'var(--color-accent)',
            color: 'var(--color-accent-ink)',
            border: 'none',
            cursor: busy ? 'wait' : 'pointer',
            fontSize: '0.9rem',
            fontWeight: 500,
            fontFamily: 'var(--font-serif)',
            opacity: busy ? 0.7 : 1,
          }}
        >
          {busy ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  )
}

function Row({ children }) {
  return <div className="pp-grid-2">{children}</div>
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
