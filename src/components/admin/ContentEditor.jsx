import { useState, useEffect, useCallback } from 'react'
import { Trash2, Plus, ArrowUp, ArrowDown, Pencil } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import FileUpload from './FileUpload'

const TYPES = ['recording', 'download', 'bonus', 'slide_deck', 'resource', 'link']
const AVAILABILITY = ['always', 'post_webinar']

const EMPTY_DRAFT = {
  title: '',
  type: 'resource',
  available_after: 'always',
  description: '',
  file_url: '',
}

export default function ContentEditor({ workshopId }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editingId, setEditingId] = useState(null) // null | item.id | 'new'
  const [draft, setDraft] = useState(null)
  const [saving, setSaving] = useState(false)

  const refetch = useCallback(async () => {
    if (!workshopId) {
      setItems([])
      setLoading(false)
      return
    }
    setLoading(true)
    const { data, error: err } = await supabase
      .from('webinar_content')
      .select('*')
      .eq('webinar_id', workshopId)
      .order('sort_order', { ascending: true })
    if (err) setError(err.message)
    else setItems(data ?? [])
    setLoading(false)
  }, [workshopId])

  useEffect(() => {
    refetch()
  }, [refetch])

  function startEdit(item) {
    setError(null)
    setEditingId(item.id)
    setDraft({
      title: item.title ?? '',
      type: item.type ?? 'resource',
      available_after: item.available_after ?? 'always',
      description: item.description ?? '',
      file_url: item.file_url ?? '',
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

  function updateDraft(field, value) {
    setDraft((d) => ({ ...d, [field]: value }))
  }

  async function save() {
    if (!draft) return
    if (!draft.title.trim()) {
      setError('Title is required')
      return
    }
    setSaving(true)
    setError(null)
    if (editingId === 'new') {
      const nextOrder = items.length ? Math.max(...items.map((i) => i.sort_order ?? 0)) + 1 : 0
      const { data, error: err } = await supabase
        .from('webinar_content')
        .insert({
          webinar_id: workshopId,
          title: draft.title,
          type: draft.type,
          available_after: draft.available_after,
          description: draft.description,
          file_url: draft.file_url,
          sort_order: nextOrder,
        })
        .select()
        .single()
      setSaving(false)
      if (err) {
        setError(err.message)
        return
      }
      setItems((prev) => [...prev, data])
    } else {
      const { error: err } = await supabase
        .from('webinar_content')
        .update({
          title: draft.title,
          type: draft.type,
          available_after: draft.available_after,
          description: draft.description,
          file_url: draft.file_url,
        })
        .eq('id', editingId)
      setSaving(false)
      if (err) {
        setError(err.message)
        return
      }
      setItems((prev) => prev.map((i) => (i.id === editingId ? { ...i, ...draft } : i)))
    }
    setEditingId(null)
    setDraft(null)
  }

  async function deleteItem(id) {
    if (!confirm('Delete this content item?')) return
    const { error: err } = await supabase.from('webinar_content').delete().eq('id', id)
    if (err) {
      setError(err.message)
      return
    }
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  async function move(id, direction) {
    const idx = items.findIndex((i) => i.id === id)
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (idx < 0 || swapIdx < 0 || swapIdx >= items.length) return
    const a = items[idx]
    const b = items[swapIdx]
    await Promise.all([
      supabase.from('webinar_content').update({ sort_order: b.sort_order }).eq('id', a.id),
      supabase.from('webinar_content').update({ sort_order: a.sort_order }).eq('id', b.id),
    ])
    refetch()
  }

  if (!workshopId) {
    return (
      <p style={{ color: 'var(--color-ink-muted)', fontSize: '0.9rem' }}>
        Save the workshop first to start adding content.
      </p>
    )
  }
  if (loading) {
    return <p style={{ color: 'var(--color-ink-muted)', fontSize: '0.9rem' }}>Loading content…</p>
  }

  const isEditing = editingId !== null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {error && <p style={{ color: '#ff7d7d', fontSize: '0.85rem', margin: 0 }}>{error}</p>}

      {items.length === 0 && editingId !== 'new' ? (
        <p style={{ color: 'var(--color-ink-muted)', fontSize: '0.9rem' }}>No content yet.</p>
      ) : (
        items.map((item, idx) =>
          editingId === item.id ? (
            <EditForm
              key={item.id}
              draft={draft}
              saving={saving}
              workshopId={workshopId}
              onChange={updateDraft}
              onSave={save}
              onCancel={cancel}
            />
          ) : (
            <StaticRow
              key={item.id}
              item={item}
              isFirst={idx === 0}
              isLast={idx === items.length - 1}
              disabled={isEditing}
              onEdit={() => startEdit(item)}
              onMoveUp={() => move(item.id, 'up')}
              onMoveDown={() => move(item.id, 'down')}
              onDelete={() => deleteItem(item.id)}
            />
          ),
        )
      )}

      {editingId === 'new' ? (
        <EditForm
          draft={draft}
          saving={saving}
          workshopId={workshopId}
          onChange={updateDraft}
          onSave={save}
          onCancel={cancel}
        />
      ) : (
        <div>
          <button
            type="button"
            onClick={startAdd}
            disabled={isEditing}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.6rem 1rem',
              background: 'var(--color-accent)',
              color: '#1C1A17',
              border: 'none',
              cursor: isEditing ? 'not-allowed' : 'pointer',
              opacity: isEditing ? 0.5 : 1,
              fontSize: '0.85rem',
              fontWeight: 500,
              fontFamily: '"DM Sans", sans-serif',
            }}
          >
            <Plus size={14} />
            Add content item
          </button>
        </div>
      )}
    </div>
  )
}

