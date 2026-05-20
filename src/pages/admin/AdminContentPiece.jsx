import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import MDEditor from '@uiw/react-md-editor'
import { Sparkles, Save, CalendarCheck, RotateCcw, ChevronLeft, History, Send, Trash2, SpellCheck, Users, X } from 'lucide-react'
import { useEnrollment } from '../../hooks/useEnrollment'
import { useAdminAPI } from '../../hooks/admin/useAdminAPI'
import AdminNav from '../../components/admin/AdminNav'
import FileUpload from '../../components/admin/FileUpload'
import InlineImageUpload from '../../components/admin/InlineImageUpload'

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
  const navigate = useNavigate()
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
  const [emailPreviewText, setEmailPreviewText] = useState('')
  const [emailMd, setEmailMd] = useState('')
  const [featuredImageUrl, setFeaturedImageUrl] = useState('')
  const [featuredImageAlt, setFeaturedImageAlt] = useState('')
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState(null)
  const dirtyRef = useRef(false)

  const [scheduleAt, setScheduleAt] = useState(defaultScheduleLocal())
  const [approving, setApproving] = useState(false)
  const [draftingInKit, setDraftingInKit] = useState(false)
  const [kitSyncNote, setKitSyncNote] = useState(null)

  const [proofreadResult, setProofreadResult] = useState(null)
  const [audienceResult, setAudienceResult] = useState(null)
  const [reviewing, setReviewing] = useState(null)
  const [reviewTab, setReviewTab] = useState('proofread')

  const [kitTagIds, setKitTagIds] = useState([])
  const [kitTagMatch, setKitTagMatch] = useState('any')
  const [availableTags, setAvailableTags] = useState(null)
  const [tagsError, setTagsError] = useState(null)

  const refetch = useCallback(async () => {
    setLoading(true)
    try {
      const data = await request(`/api/admin/content/pieces?id=${id}`)
      setPiece(data.piece)
      setDrafts(data.drafts ?? [])
      if (!dirtyRef.current) {
        setBlogMd(data.piece.blog_markdown ?? '')
        setEmailSubject(data.piece.email_subject ?? '')
        setEmailPreviewText(data.piece.email_preview_text ?? '')
        setEmailMd(data.piece.email_markdown ?? '')
        setFeaturedImageUrl(data.piece.featured_image_url ?? '')
        setFeaturedImageAlt(data.piece.featured_image_alt ?? '')
        setKitTagIds(Array.isArray(data.piece.kit_tag_ids) ? data.piece.kit_tag_ids : [])
        setKitTagMatch(data.piece.kit_tag_match ?? 'any')
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

  useEffect(() => {
    let cancelled = false
    request('/api/admin/kit/tags')
      .then((data) => {
        if (cancelled) return
        setAvailableTags(Array.isArray(data?.tags) ? data.tags : [])
      })
      .catch((e) => {
        if (cancelled) return
        setTagsError(e.message)
        setAvailableTags([])
      })
    return () => {
      cancelled = true
    }
  }, [request])

  function toggleTag(id) {
    dirtyRef.current = true
    setKitTagIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  function changeTagMatch(mode) {
    dirtyRef.current = true
    setKitTagMatch(mode)
  }

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
          email_preview_text: emailPreviewText,
          email_markdown: emailMd,
          featured_image_url: featuredImageUrl || null,
          featured_image_alt: featuredImageAlt || null,
          kit_tag_ids: kitTagIds,
          kit_tag_match: kitTagMatch,
        },
      })
      dirtyRef.current = false
      setSavedAt(new Date())
      const notes = []
      if (result?.kit_sync === 'updated') {
        notes.push('Synced to Kit draft')
      } else if (typeof result?.kit_sync === 'string' && result.kit_sync.startsWith('failed')) {
        notes.push(`Kit sync failed: ${result.kit_sync.replace(/^failed:\s*/, '')}`)
      }
      if (result?.blog_sync === 'updated') {
        notes.push('Live blog updated')
      } else if (typeof result?.blog_sync === 'string' && result.blog_sync.startsWith('failed')) {
        notes.push(`Blog sync failed: ${result.blog_sync.replace(/^failed:\s*/, '')}`)
      }
      if (notes.length) setKitSyncNote(notes.join(' · '))
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

  async function resetKitId() {
    if (
      !confirm(
        "Clear the stored Kit broadcast ID? Use this after manually deleting the draft in Kit. The next 'Draft in Kit' click will create a fresh broadcast.",
      )
    ) {
      return
    }
    setKitSyncNote(null)
    try {
      await request('/api/admin/content/reset-kit-id', {
        method: 'POST',
        body: { piece_id: id },
      })
      setKitSyncNote('Kit broadcast link cleared — next Draft in Kit will create a new one')
      await refetch()
    } catch (e) {
      alert(`Reset failed: ${e.message}`)
    }
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
    if (!confirm("Unschedule this piece? The Kit broadcast and blog post will be reverted to draft. You'll be able to re-approve and reschedule later.")) {
      return
    }
    try {
      await request('/api/admin/content/unschedule', {
        method: 'POST',
        body: { piece_id: id },
      })
      await refetch()
    } catch (e) {
      alert(`Failed: ${e.message}`)
    }
  }

  async function runProofread() {
    setReviewing('proofread')
    setReviewTab('proofread')
    try {
      const result = await request('/api/admin/content/proofread', {
        method: 'POST',
        body: {
          blog_markdown: blogMd,
          email_subject: emailSubject,
          email_preview_text: emailPreviewText,
          email_markdown: emailMd,
        },
      })
      setProofreadResult(result)
    } catch (e) {
      alert(`Proofread failed: ${e.message}`)
    }
    setReviewing(null)
  }

  async function runAudienceRead() {
    setReviewing('audience')
    setReviewTab('audience')
    try {
      const result = await request('/api/admin/content/audience-read', {
        method: 'POST',
        body: {
          blog_markdown: blogMd,
          email_subject: emailSubject,
          email_preview_text: emailPreviewText,
          email_markdown: emailMd,
        },
      })
      setAudienceResult(result)
    } catch (e) {
      alert(`Audience read failed: ${e.message}`)
    }
    setReviewing(null)
  }

  async function deletePiece() {
    if (!confirm('Permanently delete this piece? The blog draft will be removed and the Kit broadcast will be reverted to draft (delete it manually in Kit if you want it fully gone). This cannot be undone.')) {
      return
    }
    try {
      await request(`/api/admin/content/pieces?id=${id}`, { method: 'DELETE' })
      navigate('/admin/content')
    } catch (e) {
      alert(`Delete failed: ${e.message}`)
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh' }}>
        <AdminNav user={user} onSignOut={signOut} />
        <main className="pp-main" style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <p style={{ color: 'var(--color-ink-muted)' }}>Loading…</p>
        </main>
      </div>
    )
  }

  if (error || !piece) {
    return (
      <div style={{ minHeight: '100vh' }}>
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

  const hasContent = !!piece.blog_markdown
  const isLocked = piece.status === 'scheduled' || piece.status === 'published'
  // Blog stays editable after publish so edits propagate to the live blog_posts
  // row. Email is still locked once published since the broadcast already sent.
  const blogLocked = piece.status === 'scheduled'

  return (
    <div style={{ minHeight: '100vh' }} data-color-mode="dark">
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
                fontFamily: 'var(--font-serif)',
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
            subtitle={
              piece.status === 'published'
                ? 'Edits to the blog publish to the live post immediately. Email is locked since the broadcast already sent.'
                : 'Tweak the markdown directly. Saving snapshots a version under your name.'
            }
            locked={blogLocked}
          >
            <FieldLabel>Featured image</FieldLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <FileUpload
                bucket="blog-images"
                pathPrefix={`blog/${id}`}
                returnUrl
                accept="image/*"
                value={featuredImageUrl}
                onChange={markDirty(setFeaturedImageUrl)}
              />
              {featuredImageUrl && (
                <div
                  style={{
                    width: '100%',
                    maxWidth: '320px',
                    aspectRatio: '16 / 9',
                    border: '1px solid var(--color-rule)',
                    background: 'var(--color-bg)',
                  }}
                >
                  <img
                    src={featuredImageUrl}
                    alt={featuredImageAlt || ''}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                </div>
              )}
              <input
                type="text"
                value={featuredImageAlt}
                onChange={(e) => markDirty(setFeaturedImageAlt)(e.target.value)}
                placeholder="Alt text (describe the image for screen readers)"
                style={inputStyle}
                disabled={blogLocked}
              />
              <p style={{ fontSize: '0.7rem', color: 'var(--color-ink-muted)', margin: 0 }}>
                Recommended ~1600×900, JPEG/WebP, under 500 KB.
              </p>
            </div>
            <div style={{ height: '1.25rem' }} />
            <FieldLabel>Blog post</FieldLabel>
            <div style={{ marginBottom: '0.5rem' }}>
              <InlineImageUpload pathPrefix={`blog/${id}`} label="Upload image for blog body" />
            </div>
            <div style={{ background: 'var(--color-bg)', border: '1px solid var(--color-rule)' }}>
              <MDEditor
                value={blogMd}
                onChange={markDirty(setBlogMd)}
                height={500}
                preview={blogLocked ? 'preview' : 'live'}
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
            <FieldLabel>
              Email preview text{' '}
              <span style={{ color: 'var(--color-ink-muted)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>
                — inbox preheader, ~60–110 chars
              </span>
            </FieldLabel>
            <input
              type="text"
              value={emailPreviewText}
              onChange={(e) => markDirty(setEmailPreviewText)(e.target.value)}
              maxLength={150}
              placeholder="The snippet that appears next to the subject line in the inbox"
              style={inputStyle}
              disabled={isLocked}
            />
            <div style={{ fontSize: '0.7rem', color: 'var(--color-ink-muted)', marginTop: '0.3rem' }}>
              {emailPreviewText.length} chars
            </div>
            <div style={{ height: '0.75rem' }} />
            <FieldLabel>Email body</FieldLabel>
            <div style={{ marginBottom: '0.5rem' }}>
              <InlineImageUpload pathPrefix={`blog/${id}`} label="Upload image for email body" />
            </div>
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
                disabled={saving || blogLocked}
                style={primaryBtn(saving || blogLocked)}
              >
                <Save size={14} /> {saving ? 'Saving…' : 'Save edits'}
              </button>
              <button
                type="button"
                onClick={runProofread}
                disabled={reviewing !== null}
                style={secondaryBtn}
              >
                <SpellCheck size={14} /> {reviewing === 'proofread' ? 'Proofreading…' : 'Proofread'}
              </button>
              <button
                type="button"
                onClick={runAudienceRead}
                disabled={reviewing !== null}
                style={secondaryBtn}
              >
                <Users size={14} /> {reviewing === 'audience' ? 'Reading…' : 'Audience read'}
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

            {(proofreadResult || audienceResult) && (
              <ReviewPanel
                tab={reviewTab}
                onTabChange={setReviewTab}
                proofreadResult={proofreadResult}
                audienceResult={audienceResult}
                onClear={() => {
                  setProofreadResult(null)
                  setAudienceResult(null)
                }}
              />
            )}
          </Step>
        )}

        {/* STEP — Audience targeting */}
        {hasContent && (
          <Step
            number={4}
            title="Audience"
            subtitle={
              piece.status === 'published'
                ? 'The broadcast already sent. Audience shown for reference only.'
                : 'Choose which Kit subscribers receive this email. No tags selected = everyone.'
            }
          >
            <AudienceSelector
              tags={availableTags}
              tagsError={tagsError}
              selectedIds={kitTagIds}
              matchMode={kitTagMatch}
              onToggleTag={toggleTag}
              onChangeMatch={changeTagMatch}
              disabled={piece.status === 'published'}
            />
          </Step>
        )}

        {/* STEP — Approve & schedule */}
        {hasContent && (
          <Step
            number={5}
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
                  <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                    <button type="button" onClick={unschedule} style={secondaryBtn}>
                      Unschedule
                    </button>
                    <button type="button" onClick={deletePiece} style={dangerBtn}>
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
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
                    {' · '}
                    <button
                      type="button"
                      onClick={resetKitId}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        color: 'var(--color-accent)',
                        textDecoration: 'underline',
                        cursor: 'pointer',
                        fontSize: 'inherit',
                        fontFamily: 'inherit',
                      }}
                    >
                      Reset Kit post ID
                    </button>
                  </p>
                )}
                {kitSyncNote && (
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-accent)', marginTop: '0.4rem' }}>
                    {kitSyncNote}
                  </p>
                )}
                <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--color-rule)' }}>
                  <button type="button" onClick={deletePiece} style={dangerBtn}>
                    <Trash2 size={14} /> Delete piece
                  </button>
                </div>
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
              fontFamily: 'var(--font-serif)',
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
            fontFamily: 'var(--font-serif)',
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

function AudienceSelector({
  tags,
  tagsError,
  selectedIds,
  matchMode,
  onToggleTag,
  onChangeMatch,
  disabled,
}) {
  if (tagsError) {
    return (
      <p style={{ fontSize: '0.85rem', color: '#ff7d7d', margin: 0 }}>
        Failed to load Kit tags: {tagsError}
      </p>
    )
  }
  if (tags === null) {
    return (
      <p style={{ fontSize: '0.85rem', color: 'var(--color-ink-muted)', margin: 0 }}>
        Loading tags from Kit…
      </p>
    )
  }
  if (tags.length === 0) {
    return (
      <p style={{ fontSize: '0.85rem', color: 'var(--color-ink-muted)', margin: 0 }}>
        No tags found in your Kit account. Create tags in Kit to enable targeting.
      </p>
    )
  }

  const selectedSet = new Set(selectedIds)
  const selectedNames = tags
    .filter((t) => selectedSet.has(t.id))
    .map((t) => t.name)

  let summary
  if (selectedNames.length === 0) {
    summary = 'Sends to all active subscribers.'
  } else if (selectedNames.length === 1) {
    summary = `Sends to subscribers tagged "${selectedNames[0]}".`
  } else {
    summary =
      matchMode === 'all'
        ? `Sends to subscribers with ALL of: ${selectedNames.join(', ')}.`
        : `Sends to subscribers with ANY of: ${selectedNames.join(', ')}.`
  }

  return (
    <>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.4rem',
          marginBottom: '0.75rem',
        }}
      >
        {tags.map((t) => {
          const active = selectedSet.has(t.id)
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onToggleTag(t.id)}
              disabled={disabled}
              style={{
                padding: '0.4rem 0.75rem',
                background: active ? 'var(--color-accent)' : 'transparent',
                color: active ? 'var(--color-accent-ink)' : 'var(--color-ink)',
                border: '1px solid',
                borderColor: active ? 'var(--color-accent)' : 'var(--color-rule)',
                fontSize: '0.8rem',
                fontWeight: active ? 600 : 500,
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.5 : 1,
                fontFamily: 'var(--font-serif)',
              }}
            >
              {t.name}
            </button>
          )
        })}
      </div>

      {selectedIds.length >= 2 && (
        <div
          style={{
            display: 'flex',
            gap: '1rem',
            alignItems: 'center',
            marginBottom: '0.75rem',
            fontSize: '0.85rem',
            color: 'var(--color-ink)',
          }}
        >
          <span style={{ color: 'var(--color-ink-muted)' }}>Match:</span>
          <label style={{ display: 'inline-flex', gap: '0.35rem', alignItems: 'center', cursor: disabled ? 'not-allowed' : 'pointer' }}>
            <input
              type="radio"
              name="kit-tag-match"
              value="any"
              checked={matchMode === 'any'}
              onChange={() => onChangeMatch('any')}
              disabled={disabled}
            />
            any of these tags
          </label>
          <label style={{ display: 'inline-flex', gap: '0.35rem', alignItems: 'center', cursor: disabled ? 'not-allowed' : 'pointer' }}>
            <input
              type="radio"
              name="kit-tag-match"
              value="all"
              checked={matchMode === 'all'}
              onChange={() => onChangeMatch('all')}
              disabled={disabled}
            />
            all of these tags
          </label>
        </div>
      )}

      <p style={{ fontSize: '0.8rem', color: 'var(--color-ink-muted)', margin: 0 }}>
        {summary}
      </p>
    </>
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

