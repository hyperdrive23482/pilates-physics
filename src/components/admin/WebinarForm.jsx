import { useState, useEffect } from 'react'

const STATUSES = ['draft', 'upcoming', 'live', 'complete', 'archived']

function slugify(s) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Convert a Date -> value for <input type="datetime-local"> in LOCAL time.
function toLocalInput(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function WebinarForm({
  initial,
  onSubmit,
  submitLabel = 'Save',
  busy = false,
  webinars = [],
  onBackfill,
  backfilling = false,
}) {
  const [form, setForm] = useState({
    title: '',
    slug: '',
    subtitle: '',
    description: '',
    price_cents: '',
    status: 'draft',
    zoom_link: '',
    zoom_passcode: '',
    scheduled_at: '',
    duration_min: '',
    recording_url: '',
    hero_image_url: '',
    kit_tag: '',
    stripe_price_id: '',
    bonus_webinar_id: '',
    bonus_starts_at: '',
    bonus_ends_at: '',
  })
  const [slugTouched, setSlugTouched] = useState(false)
  const [error, setError] = useState(null)
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    if (!initial) return
    setForm({
      title: initial.title ?? '',
      slug: initial.slug ?? '',
      subtitle: initial.subtitle ?? '',
      description: initial.description ?? '',
      price_cents: initial.price_cents ?? '',
      status: initial.status ?? 'draft',
      zoom_link: initial.zoom_link ?? '',
      zoom_passcode: initial.zoom_passcode ?? '',
      scheduled_at: toLocalInput(initial.scheduled_at),
      duration_min: initial.duration_min ?? '',
      recording_url: initial.recording_url ?? '',
      hero_image_url: initial.hero_image_url ?? '',
      kit_tag: initial.kit_tag ?? '',
      stripe_price_id: initial.stripe_price_id ?? '',
      bonus_webinar_id: initial.bonus_webinar_id ?? '',
      bonus_starts_at: toLocalInput(initial.bonus_starts_at),
      bonus_ends_at: toLocalInput(initial.bonus_ends_at),
    })
    setSlugTouched(true)
    setDirty(false)
  }, [initial])

  function update(field, value) {
    setDirty(true)
    setForm((f) => {
      const next = { ...f, [field]: value }
      if (field === 'title' && !slugTouched) next.slug = slugify(value)
      return next
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    if (!form.title.trim()) return setError('Title is required')
    if (!form.slug.trim()) return setError('Slug is required')

    const bonusFieldsSet = [form.bonus_webinar_id, form.bonus_starts_at, form.bonus_ends_at].filter(
      (v) => v !== '' && v != null,
    ).length
    if (bonusFieldsSet > 0 && bonusFieldsSet < 3) {
      return setError('Bonus requires all three fields: tool, start date, and end date')
    }
    if (form.bonus_starts_at && form.bonus_ends_at) {
      if (new Date(form.bonus_ends_at) <= new Date(form.bonus_starts_at)) {
        return setError('Bonus end date must be after start date')
      }
    }

    const payload = {
      title: form.title.trim(),
      slug: form.slug.trim(),
      subtitle: form.subtitle.trim() || null,
      description: form.description.trim() || null,
      price_cents: form.price_cents === '' ? null : Number(form.price_cents),
      status: form.status,
      zoom_link: form.zoom_link.trim() || null,
      zoom_passcode: form.zoom_passcode.trim() || null,
      scheduled_at: form.scheduled_at ? new Date(form.scheduled_at).toISOString() : null,
      duration_min: form.duration_min === '' ? null : Number(form.duration_min),
      recording_url: form.recording_url.trim() || null,
      hero_image_url: form.hero_image_url.trim() || null,
      kit_tag: form.kit_tag.trim() || null,
      stripe_price_id: form.stripe_price_id.trim() || null,
      bonus_webinar_id: form.bonus_webinar_id || null,
      bonus_starts_at: form.bonus_starts_at ? new Date(form.bonus_starts_at).toISOString() : null,
      bonus_ends_at: form.bonus_ends_at ? new Date(form.bonus_ends_at).toISOString() : null,
    }

    try {
      await onSubmit(payload)
      setDirty(false)
    } catch (err) {
      setError(err.message ?? 'Save failed')
    }
  }

  const bonusComplete =
    !!form.bonus_webinar_id && !!form.bonus_starts_at && !!form.bonus_ends_at
  const canBackfill = !!onBackfill && bonusComplete && !dirty && !busy && !backfilling

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <Row>
        <Field label="Title *">
          <input
            type="text"
            value={form.title}
            onChange={(e) => update('title', e.target.value)}
            style={inputStyle}
            required
          />
        </Field>
        <Field label="Slug *" hint="URL path: /workshops/{slug}">
          <input
            type="text"
            value={form.slug}
            onChange={(e) => {
              setSlugTouched(true)
              update('slug', e.target.value)
            }}
            style={inputStyle}
            required
          />
        </Field>
      </Row>

      <Field label="Subtitle">
        <input
          type="text"
          value={form.subtitle}
          onChange={(e) => update('subtitle', e.target.value)}
          style={inputStyle}
        />
      </Field>

      <Field label="Description">
        <textarea
          value={form.description}
          onChange={(e) => update('description', e.target.value)}
          style={{ ...inputStyle, minHeight: '120px', resize: 'vertical', fontFamily: 'inherit' }}
          rows={5}
        />
      </Field>

      <Row>
        <Field label="Status">
          <select
            value={form.status}
            onChange={(e) => update('status', e.target.value)}
            style={inputStyle}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Price (cents)" hint="e.g. 4900 = $49.00">
          <input
            type="number"
            min="0"
            value={form.price_cents}
            onChange={(e) => update('price_cents', e.target.value)}
            style={inputStyle}
          />
        </Field>
      </Row>

      <Row>
        <Field label="Scheduled at" hint="Local time">
          <input
            type="datetime-local"
            value={form.scheduled_at}
            onChange={(e) => update('scheduled_at', e.target.value)}
            style={inputStyle}
          />
        </Field>
        <Field label="Duration (min)">
          <input
            type="number"
            min="0"
            value={form.duration_min}
            onChange={(e) => update('duration_min', e.target.value)}
            style={inputStyle}
          />
        </Field>
      </Row>

      <Row>
        <Field label="Zoom link">
          <input
            type="text"
            value={form.zoom_link}
            onChange={(e) => update('zoom_link', e.target.value)}
            style={inputStyle}
          />
        </Field>
        <Field label="Zoom passcode">
          <input
            type="text"
            value={form.zoom_passcode}
            onChange={(e) => update('zoom_passcode', e.target.value)}
            style={inputStyle}
          />
        </Field>
      </Row>

      <Row>
        <Field label="Recording URL">
          <input
            type="text"
            value={form.recording_url}
            onChange={(e) => update('recording_url', e.target.value)}
            style={inputStyle}
          />
        </Field>
        <Field label="Hero image URL">
          <input
            type="text"
            value={form.hero_image_url}
            onChange={(e) => update('hero_image_url', e.target.value)}
            style={inputStyle}
          />
        </Field>
      </Row>

      <Row>
        <Field label="Kit tag" hint="Kit.com tag granting access">
          <input
            type="text"
            value={form.kit_tag}
            onChange={(e) => update('kit_tag', e.target.value)}
            style={inputStyle}
          />
        </Field>
        <Field label="Stripe price ID" hint="e.g. price_...">
          <input
            type="text"
            value={form.stripe_price_id}
            onChange={(e) => update('stripe_price_id', e.target.value)}
            style={inputStyle}
          />
        </Field>
      </Row>

      <details
        style={{
          border: '1px solid var(--color-rule)',
          padding: '1rem 1.25rem',
          background: 'var(--color-surface)',
        }}
      >
        <summary
          style={{
            cursor: 'pointer',
            fontSize: '0.85rem',
            fontWeight: 500,
            color: 'var(--color-ink)',
            fontFamily: '"DM Sans", sans-serif',
          }}
        >
          Early registration bonus
        </summary>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
          <Field
            label="Bonus tool / webinar"
            hint="Auto-granted to anyone who buys this webinar via Stripe inside the window below"
          >
            <select
              value={form.bonus_webinar_id}
              onChange={(e) => update('bonus_webinar_id', e.target.value)}
              style={inputStyle}
            >
              <option value="">None</option>
              {webinars.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.title} ({w.kind})
                </option>
              ))}
            </select>
          </Field>
          <Row>
            <Field label="Bonus starts at" hint="Local time">
              <input
                type="datetime-local"
                value={form.bonus_starts_at}
                onChange={(e) => update('bonus_starts_at', e.target.value)}
                style={inputStyle}
              />
            </Field>
            <Field label="Bonus ends at" hint="Local time">
              <input
                type="datetime-local"
                value={form.bonus_ends_at}
                onChange={(e) => update('bonus_ends_at', e.target.value)}
                style={inputStyle}
              />
            </Field>
          </Row>
          {onBackfill && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <button
                type="button"
                disabled={!canBackfill}
                onClick={() => onBackfill()}
                style={{
                  alignSelf: 'flex-start',
                  padding: '0.6rem 1.1rem',
                  background: 'transparent',
                  color: 'var(--color-ink)',
                  border: '1px solid var(--color-rule)',
                  cursor: canBackfill ? 'pointer' : 'not-allowed',
                  fontSize: '0.85rem',
                  fontFamily: '"DM Sans", sans-serif',
                  opacity: canBackfill ? 1 : 0.5,
                }}
              >
                {backfilling ? 'Backfilling…' : 'Backfill bonus to past buyers'}
              </button>
              <span style={{ fontSize: '0.72rem', color: 'var(--color-ink-muted)' }}>
                {dirty
                  ? 'Save changes first to enable backfill.'
                  : !bonusComplete
                  ? 'Set tool, start, and end before backfilling.'
                  : 'Grants the bonus to anyone who already purchased inside the window. Idempotent.'}
              </span>
            </div>
          )}
        </div>
      </details>

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
            color: '#1C1A17',
            border: 'none',
            cursor: busy ? 'wait' : 'pointer',
            fontSize: '0.9rem',
            fontWeight: 500,
            fontFamily: '"DM Sans", sans-serif',
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
  fontFamily: '"DM Sans", sans-serif',
  outline: 'none',
}
