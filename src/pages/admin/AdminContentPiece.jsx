import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import MDEditor from '@uiw/react-md-editor'
import { Sparkles, Save, CalendarCheck, RotateCcw, ChevronLeft, History, Send } from 'lucide-react'
import { useEnrollment } from '../../hooks/useEnrollment'
import { useAdminAPI } from '../../hooks/admin/useAdminAPI'
import AdminNav from '../../components/admin/AdminNav'

const STATUS_LABELS = {
  drafting: 'Drafting',
  in_review: 'In review',
  approved: 'Approved',
  scheduled: 'Scheduled',
  published: 'Published',
  archived: 'Archived',
}

function defaultScheduleLocal() {
  const d = new Date(Date.now() + 24 * 60 * 60 * 1000)
  d.setMinutes(0, 0, 0)
  // datetime-local format: YYYY-MM-DDTHH:mm
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function AdminContentPiece() {
  const { id } = useParams()
  const { user, signOut } = useEnrollment()
  const { request } = useAdminAPI()

  const [piece, setPiece] = useState(null)
  const [drafts, setDrafts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [extraNotes, setExtraNotes] = useState('')
  const [feedback, setFeedback] = useState('')
  const [generating, setGenerating] = useState(false)
  const [generationInfo, setGenerationInfo] = useState(null)

  const [blogMd, setBlogMd] = useState('')
  const [emailSubject, setEmailSubject] = useState('')
  const [emailMd, setEmailMd] = useState('')
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState(null)
  const dirtyRef = useRef(false)

  const [scheduleAt, setScheduleAt] = useState(defaultScheduleLocal())
  const [approving, setApproving] = useState(false)
  const [draftingInKit, setDraftingInKit] = useState(false)
  const [kitSyncNote, setKitSyncNote] = useState(null)

  const refetch = useCallback(async () => {
    setLoading(true)
    try {
      const data = await request(`/api/admin/content/pieces?id=${id}`)
      setPiece(data.piece)
      setDrafts(data.drafts ?? [])
      if (!dirtyRef.current) {
        setBlogMd(data.piece.blog_markdown ?? '')
        setEmailSubject(data.piece.email_subject ?? '')
        setEmailMd(data.piece.email_markdown ?? '')
      }
      setError(null)
    } catch (e) {
      setError(e.message)
    }
    setLoading(false)
  }, [request, id])

  useEffect(() => {
    refetch()
  }, [refetch])

  async function generate(isRevision) {
    setGenerating(true)
    setGenerationInfo(null)
    try {
      const body = isRevision
        ? { piece_id: id, feedback: feedback.trim() }
        : { piece_id: id, notes: extraNotes.trim() || null }
      if (isRevision && !feedback.trim()) {
        alert('Add feedback first.')
        setGenerating(false)
        return
      }
      const result = await request('/api/admin/content/draft', {
        method: 'POST',
        body,
      })
      dirtyRef.current = false
      setGenerationInfo(result.usage ?? null)
      if (isRevision) setFeedback('')
      else setExtraNotes('')
      await refetch()
    } catch (e) {
      alert(`Generation failed: ${e.message}`)
    }
    setGenerating(false)
  }

  function markDirty(setter) {
    return (val) => {
      dirtyRef.current = true
      setter(val)
    }
  }

  async function saveEdits() {
    setSaving(true)
    setKitSyncNote(null)
    try {
      const result = await request(`/api/admin/content/pieces?id=${id}`, {
        method: 'PATCH',
        body: {
          blog_markdown: blogMd,
          email_subject: emailSubject,
          email_markdown: emailMd,
        },
      })
      dirtyRef.current = false
      setSavedAt(new Date())
      if (result?.kit_sync === 'updated') {
        setKitSyncNote('Synced to Kit draft')
      } else if (typeof result?.kit_sync === 'string' && result.kit_sync.startsWith('failed')) {
        setKitSyncNote(`Kit sync failed: ${result.kit_sync.replace(/^failed:\s*/, '')}`)
      }
      await refetch()
    } catch (e) {
      alert(`Save failed: ${e.message}`)
    }
    setSaving(false)
  }

  async function draftInKit() {
    setDraftingInKit(true)
    setKitSyncNote(null)
    try {
      // Save first if dirty so Kit gets the latest content
      if (dirtyRef.current) {
        await saveEdits()
      }
      const result = await request('/api/admin/content/draft-in-kit', {
        method: 'POST',
        body: { piece_id: id },
      })
      setKitSyncNote(
        result.action === 'created'
          ? `Created draft in Kit (broadcast #${result.kit_broadcast_id})`
          : `Updated existing Kit draft (broadcast #${result.kit_broadcast_id})`,
      )
      await refetch()
    } catch (e) {
      alert(`Draft in Kit failed: ${e.message}`)
    }
    setDraftingInKit(false)
  }

  async function approveAndSchedule() {
    if (dirtyRef.current) {
      if (!confirm('You have unsaved edits. Save them first?')) return
      await saveEdits()
    }
    if (!scheduleAt) {
      alert('Pick a schedule date/time.')
      return
    }
    const iso = new Date(scheduleAt).toISOString()
    if (!confirm(`Schedule publish for ${new Date(iso).toLocaleString()}?\n\nThis will create the Kit broadcast and queue the blog post.`)) {
      return
    }
    setApproving(true)
    try {
      await request('/api/admin/content/approve', {
        method: 'POST',
        body: { piece_id: id, scheduled_for: iso },
      })
      await refetch()
    } catch (e) {
      alert(`Approve failed: ${e.message}`)
    }
    setApproving(false)
  }

  async function unschedule() {
    if (!confirm('Move back to in-review? You will need to re-approve and re-schedule.\n\nNote: this does NOT cancel a Kit broadcast that is already scheduled — cancel it manually in Kit if needed.')) {
      return
    }
    try {
      await request(`/api/admin/content/pieces?id=${id}`, {
        method: 'PATCH',
        body: { status: 'in_review' },
      })
      await refetch()
    } catch (e) {
      alert(`Failed: ${e.message}`)
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
        <AdminNav user={user} onSignOut={signOut} />
        <main className="pp-main" style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <p style={{ color: 'var(--color-ink-muted)' }}>Loading…</p>
        </main>
      </div>
    )
  }

  if (error || !piece) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
        <AdminNav user={user} onSignOut={signOut} />
        <main className="pp-main" style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <p style={{ color: '#ff7d7d' }}>{error || 'Piece not found'}</p>
          <Link to="/admin/content/ideas" style={{ color: 'var(--color-accent)' }}>
            ← Back to ideas
          </Link>
        </main>
      </div>
    )
  }

  const editable = piece.status === 'drafting' || piece.status === 'in_review'
  const hasContent = !!piece.blog_markdown
  const isLocked = piece.status === 'scheduled' || piece.status === 'published'

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }} data-color-mode="dark">
      <AdminNav user={user} onSignOut={signOut} />

      <main className="pp-main" style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <Link
          to="/admin/content"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.3rem',
            color: 'var(--color-ink-muted)',
            textDecoration: 'none',
            fontSize: '0.8rem',
            marginBottom: '1rem',
          }}
        >
          <ChevronLeft size={14} /> Content
        </Link>

        <div className="pp-header-row" style={{ marginBottom: '2rem' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1
              style={{
                fontFamily: '"DM Serif Display", serif',
                fontSize: 'clamp(1.5rem, 3vw, 2rem)',
                color: 'var(--color-ink)',
                margin: 0,
                lineHeight: 1.2,
              }}
            >
              {piece.title || 'Untitled piece'}
            </h1>
            <div
              style={{
                display: 'flex',
                gap: '0.75rem',
                marginTop: '0.5rem',
                alignItems: 'center',
                flexWrap: 'wrap',
                fontSize: '0.8rem',
                color: 'var(--color-ink-muted)',
              }}
            >
              <StatusPill status={piece.status} />
              {piece.slug && <code style={{ fontSize: '0.75rem' }}>/{piece.slug}</code>}
              {piece.scheduled_for && (
                <span>Scheduled for {new Date(piece.scheduled_for).toLocaleString()}</span>
              )}
            </div>
          </div>
        </div>

        {/* STEP 1 — Generate / regenerate */}
        <Step
          number={hasContent ? 2 : 1}
          title={hasContent ? 'Request a revision' : 'Generate the first draft'}
          subtitle={
            hasContent
              ? 'Tell Claude what to change. Past drafts are preserved as versions.'
              : 'Claude will use your active brain entries as voice context and write a blog + email together.'
          }
          locked={isLocked}
        >
          {!hasContent ? (
            <>
              <textarea
                rows={4}
                value={extraNotes}
                onChange={(e) => setExtraNotes(e.target.value)}
                placeholder="Optional: extra context for this draft (angle, length, hooks, CTAs to include)…"
                style={textareaStyle}
                disabled={generating}
              />
              <button
                type="button"
                onClick={() => generate(false)}
                disabled={generating}
                style={primaryBtn(generating)}
              >
                <Sparkles size={14} /> {generating ? 'Generating…' : 'Generate draft'}
              </button>
            </>
          ) : (
            <>
              <textarea
                rows={3}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="What should change? e.g. 'Make it punchier', 'cut the second section', 'add a callout about reformer springs'…"
                style={textareaStyle}
                disabled={generating || isLocked}
              />
              <button
                type="button"
                onClick={() => generate(true)}
                disabled={generating || isLocked || !feedback.trim()}
                style={primaryBtn(generating || isLocked || !feedback.trim())}
              >
                <RotateCcw size={14} /> {generating ? 'Generating…' : 'Re-draft with feedback'}
              </button>
            </>
          )}
          {generationInfo && (
            <p style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)', marginTop: '0.5rem' }}>
              Tokens: input {generationInfo.input_tokens}
              {generationInfo.cache_creation_input_tokens
                ? ` (+${generationInfo.cache_creation_input_tokens} cache write)`
                : ''}
              {generationInfo.cache_read_input_tokens
                ? ` (${generationInfo.cache_read_input_tokens} cache hit)`
                : ''}
              {' · output '}
              {generationInfo.output_tokens}
            </p>
          )}
        </Step>

        {/* STEP — Edit */}
        {hasContent && (
          <Step
            number={3}
            title="Edit"
            subtitle="Tweak the markdown directly. Saving snapshots a version under your name."
            locked={isLocked}
          >
            <FieldLabel>Blog post</FieldLabel>
            <div style={{ background: 'var(--color-bg)', border: '1px solid var(--color-rule)' }}>
              <MDEditor
                value={blogMd}
                onChange={markDirty(setBlogMd)}
                height={500}
                preview={isLocked ? 'preview' : 'live'}
                visibleDragbar={false}
              />
            </div>
            <div style={{ height: '1.25rem' }} />
            <FieldLabel>Email subject</FieldLabel>
            <input
              type="text"
              value={emailSubject}
              onChange={(e) => markDirty(setEmailSubject)(e.target.value)}
              style={inputStyle}
              disabled={isLocked}
            />
            <div style={{ height: '0.75rem' }} />
            <FieldLabel>Email body</FieldLabel>
            <div style={{ background: 'var(--color-bg)', border: '1px solid var(--color-rule)' }}>
              <MDEditor
                value={emailMd}
                onChange={markDirty(setEmailMd)}
                height={300}
                preview={isLocked ? 'preview' : 'live'}
                visibleDragbar={false}
              />
            </div>
            <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={saveEdits}
                disabled={saving || isLocked}
                style={primaryBtn(saving || isLocked)}
              >
                <Save size={14} /> {saving ? 'Saving…' : 'Save edits'}
              </button>
              {savedAt && (
                <span style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)' }}>
                  Saved at {savedAt.toLocaleTimeString()}
                </span>
              )}
              {kitSyncNote && (
                <span style={{ fontSize: '0.75rem', color: 'var(--color-accent)' }}>
                  · {kitSyncNote}
                </span>
              )}
            </div>
          </Step>
        )}

        {/* STEP — Approve & schedule */}
        {hasContent && (
          <Step
            number={4}
            title="Approve & schedule"
            subtitle={
              isLocked
                ? 'Already approved. The cron will publish the blog at the scheduled time; Kit handles the email send.'
                : 'Pick a date/time. The blog post is queued and Kit schedules the broadcast.'
            }
          >
            {isLocked ? (
              <>
                <p style={{ fontSize: '0.9rem', color: 'var(--color-ink)', marginBottom: '1rem' }}>
                  Status: <StatusPill status={piece.status} />
                </p>
                {piece.status === 'scheduled' && (
                  <button type="button" onClick={unschedule} style={secondaryBtn}>
                    Unschedule
                  </button>
                )}
                {piece.status === 'published' && piece.slug && (
                  <Link
                    to={`/blog/${piece.slug}`}
                    style={{ ...primaryBtn(false), display: 'inline-flex', textDecoration: 'none' }}
                  >
                    View public blog post →
                  </Link>
                )}
              </>
            ) : (
              <>
                <FieldLabel>Send / publish at</FieldLabel>
                <input
                  type="datetime-local"
                  value={scheduleAt}
                  onChange={(e) => setScheduleAt(e.target.value)}
                  style={{ ...inputStyle, maxWidth: '260px' }}
                />
                <div style={{ marginTop: '1rem', display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={approveAndSchedule}
                    disabled={approving || draftingInKit}
                    style={primaryBtn(approving || draftingInKit)}
                  >
                    <CalendarCheck size={14} /> {approving ? 'Scheduling…' : 'Approve & schedule'}
                  </button>
                  <button
                    type="button"
                    onClick={draftInKit}
                    disabled={approving || draftingInKit}
                    style={secondaryBtn}
                  >
                    <Send size={14} />{' '}
                    {draftingInKit
                      ? piece.kit_broadcast_id
                        ? 'Updating Kit…'
                        : 'Drafting in Kit…'
                      : piece.kit_broadcast_id
                        ? 'Update Kit draft'
                        : 'Draft in Kit'}
                  </button>
                </div>
                {piece.kit_broadcast_id && (
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)', marginTop: '0.6rem' }}>
                    Linked to Kit broadcast #{piece.kit_broadcast_id}. Edits saved here will auto-sync to it.
                  </p>
                )}
                {kitSyncNote && (
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-accent)', marginTop: '0.4rem' }}>
                    {kitSyncNote}
                  </p>
                )}
              </>
            )}
          </Step>
        )}

        {/* Version history */}
        {drafts.length > 0 && (
          <Step number={null} title="Version history" subtitle={`${drafts.length} draft${drafts.length === 1 ? '' : 's'} captured`}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {drafts.map((d) => (
                <div
                  key={d.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.6rem 0.9rem',
                    background: 'var(--color-bg)',
                    border: '1px solid var(--color-rule)',
                    fontSize: '0.8rem',
                    color: 'var(--color-ink-muted)',
                  }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                    <History size={12} />
                    v{d.version} · {sourceLabel(d.source)}
                    {d.feedback ? ` — "${truncate(d.feedback, 60)}"` : ''}
                  </span>
                  <span>{new Date(d.created_at).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </Step>
        )}
      </main>
    </div>
  )
}

function Step({ number, title, subtitle, children, locked }) {
  return (
    <section
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-rule)',
        padding: '1.5rem',
        marginBottom: '1.25rem',
        opacity: locked ? 0.7 : 1,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginBottom: '0.4rem' }}>
        {number !== null && (
          <span
            style={{
              fontFamily: '"DM Serif Display", serif',
              fontSize: '1.5rem',
              color: 'var(--color-accent)',
              lineHeight: 1,
            }}
          >
            {number}
          </span>
        )}
        <h2
          style={{
            fontFamily: '"DM Serif Display", serif',
            fontSize: '1.25rem',
            color: 'var(--color-ink)',
            margin: 0,
          }}
        >
          {title}
        </h2>
      </div>
      {subtitle && (
        <p style={{ fontSize: '0.85rem', color: 'var(--color-ink-muted)', marginBottom: '1rem', marginTop: 0 }}>
          {subtitle}
        </p>
      )}
      {children}
    </section>
  )
}

