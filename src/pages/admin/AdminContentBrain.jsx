import { useEffect, useState, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Trash2, Eye, EyeOff, Edit3, Save, X, ChevronLeft } from 'lucide-react'
import { useEnrollment } from '../../hooks/useEnrollment'
import { useAdminAPI } from '../../hooks/admin/useAdminAPI'
import AdminNav from '../../components/admin/AdminNav'

const TYPE_LABELS = {
  blog_post: 'Blog post',
  transcript: 'Transcript',
  style_guide: 'Style guide',
}

export default function AdminContentBrain() {
  const { user, signOut } = useEnrollment()
  const { request } = useAdminAPI()
  const [entries, setEntries] = useState([])
  const [totalActive, setTotalActive] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [showForm, setShowForm] = useState(false)
  const [formType, setFormType] = useState('blog_post')
  const [formTitle, setFormTitle] = useState('')
  const [formContent, setFormContent] = useState('')
  const [formUrl, setFormUrl] = useState('')
  const [formActive, setFormActive] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [editingId, setEditingId] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')

  const [selectedIds, setSelectedIds] = useState(() => new Set())
  const selectAllRef = useRef(null)

  const refetch = useCallback(async () => {
    setLoading(true)
    try {
      const data = await request('/api/admin/content/brain')
      setEntries(data.entries ?? [])
      setTotalActive(data.total_active_tokens ?? 0)
      setError(null)
    } catch (e) {
      setError(e.message)
    }
    setLoading(false)
  }, [request])

  useEffect(() => {
    refetch()
  }, [refetch])

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate =
        selectedIds.size > 0 && selectedIds.size < entries.length
    }
  }, [selectedIds, entries.length])

  function resetForm() {
    setFormTitle('')
    setFormContent('')
    setFormUrl('')
    setFormActive(true)
    setFormType('blog_post')
  }

  async function createEntry(e) {
    e.preventDefault()
    if (!formTitle.trim() || !formContent.trim()) return
    setSubmitting(true)
    try {
      await request('/api/admin/content/brain', {
        method: 'POST',
        body: {
          type: formType,
          title: formTitle.trim(),
          content: formContent,
          source_url: formUrl.trim() || null,
          is_active: formActive,
        },
      })
      resetForm()
      setShowForm(false)
      await refetch()
    } catch (e) {
      alert(`Create failed: ${e.message}`)
    }
    setSubmitting(false)
  }

  async function toggleActive(entry) {
    try {
      await request(`/api/admin/content/brain?id=${entry.id}`, {
        method: 'PATCH',
        body: { is_active: !entry.is_active },
      })
      await refetch()
    } catch (e) {
      alert(`Toggle failed: ${e.message}`)
    }
  }

  function toggleSelected(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function clearSelection() {
    setSelectedIds(new Set())
  }

  function toggleSelectAll() {
    setSelectedIds((prev) =>
      prev.size === entries.length && entries.length > 0
        ? new Set()
        : new Set(entries.map((e) => e.id)),
    )
  }

  async function bulkSetActive(isActive) {
    if (selectedIds.size === 0) return
    try {
      await request('/api/admin/content/brain', {
        method: 'PATCH',
        body: { ids: [...selectedIds], is_active: isActive },
      })
      clearSelection()
      await refetch()
    } catch (e) {
      alert(`Bulk update failed: ${e.message}`)
    }
  }

  async function deleteEntry(id) {
    if (!confirm('Delete this brain entry permanently?')) return
    try {
      await request(`/api/admin/content/brain?id=${id}`, { method: 'DELETE' })
      setSelectedIds((prev) => {
        if (!prev.has(id)) return prev
        const next = new Set(prev)
        next.delete(id)
        return next
      })
      await refetch()
    } catch (e) {
      alert(`Delete failed: ${e.message}`)
    }
  }

  function startEdit(entry) {
    setEditingId(entry.id)
    setEditTitle(entry.title)
    setEditContent(entry.content)
  }

  async function saveEdit() {
    try {
      await request(`/api/admin/content/brain?id=${editingId}`, {
        method: 'PATCH',
        body: { title: editTitle, content: editContent },
      })
      setEditingId(null)
      await refetch()
    } catch (e) {
      alert(`Save failed: ${e.message}`)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
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

        <div className="pp-header-row" style={{ marginBottom: '0.5rem' }}>
          <h1
            style={{
              fontFamily: '"DM Serif Display", serif',
              fontSize: 'clamp(1.5rem, 3vw, 2rem)',
              color: 'var(--color-ink)',
              margin: 0,
            }}
          >
            Brain
          </h1>
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.7rem 1.1rem',
              background: showForm ? 'transparent' : 'var(--color-accent)',
              color: showForm ? 'var(--color-ink)' : '#1C1A17',
              border: showForm ? '1px solid var(--color-rule)' : 'none',
              fontSize: '0.85rem',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            {showForm ? <X size={14} /> : <Plus size={14} />}
            {showForm ? 'Cancel' : 'New entry'}
          </button>
        </div>

        <p
          style={{
            color: 'var(--color-ink-muted)',
            fontSize: '0.85rem',
            margin: '0 0 1.5rem',
            lineHeight: 1.5,
          }}
        >
          Active entries are injected into Claude's system prompt as voice context. Approx{' '}
          <strong style={{ color: 'var(--color-ink)' }}>{totalActive.toLocaleString()}</strong> active
          tokens. Stay below ~150,000 to avoid context overruns.
        </p>

        {entries.length > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              padding: '0.6rem 0.75rem',
              marginBottom: '1rem',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-rule)',
            }}
          >
            <label
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.8rem',
                color: 'var(--color-ink-muted)',
                cursor: 'pointer',
                userSelect: 'none',
              }}
            >
              <input
                ref={selectAllRef}
                type="checkbox"
                checked={selectedIds.size === entries.length && entries.length > 0}
                onChange={toggleSelectAll}
              />
              {selectedIds.size > 0
                ? `${selectedIds.size} selected`
                : `${entries.length} entries · ${entries.filter((e) => e.is_active).length} active`}
            </label>
            {selectedIds.size > 0 && (
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <button
                  type="button"
                  onClick={() => bulkSetActive(true)}
                  style={bulkBtnStyle}
                >
                  <Eye size={14} /> Activate
                </button>
                <button
                  type="button"
                  onClick={() => bulkSetActive(false)}
                  style={bulkBtnStyle}
                >
                  <EyeOff size={14} /> Deactivate
                </button>
                <button
                  type="button"
                  onClick={clearSelection}
                  style={bulkBtnStyle}
                  aria-label="Clear selection"
                >
                  <X size={14} /> Clear
                </button>
              </div>
            )}
          </div>
        )}

        {showForm && (
          <form
            onSubmit={createEntry}
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-rule)',
              padding: '1.25rem',
              marginBottom: '2rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
            }}
          >
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {Object.entries(TYPE_LABELS).map(([t, label]) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setFormType(t)}
                  style={{
                    fontSize: '0.75rem',
                    padding: '0.4rem 0.75rem',
                    background: formType === t ? 'var(--color-accent)' : 'transparent',
                    color: formType === t ? '#1C1A17' : 'var(--color-ink-muted)',
                    border: '1px solid var(--color-rule)',
                    cursor: 'pointer',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    fontWeight: 600,
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="Title"
              style={inputStyle}
              required
            />
            <input
              type="url"
              value={formUrl}
              onChange={(e) => setFormUrl(e.target.value)}
              placeholder="Optional source URL"
              style={inputStyle}
            />
            <textarea
              rows={12}
              value={formContent}
              onChange={(e) => setFormContent(e.target.value)}
              placeholder="Paste the full content here (markdown or plain text)…"
              style={{ ...inputStyle, resize: 'vertical', fontFamily: 'ui-monospace, SFMono-Regular, monospace', fontSize: '0.8rem' }}
              required
            />
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--color-ink)' }}>
              <input type="checkbox" checked={formActive} onChange={(e) => setFormActive(e.target.checked)} />
              Active (include in next draft generation)
            </label>
            <button
              type="submit"
              disabled={submitting || !formTitle.trim() || !formContent.trim()}
              style={{
                alignSelf: 'flex-start',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.7rem 1.1rem',
                background: 'var(--color-accent)',
                color: '#1C1A17',
                border: 'none',
                fontSize: '0.85rem',
                fontWeight: 500,
                cursor: 'pointer',
                opacity: submitting || !formTitle.trim() || !formContent.trim() ? 0.5 : 1,
              }}
            >
              <Plus size={14} /> Add to brain
            </button>
          </form>
        )}

        {error && <p style={{ color: '#ff7d7d', fontSize: '0.85rem' }}>{error}</p>}
        {loading && <p style={{ color: 'var(--color-ink-muted)', fontSize: '0.9rem' }}>Loading…</p>}
        {!loading && entries.length === 0 && (
          <p style={{ color: 'var(--color-ink-muted)', fontSize: '0.9rem' }}>
            No brain entries yet. Add your style guide and a few past pieces.
          </p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {entries.map((entry) => {
            const isEditing = editingId === entry.id
            return (
              <div
                key={entry.id}
                style={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-rule)',
                  padding: '1rem 1.25rem',
                  opacity: entry.is_active ? 1 : 0.55,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                  <input
                    type="checkbox"
                    checked={selectedIds.has(entry.id)}
                    onChange={() => toggleSelected(entry.id)}
                    aria-label={`Select ${entry.title}`}
                    style={{ marginTop: '0.25rem', cursor: 'pointer', flexShrink: 0 }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: 'inline-block',
                        fontSize: '0.65rem',
                        padding: '0.15rem 0.4rem',
                        background: 'rgba(255,255,255,0.05)',
                        color: 'var(--color-ink-muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        fontWeight: 600,
                        marginBottom: '0.4rem',
                      }}
                    >
                      {TYPE_LABELS[entry.type] ?? entry.type}
                      {entry.token_estimate ? ` · ~${entry.token_estimate.toLocaleString()} tok` : ''}
                    </div>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        style={inputStyle}
                      />
                    ) : (
                      <div style={{ fontSize: '1rem', color: 'var(--color-ink)' }}>{entry.title}</div>
                    )}
                    {entry.source_url && !isEditing && (
                      <a
                        href={entry.source_url}
                        target="_blank"
                        rel="noreferrer"
                        style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)' }}
                      >
                        {entry.source_url}
                      </a>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button
                      type="button"
                      onClick={() => toggleActive(entry)}
                      style={iconBtnStyle}
                      aria-label={entry.is_active ? 'Disable' : 'Enable'}
                    >
                      {entry.is_active ? <Eye size={14} /> : <EyeOff size={14} />}
                    </button>
                    {isEditing ? (
                      <>
                        <button type="button" onClick={() => setEditingId(null)} style={iconBtnStyle} aria-label="Cancel">
                          <X size={14} />
                        </button>
                        <button type="button" onClick={saveEdit} style={iconBtnStyle} aria-label="Save">
                          <Save size={14} />
                        </button>
                      </>
                    ) : (
                      <button type="button" onClick={() => startEdit(entry)} style={iconBtnStyle} aria-label="Edit">
                        <Edit3 size={14} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => deleteEntry(entry.id)}
                      style={iconBtnStyle}
                      aria-label="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                {isEditing && (
                  <textarea
                    rows={10}
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    style={{
                      ...inputStyle,
                      marginTop: '0.75rem',
                      resize: 'vertical',
                      fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                      fontSize: '0.8rem',
                    }}
                  />
                )}
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}

const inputStyle = {
  width: '100%',
  padding: '0.6rem 0.8rem',
  background: 'var(--color-bg)',
  border: '1px solid var(--color-rule)',
  color: 'var(--color-ink)',
  fontSize: '0.9rem',
  fontFamily: '"DM Sans", sans-serif',
  outline: 'none',
}

const iconBtnStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '32px',
  height: '32px',
  border: '1px solid var(--color-rule)',
  background: 'transparent',
  color: 'var(--color-ink-muted)',
  cursor: 'pointer',
  flexShrink: 0,
}

const bulkBtnStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.3rem',
  padding: '0.4rem 0.7rem',
  border: '1px solid var(--color-rule)',
  background: 'transparent',
  color: 'var(--color-ink)',
  fontSize: '0.75rem',
  fontWeight: 500,
  cursor: 'pointer',
}