function StaticRow({ item, isFirst, isLast, disabled, onEdit, onMoveUp, onMoveDown, onDelete }) {
  const hasTitle = item.title && item.title.trim().length > 0
  return (
    <div
      style={{
        border: '1px solid var(--color-rule)',
        background: 'var(--color-surface)',
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', minWidth: 0 }}>
          <div
            style={{
              fontSize: '0.95rem',
              fontWeight: 500,
              color: hasTitle ? 'var(--color-ink)' : 'var(--color-ink-muted)',
              fontStyle: hasTitle ? 'normal' : 'italic',
            }}
          >
            {hasTitle ? item.title : '(no title)'}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            <Badge>{item.type}</Badge>
            <Badge>{item.available_after}</Badge>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexShrink: 0 }}>
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

      {item.description && (
        <div
          style={{
            fontSize: '0.85rem',
            color: 'var(--color-ink-muted)',
            whiteSpace: 'pre-wrap',
          }}
        >
          {item.description}
        </div>
      )}

      {item.file_url && (
        <code
          style={{
            fontSize: '0.72rem',
            color: 'var(--color-ink-muted)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={item.file_url}
        >
          {item.file_url}
        </code>
      )}
    </div>
  )
}

function EditForm({ draft, saving, workshopId, onChange, onSave, onCancel }) {
  return (
    <div
      style={{
        border: '1px solid var(--color-rule)',
        background: 'var(--color-surface)',
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
      }}
    >
      <div className="pp-grid-content-editor">
        <input
          type="text"
          value={draft.title}
          onChange={(e) => onChange('title', e.target.value)}
          placeholder="Title"
          style={inputStyle}
          autoFocus
        />
        <select
          value={draft.type}
          onChange={(e) => onChange('type', e.target.value)}
          style={inputStyle}
        >
          {TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select
          value={draft.available_after}
          onChange={(e) => onChange('available_after', e.target.value)}
          style={inputStyle}
        >
          {AVAILABILITY.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </div>

      <textarea
        value={draft.description}
        onChange={(e) => onChange('description', e.target.value)}
        placeholder="Description (optional)"
        rows={2}
        style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
      />

      <div className="pp-grid-2">
        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          <span style={labelStyle}>File URL</span>
          <input
            type="text"
            value={draft.file_url}
            onChange={(e) => onChange('file_url', e.target.value)}
            placeholder="Paste URL or use upload →"
            style={inputStyle}
          />
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          <span style={labelStyle}>Storage upload</span>
          <FileUpload
            workshopId={workshopId}
            value={draft.file_url?.startsWith(`${workshopId}/`) ? draft.file_url : ''}
            onChange={(path) => onChange('file_url', path)}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          style={{
            padding: '0.5rem 1rem',
            background: 'transparent',
            color: 'var(--color-ink)',
            border: '1px solid var(--color-rule)',
            cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.6 : 1,
            fontSize: '0.85rem',
            fontFamily: '"DM Sans", sans-serif',
          }}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          style={{
            padding: '0.5rem 1rem',
            background: 'var(--color-accent)',
            color: '#1C1A17',
            border: 'none',
            cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.6 : 1,
            fontSize: '0.85rem',
            fontWeight: 500,
            fontFamily: '"DM Sans", sans-serif',
          }}
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  )
}

function Badge({ children }) {
  return (
    <span
      style={{
        fontSize: '0.7rem',
        fontWeight: 600,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: 'var(--color-ink-muted)',
        border: '1px solid var(--color-rule)',
        padding: '0.15rem 0.45rem',
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
  fontFamily: '"DM Sans", sans-serif',
  outline: 'none',
}

const labelStyle = {
  fontSize: '0.7rem',
  fontWeight: 600,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--color-ink-muted)',
}
