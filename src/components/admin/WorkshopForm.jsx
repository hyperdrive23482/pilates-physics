import { useState, useEffect } from 'react'

const STATUSES = ['draft', 'upcoming', 'live', 'awaiting_recording', 'complete', 'archived']

// What a row IS, which decides how the portal renders it. Until this selector
// existed every row created here took the column default of 'webinar', which
// is why tools, resources and the first course all had to arrive by migration.
const KINDS = [
  { value: 'webinar', label: 'Workshop (live, on Zoom)' },
  { value: 'course', label: 'Course (on demand, in the portal)' },
  { value: 'tool', label: 'Tool (interactive, in the portal)' },
  { value: 'resource', label: 'Resource (reading material)' },
]

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

export default function WorkshopForm({
  initial,
  onSubmit,
  submitLabel = 'Save',
  busy = false,
  workshops = [],
  onBackfill,
  backfilling = false,
  // Total runtime of the course's modules, from the Curriculum tab. Null for
  // anything that is not a course, or before the curriculum exists.
  derivedDurationMin = null,
  // The kind is locked once a row exists: changing it on a live product moves
  // it between portal renderers and orphans whatever the old one relied on.
  lockKind = false,
}) {
  const [form, setForm] = useState({
    title: '',
    slug: '',
    subtitle: '',
    description: '',
    price_cents: '',
    kind: 'webinar',
    quiz_pass_pct: 80,
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
    npcp_cecs: '',
    npcp_course_id: '',
    npcp_approval_date: '',
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
      kind: initial.kind ?? 'webinar',
      quiz_pass_pct: initial.quiz_pass_pct ?? 80,
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
      npcp_cecs: initial.npcp_cecs ?? '',
      npcp_course_id: initial.npcp_course_id ?? '',
      npcp_approval_date: initial.npcp_approval_date ?? '',
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

    const isCourse = form.kind === 'course'

    const payload = {
      title: form.title.trim(),
      slug: form.slug.trim(),
      subtitle: form.subtitle.trim() || null,
      description: form.description.trim() || null,
      price_cents: form.price_cents === '' ? null : Number(form.price_cents),
      kind: form.kind,
      quiz_pass_pct: Number(form.quiz_pass_pct) || 80,
      status: form.status,
      // A course has no event, so the Zoom and recording fields are not just
      // hidden below, they are actively cleared. Otherwise switching a row to
      // a course leaves a stale Zoom link behind that nothing ever shows and
      // nobody remembers to remove.
      zoom_link: isCourse ? null : form.zoom_link.trim() || null,
      zoom_passcode: isCourse ? null : form.zoom_passcode.trim() || null,
      scheduled_at: isCourse
        ? null
        : form.scheduled_at
        ? new Date(form.scheduled_at).toISOString()
        : null,
      // For a course the runtime is the sum of its modules, so the certificate
      // can never disagree with the curriculum. Falls back to whatever was
      // typed while the curriculum is still empty.
      duration_min:
        isCourse && derivedDurationMin != null && derivedDurationMin > 0
          ? derivedDurationMin
          : form.duration_min === ''
          ? null
          : Number(form.duration_min),
      recording_url: isCourse ? null : form.recording_url.trim() || null,
      hero_image_url: form.hero_image_url.trim() || null,
      kit_tag: form.kit_tag.trim() || null,
      stripe_price_id: form.stripe_price_id.trim() || null,
      bonus_webinar_id: form.bonus_webinar_id || null,
      bonus_starts_at: form.bonus_starts_at ? new Date(form.bonus_starts_at).toISOString() : null,
      bonus_ends_at: form.bonus_ends_at ? new Date(form.bonus_ends_at).toISOString() : null,
      npcp_cecs: form.npcp_cecs === '' ? null : Number(form.npcp_cecs),
      npcp_course_id: form.npcp_course_id.trim() || null,
      npcp_approval_date: form.npcp_approval_date || null,
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

  const isCourse = form.kind === 'course'
  const isEvent = form.kind === 'webinar'
  const usesDerivedDuration = isCourse && derivedDurationMin != null && derivedDurationMin > 0

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <Row>
        <Field
          label="Type *"
          hint={
            lockKind
              ? 'Fixed once the row exists. Changing it would move the product between portal renderers.'
              : 'Decides how the portal delivers it. Cannot be changed later.'
          }
        >
          <select
            value={form.kind}
            onChange={(e) => update('kind', e.target.value)}
            disabled={lockKind}
            style={{ ...inputStyle, opacity: lockKind ? 0.6 : 1 }}
          >
            {KINDS.map((k) => (
              <option key={k.value} value={k.value}>
                {k.label}
              </option>
            ))}
          </select>
        </Field>
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
      </Row>

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
        <Field
          label="Slug *"
          hint="URL identifier. Prefix with PP-101- or PP-102- to link to that landing page."
          tooltip={
            <>
              <strong style={{ display: 'block', marginBottom: '0.4rem' }}>
                Linking to a landing page
              </strong>
              Begin the slug with a series prefix and that page features it as the
              next upcoming workshop:
              <span style={{ display: 'block', marginTop: '0.35rem' }}>
                • <code>PP-101-…</code> → Pilates Physics 101
              </span>
              <span style={{ display: 'block' }}>
                • <code>PP-102-…</code> → Pilates Physics 102
              </span>
              <span style={{ display: 'block', marginBottom: '0.4rem' }}>
                • <code>PP-201-…</code> → Pilates Physics 201 (once that page is live)
              </span>
              Example: <code>PP-101-Aug-2026</code>. Any other slug appears on the
              generic workshops page.
            </>
          }
        >
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
        <Field label="Price (cents)" hint="e.g. 4900 = $49.00">
          <input
            type="number"
            min="0"
            value={form.price_cents}
            onChange={(e) => update('price_cents', e.target.value)}
            style={inputStyle}
          />
        </Field>
        {isCourse ? (
          <Field
            label="Quiz pass mark (%)"
            hint="The share of questions needed to pass and earn the certificate."
          >
            <input
              type="number"
              min="1"
              max="100"
              value={form.quiz_pass_pct}
              onChange={(e) => update('quiz_pass_pct', e.target.value)}
              style={inputStyle}
            />
          </Field>
        ) : (
          <Field label="Duration (min)">
            <input
              type="number"
              min="0"
              value={form.duration_min}
              onChange={(e) => update('duration_min', e.target.value)}
              style={inputStyle}
            />
          </Field>
        )}
      </Row>

      {/* A course has no date, no Zoom room and no replay. Those fields are
          hidden rather than left blank, because a stale Zoom link on a product
          that never meets is worse than no field at all. */}
      {!isCourse && (
        <>
          <Row>
            <Field label="Scheduled at" hint="Local time">
              <input
                type="datetime-local"
                value={form.scheduled_at}
                onChange={(e) => update('scheduled_at', e.target.value)}
                style={inputStyle}
              />
            </Field>
            <Field label="Recording URL">
              <input
                type="text"
                value={form.recording_url}
                onChange={(e) => update('recording_url', e.target.value)}
                style={inputStyle}
              />
            </Field>
          </Row>

          {isEvent && (
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
          )}
        </>
      )}

      <Row>
        {isCourse ? (
          <Field
            label="Total runtime (min)"
            hint={
              usesDerivedDuration
                ? 'Added up from the module runtimes on the Curriculum tab, and saved with the course. This is the figure printed on the certificate.'
                : 'Will be added up from the module runtimes once the curriculum has them. Typed value used until then.'
            }
          >
            <input
              type="number"
              min="0"
              value={usesDerivedDuration ? derivedDurationMin : form.duration_min}
              onChange={(e) => update('duration_min', e.target.value)}
              readOnly={usesDerivedDuration}
              style={{
                ...inputStyle,
                opacity: usesDerivedDuration ? 0.6 : 1,
                cursor: usesDerivedDuration ? 'not-allowed' : 'text',
              }}
            />
          </Field>
        ) : null}
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
            fontFamily: 'var(--font-serif)',
          }}
        >
          NPCP certificate info
        </summary>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
          <Row>
            <Field label="NPCP CECs" hint="e.g. 2.0">
              <input
                type="number"
                min="0"
                step="0.5"
                value={form.npcp_cecs}
                onChange={(e) => update('npcp_cecs', e.target.value)}
                style={inputStyle}
              />
            </Field>
            <Field label="NPCP Course ID" hint="e.g. 20245-9648">
              <input
                type="text"
                value={form.npcp_course_id}
                onChange={(e) => update('npcp_course_id', e.target.value)}
                style={inputStyle}
              />
            </Field>
          </Row>
          <Field label="Course approval date">
            <input
              type="date"
              value={form.npcp_approval_date}
              onChange={(e) => update('npcp_approval_date', e.target.value)}
              style={inputStyle}
            />
          </Field>
          <span style={{ fontSize: '0.72rem', color: 'var(--color-ink-muted)' }}>
            Filling any of these fields adds an NPCP attribution row to the certificate PDF.
          </span>
        </div>
      </details>

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
            fontFamily: 'var(--font-serif)',
          }}
        >
          Early registration bonus
        </summary>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
          <Field
            label="Bonus tool / workshop"
            hint="Auto-granted to anyone who buys this workshop via Stripe inside the window below"
          >
            <select
              value={form.bonus_webinar_id}
              onChange={(e) => update('bonus_webinar_id', e.target.value)}
              style={inputStyle}
            >
              <option value="">None</option>
              {workshops.map((w) => (
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
                  fontFamily: 'var(--font-serif)',
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

function Field({ label, hint, tooltip, children }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          fontSize: '0.7rem',
          fontWeight: 600,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--color-ink-muted)',
        }}
      >
        {label}
        {tooltip ? <InfoTip>{tooltip}</InfoTip> : null}
      </span>
      {children}
      {hint ? (
        <span style={{ fontSize: '0.72rem', color: 'var(--color-ink-muted)' }}>{hint}</span>
      ) : null}
    </label>
  )
}

