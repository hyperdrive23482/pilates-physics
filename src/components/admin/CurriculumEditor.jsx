import { useState, useEffect, useCallback } from 'react'
import { Trash2, Plus, ArrowUp, ArrowDown, Pencil, Paperclip } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { parseVimeoUrl, vimeoOEmbedUrl } from '../../lib/vimeo'
import ContentEditor from './ContentEditor'

// The curriculum of a course: an ordered list of modules, each one a Vimeo
// video plus whatever downloads belong with it.
//
// Reordering goes through the reorder_course_modules RPC rather than a pair
// of UPDATEs, which is how ContentEditor moves webinar_content rows. The
// unique constraint on (webinar_id, sort_order) is DEFERRABLE, so the whole
// renumber has to land inside one transaction; two supabase-js calls are two
// transactions and would fail. See migration 044.

const EMPTY_DRAFT = {
  title: '',
  summary: '',
  vimeo_url: '',
  duration_min: '',
}

export default function CurriculumEditor({ workshopId }) {
  const [modules, setModules] = useState([])
  const [counts, setCounts] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editingId, setEditingId] = useState(null) // null | module.id | 'new'
  const [draft, setDraft] = useState(null)
  const [saving, setSaving] = useState(false)
  const [busy, setBusy] = useState(false)
  const [openAttachments, setOpenAttachments] = useState(null)

  const refetch = useCallback(async () => {
    if (!workshopId) {
      setModules([])
      setLoading(false)
      return
    }
    setLoading(true)
    const [{ data, error: err }, { data: content }] = await Promise.all([
      supabase
        .from('course_modules')
        .select('*')
        .eq('webinar_id', workshopId)
        .order('sort_order', { ascending: true }),
      supabase
        .from('webinar_content')
        .select('module_id')
        .eq('webinar_id', workshopId)
        .not('module_id', 'is', null),
    ])
    if (err) setError(err.message)
    else setModules(data ?? [])
    const tally = {}
    for (const row of content ?? []) {
      tally[row.module_id] = (tally[row.module_id] ?? 0) + 1
    }
    setCounts(tally)
    setLoading(false)
  }, [workshopId])

  useEffect(() => {
    refetch()
  }, [refetch])

  function startEdit(m) {
    setError(null)
    setEditingId(m.id)
    setDraft({
      title: m.title ?? '',
      summary: m.summary ?? '',
      vimeo_url: m.vimeo_url ?? '',
      duration_min: m.duration_min ?? '',
    })
  }

  function startAdd() {
    if (!workshopId) return
    setError(null)
    setEditingId('new')
    setDraft({ ...EMPTY_DRAFT })
  }

  function cancel() {
    setEditingId(null)
    setDraft(null)
    setError(null)
  }

  async function save() {
    if (!draft) return
    if (!draft.title.trim()) return setError('Title is required')
    if (draft.vimeo_url.trim() && !parseVimeoUrl(draft.vimeo_url)) {
      return setError('That is not a Vimeo URL I recognise. Clear it or paste the share URL.')
    }

    const payload = {
      title: draft.title.trim(),
      summary: draft.summary.trim() || null,
      vimeo_url: draft.vimeo_url.trim() || null,
      duration_min: draft.duration_min === '' ? null : Number(draft.duration_min),
    }

    setSaving(true)
    setError(null)
    if (editingId === 'new') {
      const nextOrder = modules.length
        ? Math.max(...modules.map((m) => m.sort_order ?? 0)) + 1
        : 0
      const { error: err } = await supabase
        .from('course_modules')
        .insert({ webinar_id: workshopId, sort_order: nextOrder, ...payload })
      setSaving(false)
      if (err) return setError(err.message)
    } else {
      const { error: err } = await supabase
        .from('course_modules')
        .update(payload)
        .eq('id', editingId)
      setSaving(false)
      if (err) return setError(err.message)
    }
    setEditingId(null)
    setDraft(null)
    refetch()
  }

  async function remove(m) {
    const n = counts[m.id] ?? 0
    const extra = n
      ? `\n\nIts ${n} attachment${n === 1 ? '' : 's'} will move to the course resources section, not be deleted.`
      : ''
    if (!confirm(`Delete "${m.title}"?${extra}`)) return
    const { error: err } = await supabase.from('course_modules').delete().eq('id', m.id)
    if (err) return setError(err.message)
    refetch()
  }

  // Swap two rows, then send the whole list so the RPC renumbers 0..n-1 in
  // one statement. Sending the full order also repairs any gaps left behind
  // by a deleted module.
  async function move(id, direction) {
    const idx = modules.findIndex((m) => m.id === id)
    const swap = direction === 'up' ? idx - 1 : idx + 1
    if (idx < 0 || swap < 0 || swap >= modules.length) return

    const next = [...modules]
    ;[next[idx], next[swap]] = [next[swap], next[idx]]
    setModules(next.map((m, i) => ({ ...m, sort_order: i }))) // optimistic
    setBusy(true)
    const { error: err } = await supabase.rpc('reorder_course_modules', {
      p_webinar_id: workshopId,
      p_module_ids: next.map((m) => m.id),
    })
    setBusy(false)
    if (err) setError(err.message)
    refetch()
  }

  if (!workshopId) {
    return <Muted>Save the course first to start adding modules.</Muted>
  }
  if (loading) return <Muted>Loading curriculum…</Muted>

  const isEditing = editingId !== null
  const withVideo = modules.filter((m) => m.vimeo_url).length
  const totalMin = modules.reduce((sum, m) => sum + (m.duration_min ?? 0), 0)
  const missing = modules.length - withVideo

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Banner count={modules.length} totalMin={totalMin} missing={missing} />

      {error && <p style={{ color: '#ff7d7d', fontSize: '0.85rem', margin: 0 }}>{error}</p>}

      {modules.length === 0 && editingId !== 'new' ? (
        <Muted>No modules yet. Add the first one.</Muted>
      ) : (
        modules.map((m, idx) =>
          editingId === m.id ? (
            <ModuleForm
              key={m.id}
              draft={draft}
              saving={saving}
              onChange={(f, v) => setDraft((d) => ({ ...d, [f]: v }))}
              onSave={save}
              onCancel={cancel}
            />
          ) : (
            <ModuleRow
              key={m.id}
              module={m}
              index={idx}
              attachmentCount={counts[m.id] ?? 0}
              isFirst={idx === 0}
              isLast={idx === modules.length - 1}
              disabled={isEditing || busy}
              attachmentsOpen={openAttachments === m.id}
              onToggleAttachments={() =>
                setOpenAttachments((cur) => (cur === m.id ? null : m.id))
              }
              workshopId={workshopId}
              onEdit={() => startEdit(m)}
              onMoveUp={() => move(m.id, 'up')}
              onMoveDown={() => move(m.id, 'down')}
              onDelete={() => remove(m)}
              onAttachmentsChanged={refetch}
            />
          ),
        )
      )}

      {editingId === 'new' ? (
        <ModuleForm
          draft={draft}
          saving={saving}
          onChange={(f, v) => setDraft((d) => ({ ...d, [f]: v }))}
          onSave={save}
          onCancel={cancel}
        />
      ) : (
        <div>
          <button type="button" onClick={startAdd} disabled={isEditing} style={primaryBtn(isEditing)}>
            <Plus size={14} /> Add module
          </button>
        </div>
      )}

      <section style={{ marginTop: '1.5rem' }}>
        <h3 style={sectionHeading}>Course resources</h3>
        <p style={{ fontSize: '0.78rem', color: 'var(--color-ink-muted)', margin: '0 0 0.75rem' }}>
          Downloads and links that belong to the whole course rather than to one
          module. These show under the player on every module.
        </p>
        <ContentEditor workshopId={workshopId} moduleFilter="course" />
      </section>
    </div>
  )
}

