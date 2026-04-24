import { useState, useEffect, useCallback } from 'react'
import { Trash2, Plus, ArrowUp, ArrowDown } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import FileUpload from './FileUpload'

const TYPES = ['recording', 'download', 'bonus', 'slide_deck', 'resource', 'link']
const AVAILABILITY = ['always', 'post_webinar']

export default function ContentEditor({ webinarId }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refetch = useCallback(async () => {
    if (!webinarId) {
      setItems([])
      setLoading(false)
      return
    }
    setLoading(true)
    const { data, error: err } = await supabase
      .from('webinar_content')
      .select('*')
      .eq('webinar_id', webinarId)
      .order('sort_order', { ascending: true })
    if (err) setError(err.message)
    else setItems(data ?? [])
    setLoading(false)
  }, [webinarId])

  useEffect(() => {
    refetch()
  }, [refetch])

  async function addItem() {
    if (!webinarId) return
    const nextOrder = items.length ? Math.max(...items.map((i) => i.sort_order ?? 0)) + 1 : 0
    const { data, error: err } = await supabase
      .from('webinar_content')
      .insert({
        webinar_id: webinarId,
        type: 'resource',
        title: 'Untitled',
        sort_order: nextOrder,
        available_after: 'always',
      })
      .select()
      .single()
    if (err) setError(err.message)
    else setItems((prev) => [...prev, data])
  }

  async function updateItem(id, patch) {
    const { error: err } = await supabase.from('webinar_content').update(patch).eq('id', id)
    if (err) {
      setError(err.message)
      return
    }
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)))
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
    // Swap sort_order in both rows
    await Promise.all([
      supabase.from('webinar_content').update({ sort_order: b.sort_order }).eq('id', a.id),
      supabase.from('webinar_content').update({ sort_order: a.sort_order }).eq('id', b.id),
    ])
    refetch()
  }

  if (!webinarId) {
    return (
      <p style={{ color: 'var(--color-ink-muted)', fontSize: '0.9rem' }}>
        Save the webinar first to start adding content.
      </p>
    )
  }
  if (loading) {
    return <p style={{ color: 'var(--color-ink-muted)', fontSize: '0.9rem' }}>Loading content…</p>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {error && <p style={{ color: '#ff7d7d', fontSize: '0.85rem', margin: 0 }}>{error}</p>}

      {items.length === 0 ? (
        <p style={{ color: 'var(--color-ink-muted)', fontSize: '0.9rem' }}>No content yet.</p>
      ) : (
        items.map((item, idx) => (
          <div
            key={item.id}
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
                value={item.title ?? ''}
                onChange={(e) => updateItem(item.id, { title: e.target.value })}
                placeholder="Title"
                style={inputStyle}
              />
              <select
                value={item.type}
                onChange={(e) => updateItem(item.id, { type: e.target.value })}
                style={inputStyle}
              >
                {TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <select
                value={item.available_after}
                onChange={(e) => updateItem(item.id, { available_after: e.target.value })}
                style={inputStyle}
              >
                {AVAILABILITY.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <IconBtn disabled={idx === 0} onClick={() => move(item.id, 'up')} aria-label="Move up">
                  <ArrowUp size={14} />
                </IconBtn>
                <IconBtn
                  disabled={idx === items.length - 1}
                  onClick={() => move(item.id, 'down')}
                  aria-label="Move down"
                >
                  <ArrowDown size={14} />
                </IconBtn>
                <IconBtn onClick={() => deleteItem(item.id)} aria-label="Delete">
                  <Trash2 size={14} />
                </IconBtn>
              </div>
            </div>

            <textarea
              value={item.description ?? ''}
              onChange={(e) => updateItem(item.id, { description: e.target.value })}
              placeholder="Description (optional)"
              rows={2}
              style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
            />

            <div className="pp-grid-2">
              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                <span style={labelStyle}>File URL</span>
                <input
                  type="text"
                  value={item.file_url ?? ''}
                  onChange={(e) => updateItem(item.id, { file_url: e.target.value })}
                  placeholder="Paste URL or use upload →"
                  style={inputStyle}
                />
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                <span style={labelStyle}>Storage upload</span>
                <FileUpload
                  webinarId={webinarId}
                  value={item.file_url?.startsWith(`${webinarId}/`) ? item.file_url : ''}
                  onChange={(path) => updateItem(item.id, { file_url: path })}
                />
              </div>
            </div>
          </div>
        ))
      )}

      <div>
        <button
          type="button"
          onClick={addItem}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.6rem 1rem',
            background: 'var(--color-accent)',
            color: '#1C1A17',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.85rem',
            fontWeight: 500,
            fontFamily: '"DM Sans", sans-serif',
          }}
        >
          <Plus size={14} />
          Add content item
        </button>
      </div>
    </div>
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
