import { useEffect, useState, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Plus, Trash2, ArrowRight, Archive, ChevronLeft } from 'lucide-react'
import { useEnrollment } from '../../hooks/useEnrollment'
import { useAdminAPI } from '../../hooks/admin/useAdminAPI'
import AdminNav from '../../components/admin/AdminNav'

export default function AdminContentIdeas() {
  const { user, signOut } = useEnrollment()
  const { request } = useAdminAPI()
  const navigate = useNavigate()
  const [ideas, setIdeas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [newTitle, setNewTitle] = useState('')
  const [newNotes, setNewNotes] = useState('')
  const [creating, setCreating] = useState(false)
  const [statusFilter, setStatusFilter] = useState('open')

  const refetch = useCallback(async () => {
    setLoading(true)
    try {
      const path =
        statusFilter === 'all'
          ? '/api/admin/content/ideas'
          : `/api/admin/content/ideas?status=${statusFilter}`
      const data = await request(path)
      setIdeas(data.ideas ?? [])
      setError(null)
    } catch (e) {
      setError(e.message)
    }
    setLoading(false)
  }, [request, statusFilter])

  useEffect(() => {
    refetch()
  }, [refetch])

  async function createIdea(e) {
    e.preventDefault()
    if (!newTitle.trim()) return
    setCreating(true)
    try {
      await request('/api/admin/content/ideas', {
        method: 'POST',
        body: { title: newTitle.trim(), notes: newNotes.trim() || null },
      })
      setNewTitle('')
      setNewNotes('')
      await refetch()
    } catch (e) {
      alert(`Create failed: ${e.message}`)
    }
    setCreating(false)
  }

  async function startDrafting(idea) {
    try {
      const { piece } = await request('/api/admin/content/pieces', {
        method: 'POST',
        body: { idea_id: idea.id },
      })
      navigate(`/admin/content/pieces/${piece.id}`)
    } catch (e) {
      alert(`Failed to start piece: ${e.message}`)
    }
  }

  async function archiveIdea(id) {
    if (!confirm('Archive this idea?')) return
    try {
      await request(`/api/admin/content/ideas?id=${id}`, {
        method: 'PATCH',
        body: { status: 'archived' },
      })
      await refetch()
    } catch (e) {
      alert(`Archive failed: ${e.message}`)
    }
  }

  async function deleteIdea(id) {
    if (!confirm('Delete this idea permanently?')) return
    try {
      await request(`/api/admin/content/ideas?id=${id}`, { method: 'DELETE' })
      await refetch()
    } catch (e) {
      alert(`Delete failed: ${e.message}`)
    }
  }

  return (
    <div style={{ minHeight: '100vh' }}>
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
          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(1.5rem, 3vw, 2rem)',
              color: 'var(--color-ink)',
              margin: 0,
            }}
          >
            Idea repository
          </h1>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            {['open', 'selected', 'archived', 'all'].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                style={{
                  fontSize: '0.75rem',
                  padding: '0.4rem 0.75rem',
                  background: statusFilter === s ? 'var(--color-accent)' : 'transparent',
                  color: statusFilter === s ? 'var(--color-accent-ink)' : 'var(--color-ink-muted)',
                  border: '1px solid var(--color-rule)',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  fontWeight: 600,
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <form
          onSubmit={createIdea}
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
          <input
            type="text"
            placeholder="Idea title (e.g. 'Why springs aren't weights')"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            style={inputStyle}
            disabled={creating}
          />
          <textarea
            rows={3}
            placeholder="Optional context, angle, or what you'd want covered…"
            value={newNotes}
            onChange={(e) => setNewNotes(e.target.value)}
            style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
            disabled={creating}
          />
          <button
            type="submit"
            disabled={creating || !newTitle.trim()}
            style={{
              alignSelf: 'flex-start',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.7rem 1.1rem',
              background: 'var(--color-accent)',
              color: 'var(--color-accent-ink)',
              border: 'none',
              fontSize: '0.85rem',
              fontWeight: 500,
              cursor: 'pointer',
              opacity: creating || !newTitle.trim() ? 0.5 : 1,
            }}
          >
            <Plus size={14} /> Capture idea
          </button>
        </form>

        {error && <p style={{ color: '#ff7d7d', fontSize: '0.85rem' }}>{error}</p>}
        {loading && <p style={{ color: 'var(--color-ink-muted)', fontSize: '0.9rem' }}>Loading…</p>}
        {!loading && ideas.length === 0 && (
          <p style={{ color: 'var(--color-ink-muted)', fontSize: '0.9rem' }}>
            No ideas yet. Capture one above.
          </p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {ideas.map((idea) => (
            <div
              key={idea.id}
              style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-rule)',
                padding: '1rem 1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.6rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: '1rem',
                      color: 'var(--color-ink)',
                      marginBottom: '0.25rem',
                    }}
                  >
                    {idea.title}
                  </div>
                  {idea.notes && (
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-ink-muted)', whiteSpace: 'pre-wrap' }}>
                      {idea.notes}
                    </div>
                  )}
                </div>
                <span
                  style={{
                    display: 'inline-block',
                    fontSize: '0.65rem',
                    padding: '0.2rem 0.5rem',
                    background: 'rgba(255,255,255,0.05)',
                    color: 'var(--color-ink-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    fontWeight: 600,
                    flexShrink: 0,
                  }}
                >
                  {idea.status}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                {idea.status !== 'archived' && (
                  <button type="button" onClick={() => archiveIdea(idea.id)} style={iconBtnStyle} aria-label="Archive">
                    <Archive size={14} />
                  </button>
                )}
                <button type="button" onClick={() => deleteIdea(idea.id)} style={iconBtnStyle} aria-label="Delete">
                  <Trash2 size={14} />
                </button>
                {idea.status !== 'archived' && (
                  <button
                    type="button"
                    onClick={() => startDrafting(idea)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '0.5rem 0.9rem',
                      background: 'var(--color-accent)',
                      color: 'var(--color-accent-ink)',
                      border: 'none',
                      fontSize: '0.8rem',
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  >
                    Start drafting <ArrowRight size={12} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
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
}