function Banner({ count, totalMin, missing }) {
  const ready = count > 0 && missing === 0
  return (
    <div
      style={{
        border: '1px solid var(--color-rule)',
        borderLeft: `3px solid ${ready ? 'var(--color-accent)' : '#c9a227'}`,
        background: 'var(--color-surface)',
        padding: '0.8rem 1rem',
        fontSize: '0.85rem',
        color: 'var(--color-ink)',
      }}
    >
      <strong>
        {count} module{count === 1 ? '' : 's'}
      </strong>
      {totalMin > 0 && <span style={{ color: 'var(--color-ink-muted)' }}> · {totalMin} minutes</span>}
      <span style={{ color: 'var(--color-ink-muted)' }}>
        {' '}
        ·{' '}
        {count === 0
          ? 'nothing to deliver yet'
          : missing === 0
          ? 'every module has a video'
          : `${missing} missing a video`}
      </span>
      {missing > 0 && count > 0 && (
        <div style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)', marginTop: '0.3rem' }}>
          Modules with no video still appear in the course, marked coming soon.
        </div>
      )}
    </div>
  )
}

function ModuleRow({
  module: m,
  index,
  attachmentCount,
  isFirst,
  isLast,
  disabled,
  attachmentsOpen,
  onToggleAttachments,
  workshopId,
  onEdit,
  onMoveUp,
  onMoveDown,
  onDelete,
  onAttachmentsChanged,
}) {
  const video = parseVimeoUrl(m.vimeo_url)
  return (
    <div
      style={{
        border: '1px solid var(--color-rule)',
        background: 'var(--color-surface)',
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.6rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
        <span
          aria-hidden="true"
          style={{
            flexShrink: 0,
            width: '26px',
            height: '26px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid var(--color-rule)',
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: '0.75rem',
            color: 'var(--color-ink-muted)',
          }}
        >
          {index + 1}
        </span>

        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          <div style={{ fontSize: '0.95rem', fontWeight: 500, color: 'var(--color-ink)' }}>
            {m.title}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', alignItems: 'center' }}>
            <Dot ok={!!video} />
            <span style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)' }}>
              {video ? `Vimeo ${video.id}` : 'no video yet'}
            </span>
            {m.duration_min ? <Badge>{m.duration_min} min</Badge> : null}
            {attachmentCount > 0 && <Badge>{attachmentCount} attached</Badge>}
          </div>
          {m.summary && (
            <div style={{ fontSize: '0.82rem', color: 'var(--color-ink-muted)', whiteSpace: 'pre-wrap' }}>
              {m.summary}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexShrink: 0 }}>
          <IconBtn disabled={disabled} onClick={onToggleAttachments} aria-label="Attachments">
            <Paperclip size={14} />
          </IconBtn>
          <IconBtn disabled={disabled} onClick={onEdit} aria-label="Edit">
            <Pencil size={14} />
          </IconBtn>
          <IconBtn disabled={disabled || isFirst} onClick={onMoveUp} aria-label="Move up">
            <ArrowUp size={14} />
          </IconBtn>
          <IconBtn disabled={disabled || isLast} onClick={onMoveDown} aria-label="Move down">
            <ArrowDown size={14} />
          </IconBtn>
          <IconBtn disabled={disabled} onClick={onDelete} aria-label="Delete">
            <Trash2 size={14} />
          </IconBtn>
        </div>
      </div>

      {attachmentsOpen && (
        <div
          style={{
            borderTop: '1px solid var(--color-rule)',
            paddingTop: '0.85rem',
            marginTop: '0.2rem',
          }}
        >
          <p style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)', margin: '0 0 0.6rem' }}>
            Files and links shown under this module only.
          </p>
          <ContentEditor
            workshopId={workshopId}
            moduleFilter={m.id}
            key={`${m.id}-attachments`}
          />
          <div style={{ marginTop: '0.5rem' }}>
            <button type="button" onClick={onAttachmentsChanged} style={ghostBtn}>
              Refresh counts
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function ModuleForm({ draft, saving, onChange, onSave, onCancel }) {
  const trimmed = draft.vimeo_url.trim()
  const video = trimmed ? parseVimeoUrl(trimmed) : null
  const badUrl = trimmed.length > 0 && !video

  return (
    <div
      style={{
        border: '1px solid var(--color-accent)',
        background: 'var(--color-surface)',
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
      }}
    >
      <div className="pp-grid-2">
        <Field label="Title *">
          <input
            type="text"
            value={draft.title}
            onChange={(e) => onChange('title', e.target.value)}
            style={inputStyle}
            autoFocus
          />
        </Field>
        <Field label="Runtime (min)" hint="Adds up to the course total on the Details tab">
          <input
            type="number"
            min="1"
            value={draft.duration_min}
            onChange={(e) => onChange('duration_min', e.target.value)}
            style={inputStyle}
          />
        </Field>
      </div>

      <Field label="Summary" hint="Shown under the player. Leave blank if the video speaks for itself.">
        <textarea
          value={draft.summary}
          onChange={(e) => onChange('summary', e.target.value)}
          rows={2}
          style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
        />
      </Field>

      <Field
        label="Vimeo URL"
        hint="Paste the share URL. Keep the hash on unlisted videos or the player will not load."
      >
        <input
          type="text"
          value={draft.vimeo_url}
          onChange={(e) => onChange('vimeo_url', e.target.value)}
          placeholder="https://vimeo.com/123456789/abcdef1234"
          style={{
            ...inputStyle,
            borderColor: badUrl ? '#ff7d7d' : 'var(--color-rule)',
          }}
        />
      </Field>

      <VimeoPreview url={trimmed} video={video} badUrl={badUrl} />

      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
        <button type="button" onClick={onCancel} disabled={saving} style={ghostBtn}>
          Cancel
        </button>
        <button type="button" onClick={onSave} disabled={saving} style={primaryBtn(saving)}>
          {saving ? 'Saving…' : 'Save module'}
        </button>
      </div>
    </div>
  )
}

// Two different failures worth telling apart. A URL that does not parse is a
// typo. A URL that parses but has no thumbnail usually means the video is
// private or the embed domain is not allowed, which looks fine here and dead
// in the portal.
function VimeoPreview({ url, video, badUrl }) {
  const [state, setState] = useState({ status: 'idle' })

  useEffect(() => {
    if (!video) {
      setState({ status: 'idle' })
      return
    }
    let cancelled = false
    setState({ status: 'loading' })
    fetch(vimeoOEmbedUrl(url))
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d) => {
        if (!cancelled) setState({ status: 'ok', thumb: d.thumbnail_url, title: d.title })
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'unreachable' })
      })
    return () => {
      cancelled = true
    }
  }, [url, video])

  if (badUrl) {
    return (
      <p style={{ color: '#ff7d7d', fontSize: '0.8rem', margin: 0 }}>
        Not a Vimeo URL I recognise. Expected something like
        https://vimeo.com/123456789/abcdef1234
      </p>
    )
  }
  if (!video) return null

  return (
    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
      {state.status === 'ok' && state.thumb ? (
        <img
          src={state.thumb}
          alt=""
          style={{ width: '140px', border: '1px solid var(--color-rule)' }}
        />
      ) : null}
      <div style={{ fontSize: '0.78rem', color: 'var(--color-ink-muted)' }}>
        <div>
          id <code>{video.id}</code>
          {video.hash ? (
            <>
              {' '}
              · hash <code>{video.hash}</code>
            </>
          ) : (
            ' · no hash, so this video must be public to play'
          )}
        </div>
        {state.status === 'loading' && <div>Checking Vimeo…</div>}
        {state.status === 'ok' && state.title && <div>“{state.title}”</div>}
        {state.status === 'unreachable' && (
          <div style={{ color: '#c9a227' }}>
            The URL is well formed, but Vimeo would not return a preview. Check the
            video is not private and that embedding is allowed on this domain.
          </div>
        )}
      </div>
    </div>
  )
}