const WHERE_LABEL = {
  blog: 'Blog',
  email_subject: 'Email subject',
  email_preview: 'Email preview',
  email_body: 'Email body',
}

const KIND_COLOR = {
  spelling: 'rgba(255,180,100,0.18)',
  grammar: 'rgba(100,180,255,0.18)',
  voice: 'rgba(180,255,150,0.18)',
  inconsistency: 'rgba(255,125,125,0.18)',
}

function ReviewPanel({ tab, onTabChange, proofreadResult, audienceResult, onClear }) {
  const proofreadCount = proofreadResult?.issues?.length ?? 0
  const audienceCount = audienceResult?.reactions?.length ?? 0

  return (
    <div
      style={{
        marginTop: '1.25rem',
        border: '1px solid var(--color-rule)',
        background: 'var(--color-bg)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'stretch',
          borderBottom: '1px solid var(--color-rule)',
        }}
      >
        <TabBtn
          active={tab === 'proofread'}
          disabled={!proofreadResult}
          onClick={() => onTabChange('proofread')}
        >
          Proofread {proofreadResult ? `(${proofreadCount})` : ''}
        </TabBtn>
        <TabBtn
          active={tab === 'audience'}
          disabled={!audienceResult}
          onClick={() => onTabChange('audience')}
        >
          Audience {audienceResult ? `(${audienceCount})` : ''}
        </TabBtn>
        <button
          type="button"
          onClick={onClear}
          aria-label="Clear review results"
          style={{
            marginLeft: 'auto',
            background: 'transparent',
            border: 'none',
            color: 'var(--color-ink-muted)',
            padding: '0.6rem 0.9rem',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.3rem',
            fontSize: '0.75rem',
          }}
        >
          <X size={14} /> Clear
        </button>
      </div>

      <div style={{ padding: '1rem 1.1rem' }}>
        {tab === 'proofread' && proofreadResult && (
          <ProofreadView issues={proofreadResult.issues ?? []} />
        )}
        {tab === 'audience' && audienceResult && (
          <AudienceView reactions={audienceResult.reactions ?? []} />
        )}
      </div>
    </div>
  )
}