// Small hover tooltip for field labels. Anchored to the right of the icon so it
// extends left into the form (avoids overflowing the right edge on the second
// grid column). Hover-only, which is fine for an internal admin tool.
function InfoTip({ children }) {
  const [show, setShow] = useState(false)
  return (
    <span
      style={{ position: 'relative', display: 'inline-flex', marginLeft: '0.4rem' }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <span
        aria-hidden="true"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '15px',
          height: '15px',
          borderRadius: '50%',
          border: '1px solid var(--color-ink-muted)',
          fontFamily: 'Georgia, serif',
          fontStyle: 'italic',
          fontWeight: 700,
          fontSize: '0.62rem',
          lineHeight: 1,
          letterSpacing: 0,
          textTransform: 'none',
          cursor: 'help',
        }}
      >
        i
      </span>
      {show ? (
        <span
          role="tooltip"
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 8px)',
            right: 0,
            zIndex: 30,
            width: '260px',
            padding: '0.65rem 0.8rem',
            background: 'var(--color-surface)',
            color: 'var(--color-ink)',
            border: '1px solid var(--color-rule)',
            boxShadow: '0 6px 20px rgba(0, 0, 0, 0.28)',
            fontFamily: 'var(--font-serif)',
            fontWeight: 400,
            fontSize: '0.72rem',
            lineHeight: 1.55,
            letterSpacing: 0,
            textTransform: 'none',
            whiteSpace: 'normal',
          }}
        >
          {children}
        </span>
      ) : null}
    </span>
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