function Dot({ ok }) {
  return (
    <span
      aria-hidden="true"
      style={{
        width: '7px',
        height: '7px',
        borderRadius: '50%',
        background: ok ? '#4a9d5f' : 'var(--color-ink-muted)',
        opacity: ok ? 1 : 0.5,
        display: 'inline-block',
      }}
    />
  )
}

function Field({ label, hint, children }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
      <span style={labelStyle}>{label}</span>
      {children}
      {hint ? (
        <span style={{ fontSize: '0.72rem', color: 'var(--color-ink-muted)' }}>{hint}</span>
      ) : null}
    </label>
  )
}

function Muted({ children }) {
  return <p style={{ color: 'var(--color-ink-muted)', fontSize: '0.9rem' }}>{children}</p>
}

function Badge({ children }) {
  return (
    <span
      style={{
        fontSize: '0.68rem',
        fontWeight: 600,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: 'var(--color-ink-muted)',
        border: '1px solid var(--color-rule)',
        padding: '0.1rem 0.4rem',
      }}
    >
      {children}
    </span>
  )
}

function IconBtn({ children, disabled, onClick, ...rest }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      style={{
        background: 'transparent',
        border: '1px solid var(--color-rule)',
        color: 'var(--color-ink-muted)',
        width: '28px',
        height: '28px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
      }}
      {...rest}
    >
      {children}
    </button>
  )
}

const inputStyle = {
  padding: '0.5rem 0.7rem',
  background: 'var(--color-bg)',
  color: 'var(--color-ink)',
  border: '1px solid var(--color-rule)',
  fontSize: '0.85rem',
  fontFamily: 'var(--font-serif)',
  outline: 'none',
}

const labelStyle = {
  fontSize: '0.7rem',
  fontWeight: 600,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--color-ink-muted)',
}

const sectionHeading = {
  fontFamily: 'var(--font-serif)',
  fontSize: '1rem',
  color: 'var(--color-ink)',
  margin: '0 0 0.3rem',
}

const ghostBtn = {
  padding: '0.5rem 1rem',
  background: 'transparent',
  color: 'var(--color-ink)',
  border: '1px solid var(--color-rule)',
  cursor: 'pointer',
  fontSize: '0.85rem',
  fontFamily: 'var(--font-serif)',
}

function primaryBtn(disabled) {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.4rem',
    padding: '0.55rem 1rem',
    background: 'var(--color-accent)',
    color: 'var(--color-accent-ink)',
    border: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    fontSize: '0.85rem',
    fontWeight: 500,
    fontFamily: 'var(--font-serif)',
  }
}