function TabBtn({ active, disabled, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '0.6rem 1rem',
        background: active ? 'var(--color-surface)' : 'transparent',
        border: 'none',
        borderRight: '1px solid var(--color-rule)',
        color: active ? 'var(--color-ink)' : 'var(--color-ink-muted)',
        fontSize: '0.8rem',
        fontWeight: active ? 600 : 500,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        fontFamily: 'var(--font-serif)',
      }}
    >
      {children}
    </button>
  )
}

function ProofreadView({ issues }) {
  if (issues.length === 0) {
    return (
      <p style={{ fontSize: '0.85rem', color: 'var(--color-ink-muted)', margin: 0 }}>
        No issues found. Looks clean.
      </p>
    )
  }

  const grouped = {}
  for (const issue of issues) {
    const key = issue.where ?? 'blog'
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(issue)
  }
  const order = ['blog', 'email_subject', 'email_preview', 'email_body']

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {order
        .filter((k) => grouped[k]?.length)
        .map((k) => (
          <div key={k}>
            <div
              style={{
                fontSize: '0.7rem',
                fontWeight: 600,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--color-ink-muted)',
                marginBottom: '0.5rem',
              }}
            >
              {WHERE_LABEL[k] ?? k} · {grouped[k].length}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {grouped[k].map((issue, idx) => (
                <div
                  key={idx}
                  style={{
                    border: '1px solid var(--color-rule)',
                    padding: '0.7rem 0.9rem',
                    background: 'var(--color-surface)',
                  }}
                >
                  <div
                    style={{
                      display: 'inline-block',
                      fontSize: '0.65rem',
                      padding: '0.15rem 0.45rem',
                      background: KIND_COLOR[issue.kind] ?? 'rgba(255,255,255,0.06)',
                      color: 'var(--color-ink)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      fontWeight: 600,
                      marginBottom: '0.5rem',
                    }}
                  >
                    {issue.kind}
                  </div>
                  <div
                    style={{
                      fontSize: '0.85rem',
                      color: 'var(--color-ink)',
                      marginBottom: '0.3rem',
                      fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                    }}
                  >
                    <span style={{ color: 'var(--color-ink-muted)' }}>“</span>
                    {issue.quote}
                    <span style={{ color: 'var(--color-ink-muted)' }}>”</span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-ink)', marginBottom: '0.3rem' }}>
                    → <span style={{ color: 'var(--color-accent)' }}>{issue.suggestion}</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)', lineHeight: 1.5 }}>
                    {issue.reason}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
    </div>
  )
}

function AudienceView({ reactions }) {
  if (reactions.length === 0) {
    return (
      <p style={{ fontSize: '0.85rem', color: 'var(--color-ink-muted)', margin: 0 }}>
        No reactions returned.
      </p>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {reactions.map((r) => (
        <div
          key={r.persona_id}
          style={{
            border: '1px solid var(--color-rule)',
            padding: '0.9rem 1rem',
            background: 'var(--color-surface)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              gap: '0.75rem',
              marginBottom: '0.6rem',
              flexWrap: 'wrap',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '1.05rem',
                color: 'var(--color-ink)',
              }}
            >
              {r.persona_name}
            </div>
            <ForwardScore score={r.would_forward} />
          </div>
          <p style={{ fontSize: '0.9rem', color: 'var(--color-ink)', margin: '0 0 0.6rem', lineHeight: 1.5 }}>
            {r.gut}
          </p>
          {r.what_landed && (
            <div style={{ marginBottom: '0.4rem' }}>
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'rgba(180,255,150,0.9)',
                  marginRight: '0.5rem',
                }}
              >
                ✓ Landed
              </span>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-ink)', lineHeight: 1.5 }}>
                {r.what_landed}
              </span>
            </div>
          )}
          {r.what_didnt && (
            <div>
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,170,130,0.9)',
                  marginRight: '0.5rem',
                }}
              >
                ✗ Didn't
              </span>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-ink)', lineHeight: 1.5 }}>
                {r.what_didnt}
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function ForwardScore({ score }) {
  const n = Math.max(1, Math.min(5, Number(score) || 1))
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.3rem',
        fontSize: '0.7rem',
        color: 'var(--color-ink-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        fontWeight: 600,
      }}
      title={`Would forward: ${n} / 5`}
    >
      Forward
      <span style={{ display: 'inline-flex', gap: '2px' }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <span
            key={i}
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: i <= n ? 'var(--color-accent)' : 'rgba(255,255,255,0.12)',
            }}
          />
        ))}
      </span>
    </span>
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
  fontFamily: 'var(--font-serif)',
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
    color: 'var(--color-accent-ink)',
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

const dangerBtn = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.4rem',
  padding: '0.7rem 1.1rem',
  background: 'transparent',
  color: '#ff7d7d',
  border: '1px solid rgba(255,125,125,0.4)',
  fontSize: '0.85rem',
  fontWeight: 500,
  cursor: 'pointer',
}