function StatusPill({ status }) {
  const bg =
    {
      drafting: 'rgba(255,255,255,0.06)',
      in_review: 'rgba(100,180,255,0.15)',
      approved: 'rgba(180,255,150,0.15)',
      scheduled: 'rgba(255,180,100,0.18)',
      published: 'rgba(100,255,150,0.15)',
      archived: 'rgba(255,255,255,0.04)',
    }[status] ?? 'rgba(255,255,255,0.06)'
  return (
    <span
      style={{
        display: 'inline-block',
        fontSize: '0.7rem',
        padding: '0.2rem 0.5rem',
        background: bg,
        color: 'var(--color-ink)',
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        fontWeight: 600,
      }}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  )
}

function FieldLabel({ children }) {
  return (
    <label
      style={{
        display: 'block',
        fontSize: '0.7rem',
        fontWeight: 600,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: 'var(--color-ink-muted)',
        marginBottom: '0.4rem',
      }}
    >
      {children}
    </label>
  )
}

function sourceLabel(s) {
  return {
    claude_initial: 'Claude (first draft)',
    claude_revision: 'Claude (revision)',
    kaleen_edit: 'Manual edit',
  }[s] ?? s
}

function truncate(s, n) {
  if (!s) return ''
  return s.length > n ? s.slice(0, n - 1) + '…' : s
}

const inputStyle = {
  width: '100%',
  padding: '0.7rem 0.9rem',
  background: 'var(--color-bg)',
  border: '1px solid var(--color-rule)',
  color: 'var(--color-ink)',
  fontSize: '0.9rem',
  fontFamily: '"DM Sans", sans-serif',
  outline: 'none',
}

const textareaStyle = {
  ...inputStyle,
  resize: 'vertical',
  fontFamily: 'inherit',
  marginBottom: '0.75rem',
}

function primaryBtn(disabled) {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.4rem',
    padding: '0.7rem 1.1rem',
    background: 'var(--color-accent)',
    color: '#1C1A17',
    border: 'none',
    fontSize: '0.85rem',
    fontWeight: 500,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
  }
}

const secondaryBtn = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.4rem',
  padding: '0.7rem 1.1rem',
  background: 'transparent',
  color: 'var(--color-ink)',
  border: '1px solid var(--color-rule)',
  fontSize: '0.85rem',
  fontWeight: 500,
  cursor: 'pointer',
}
