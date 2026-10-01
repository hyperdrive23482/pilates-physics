import { useEffect, useState, useCallback } from 'react'
import { useEnrollment } from '../../hooks/useEnrollment'
import { useAdminAPI } from '../../hooks/admin/useAdminAPI'
import AdminNav from '../../components/admin/AdminNav'
import StatCard from '../../components/admin/StatCard'
import { COURSE_OPTIONS, STAGE_OPTIONS } from '../../lib/scholarship'

// Review scholarship applications, mint and email codes, and see how the
// program is doing. Server side lives in api/admin/scholarships.js.

const COURSE_LABEL = Object.fromEntries(COURSE_OPTIONS.map((c) => [c.value, c.label]))
const STAGE_LABEL = Object.fromEntries(STAGE_OPTIONS.map((s) => [s.value, s.label]))
const FILTERS = ['pending', 'approved', 'declined', 'all']

function formatCents(cents) {
  return `$${((cents ?? 0) / 100).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}

function formatDate(iso) {
  return iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''
}

function codeState(code) {
  if (code.redeemed_at) return `redeemed ${formatDate(code.redeemed_at)}`
  if (new Date(code.expires_at) <= new Date()) return 'expired'
  return `live until ${formatDate(code.expires_at)}`
}

const sectionLabel = {
  fontSize: '0.65rem',
  fontWeight: 600,
  letterSpacing: '0.15em',
  textTransform: 'uppercase',
  color: 'var(--color-ink-muted)',
  margin: '1rem 0 0.4rem',
}

const noteBox = {
  width: '100%',
  padding: '0.5rem 0.75rem',
  background: 'var(--color-bg)',
  color: 'var(--color-ink)',
  border: '1px solid var(--color-rule)',
  fontFamily: 'var(--font-serif)',
  fontSize: '0.85rem',
  boxSizing: 'border-box',
}

const answerBox = {
  whiteSpace: 'pre-wrap',
  fontSize: '0.9rem',
  lineHeight: 1.55,
  color: 'var(--color-ink)',
  background: 'var(--color-bg)',
  border: '1px solid var(--color-rule)',
  padding: '0.75rem 0.9rem',
  margin: 0,
}

function ApplicationDetail({ app, onUpdated }) {
  const { request } = useAdminAPI()
  const [courses, setCourses] = useState(app.courses)
  const [notes, setNotes] = useState(app.admin_notes ?? '')
  const [personalNote, setPersonalNote] = useState(app.approval_note ?? '')
  const [showPreview, setShowPreview] = useState(false)
  const [preview, setPreview] = useState(null)
  const [previewError, setPreviewError] = useState(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)

  async function run(action, extra = {}, confirmText) {
    if (confirmText && !confirm(confirmText)) return
    setBusy(true)
    setError(null)
    setMessage(null)
    try {
      const res = await request('/api/admin/scholarships', {
        method: 'POST',
        body: { action, id: app.id, ...extra },
      })
      if (res.failures?.length) setError(`Some codes failed: ${res.failures.join('; ')}`)
      if (res.emailError) setError(`Codes created, but the email failed: ${res.emailError}. Use Resend email.`)
      else if (action === 'approve') setMessage(res.minted ? `Sent ${res.minted} code${res.minted === 1 ? '' : 's'}.` : 'Every course already has a live code.')
      else if (action === 'resend') setMessage('Email re-sent.')
      else if (action === 'notes') setMessage('Notes saved.')
      onUpdated(res.application)
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  // While the preview is open, rebuild it shortly after typing stops.
  useEffect(() => {
    if (!showPreview) return
    if (courses.length === 0) {
      setPreview(null)
      setPreviewError('Pick at least one course to preview.')
      return
    }
    let cancelled = false
    const t = setTimeout(async () => {
      try {
        const res = await request('/api/admin/scholarships', {
          method: 'POST',
          body: { action: 'preview', id: app.id, courses, personalNote },
        })
        if (!cancelled) {
          setPreview(res.preview)
          setPreviewError(null)
        }
      } catch (e) {
        if (!cancelled) setPreviewError(e.message)
      }
    }, 400)
    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [showPreview, personalNote, courses, app.id, request])

  const codes = app.codes ?? []
  const hasLive = codes.some((c) => !c.redeemed_at && new Date(c.expires_at) > new Date())

  return (
    <div style={{ padding: '0 1rem 1.25rem' }}>
      <div style={{ fontSize: '0.8rem', color: 'var(--color-ink-muted)' }}>
        {app.email} · {app.city || 'no city'} · {app.path_stage === 'other' && app.path_stage_other
          ? `Other: ${app.path_stage_other}`
          : STAGE_LABEL[app.path_stage] ?? app.path_stage}{' '}
        · applied{' '}
        {formatDate(app.created_at)}
      </div>

      <h3 style={sectionLabel}>Their path, and what has made access harder</h3>
      <p style={answerBox}>{app.story}</p>

      <h3 style={sectionLabel}>What would change in their teaching</h3>
      <p style={answerBox}>{app.teaching_impact}</p>

      {codes.length > 0 && (
        <>
          <h3 style={sectionLabel}>Codes</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            {codes.map((c) => (
              <div key={c.id} style={{ fontSize: '0.8rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <code style={{ color: 'var(--color-ink)' }}>{c.code}</code>
                <span style={{ color: 'var(--color-ink-muted)' }}>
                  {COURSE_LABEL[c.course] ?? c.course} · {codeState(c)}
                  {c.redeemed_email && c.redeemed_email.toLowerCase() !== app.email.toLowerCase()
                    ? ` · paid by ${c.redeemed_email}`
                    : ''}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      <h3 style={sectionLabel}>Courses to approve</h3>
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.85rem' }}>
        {COURSE_OPTIONS.map((c) => (
          <label key={c.value} style={{ display: 'inline-flex', gap: '0.35rem', alignItems: 'center' }}>
            <input
              type="checkbox"
              checked={courses.includes(c.value)}
              onChange={() =>
                setCourses((prev) =>
                  prev.includes(c.value) ? prev.filter((x) => x !== c.value) : [...prev, c.value]
                )
              }
              disabled={busy}
            />
            {c.label}
            {!app.courses.includes(c.value) && (
              <span style={{ color: 'var(--color-ink-muted)' }}>(not requested)</span>
            )}
          </label>
        ))}
      </div>

      <h3 style={sectionLabel}>Personal note for the email</h3>
      {app.approval_note_sent_at && (
        <p style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)', margin: '0 0 0.4rem' }}>
          {app.approval_note
            ? `This note went out with the email on ${formatDate(app.approval_note_sent_at)}.`
            : `The email on ${formatDate(app.approval_note_sent_at)} went out with no personal note.`}
        </p>
      )}
      <textarea
        value={personalNote}
        onChange={(e) => setPersonalNote(e.target.value)}
        rows={4}
        maxLength={2000}
        placeholder="Goes right after “Hi name,” in place of the stock opening line. Leave blank to use the stock line. A blank line starts a new paragraph."
        style={noteBox}
        disabled={busy}
      />
      <button
        type="button"
        className="pp-btn"
        onClick={() => setShowPreview((v) => !v)}
        style={{ marginTop: '0.4rem' }}
      >
        {showPreview ? 'Hide email preview' : 'Preview email'}
      </button>

      {showPreview && (
        <div style={{ marginTop: '0.75rem' }}>
          {previewError && <p style={{ fontSize: '0.8rem', color: '#ff7d7d', margin: '0 0 0.5rem' }}>{previewError}</p>}
          {preview && (
            <div style={{ border: '1px solid var(--color-rule)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-ink-muted)', padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--color-rule)' }}>
                To: {app.email} · Subject: {preview.subject}
                <span style={{ display: 'block', fontSize: '0.72rem' }}>
                  Sample codes shown. The real ones are created when you approve.
                </span>
              </div>
              <iframe
                title="Approval email preview"
                srcDoc={`<!doctype html><html><body style="margin:0;padding:1rem 1.25rem;background:#fff;">${preview.html}</body></html>`}
                sandbox=""
                style={{ width: '100%', height: '520px', border: 'none', background: '#fff', display: 'block' }}
              />
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '1rem' }}>
        <button
          type="button"
          className="pp-btn pp-btn--primary"
          disabled={busy || courses.length === 0}
          onClick={() =>
            run(
              'approve',
              { courses, personalNote },
              `Create ${courses.length} code${courses.length === 1 ? '' : 's'} and email ${app.email}?`
            )
          }
        >
          {app.status === 'approved' ? 'Send codes for selected' : 'Approve and email codes'}
        </button>
        {hasLive && (
          <button type="button" className="pp-btn" disabled={busy} onClick={() => run('resend', { personalNote }, `Re-send live codes to ${app.email}?`)}>
            Resend email
          </button>
        )}
        {app.status !== 'declined' ? (
          <button
            type="button"
            className="pp-btn"
            disabled={busy}
            onClick={() =>
              run('decline', {}, hasLive ? 'Decline and switch off their live codes? No email is sent.' : 'Decline? No email is sent.')
            }
          >
            Decline
          </button>
        ) : (
          <button type="button" className="pp-btn" disabled={busy} onClick={() => run('reopen')}>
            Move back to pending
          </button>
        )}
      </div>

      <h3 style={sectionLabel}>Private notes</h3>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={2}
        maxLength={4000}
        style={noteBox}
      />
      <button
        type="button"
        className="pp-btn"
        disabled={busy || notes === (app.admin_notes ?? '')}
        onClick={() => run('notes', { notes })}
        style={{ marginTop: '0.4rem' }}
      >
        Save notes
      </button>

      {message && <p style={{ fontSize: '0.8rem', color: 'var(--color-accent)', margin: '0.75rem 0 0' }}>{message}</p>}
      {error && <p style={{ fontSize: '0.8rem', color: '#ff7d7d', margin: '0.75rem 0 0' }}>{error}</p>}
    </div>
  )
}

export default function AdminScholarships() {
  const { user, signOut } = useEnrollment()
  const { request } = useAdminAPI()
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('pending')
  const [expanded, setExpanded] = useState(null)

  const refetch = useCallback(async () => {
    setError(null)
    try {
      setData(await request('/api/admin/scholarships'))
    } catch (e) {
      setError(e.message)
    }
  }, [request])

  useEffect(() => {
    refetch()
  }, [refetch])

  // Swap in the updated row straight away, then refresh the metrics.
  function handleUpdated(app) {
    if (app) {
      setData((d) => d && { ...d, applications: d.applications.map((a) => (a.id === app.id ? app : a)) })
    }
    refetch()
  }

  const m = data?.metrics
  // The open row stays put when approving moves it out of the current filter,
  // so the "Sent 2 codes" confirmation is still on screen.
  const list = (data?.applications ?? []).filter(
    (a) => filter === 'all' || a.status === filter || a.id === expanded
  )

  return (
    <div style={{ minHeight: '100vh' }}>
      <AdminNav user={user} onSignOut={signOut} />

      <main className="pp-main" style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <h1
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(1.5rem, 3vw, 2rem)',
            color: 'var(--color-ink)',
            margin: '0 0 1.5rem',
          }}
        >
          Scholarships
        </h1>

        {error && <p style={{ color: '#ff7d7d', fontSize: '0.85rem' }}>{error}</p>}
        {!data && !error && <p style={{ color: 'var(--color-ink-muted)', fontSize: '0.9rem' }}>Loading…</p>}

        {m && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '1rem',
              marginBottom: '2rem',
            }}
          >
            <StatCard
              label="Applications"
              value={m.applications.total}
              sublabel={`${m.applications.pending} pending · ${m.applications.approved} approved · ${m.applications.declined} declined`}
            />
            <StatCard
              label="Codes redeemed"
              value={`${m.codes.redeemed} / ${m.codes.sent}`}
              sublabel={`${m.codes.live} live · ${m.codes.expiredUnused} expired unused`}
            />
            <StatCard
              label="Scholarship students"
              value={m.students}
              sublabel={`${m.enrollments} enrollment${m.enrollments === 1 ? '' : 's'}: ${
                Object.entries(m.byCourse)
                  .map(([k, n]) => `${COURSE_LABEL[k] ?? k} ${n}`)
                  .join(', ') || 'none yet'
              }`}
            />
            <StatCard
              label="Scholarship revenue"
              value={formatCents(m.revenueCents)}
              sublabel={`${formatCents(m.discountCents)} in discounts given`}
            />
            <StatCard
              label="Bought again at full price"
              value={m.convertedStudents}
              sublabel={m.students ? `${Math.round((m.convertedStudents / m.students) * 100)}% of scholarship students` : 'No students yet'}
            />
          </div>
        )}

        {data && (
          <>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              {FILTERS.map((f) => {
                const count = f === 'all' ? data.applications.length : data.applications.filter((a) => a.status === f).length
                return (
                  <button
                    key={f}
                    type="button"
                    className={`pp-btn${filter === f ? ' pp-btn--primary' : ''}`}
                    onClick={() => setFilter(f)}
                    style={{ textTransform: 'capitalize' }}
                  >
                    {f} ({count})
                  </button>
                )
              })}
            </div>

            <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-rule)' }}>
              {list.length === 0 && (
                <p style={{ padding: '1.5rem', color: 'var(--color-ink-muted)', fontSize: '0.9rem', margin: 0 }}>
                  No {filter === 'all' ? '' : `${filter} `}applications.
                </p>
              )}
              {list.map((app) => {
                const isOpen = expanded === app.id
                return (
                  <div key={app.id} style={{ borderBottom: '1px solid var(--color-rule)' }}>
                    <button
                      type="button"
                      onClick={() => setExpanded(isOpen ? null : app.id)}
                      style={{
                        width: '100%',
                        padding: '0.9rem 1rem',
                        background: 'transparent',
                        border: 'none',
                        textAlign: 'left',
                        cursor: 'pointer',
                        color: 'var(--color-ink)',
                        fontFamily: 'inherit',
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: '1rem',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.9rem' }}>{app.name}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--color-ink-muted)' }}>
                          {app.courses.map((c) => COURSE_LABEL[c] ?? c).join(', ')} · {formatDate(app.created_at)}
                        </div>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                        {app.status} {isOpen ? '▾' : '▸'}
                      </span>
                    </button>
                    {isOpen && <ApplicationDetail key={app.id} app={app} onUpdated={handleUpdated} />}
                  </div>
                )
              })}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
