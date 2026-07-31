import { useEffect, useState, useCallback, useMemo } from 'react'
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Circle,
  CircleDot,
  CheckCircle2,
} from 'lucide-react'
import { useEnrollment } from '../../hooks/useEnrollment'
import { useAdminAPI } from '../../hooks/admin/useAdminAPI'
import AdminNav from '../../components/admin/AdminNav'

// 'uncategorized' is deliberately absent from the capture dropdown —
// nothing you type by hand should land there. It exists for posts the
// Instagram sync layer pulls in, and only renders as a section when
// it actually has rows waiting to be sorted.
const CATEGORIES = [
  { key: 'spring_school', label: 'Spring School' },
  { key: 'brand_files', label: 'Brand Files' },
  { key: 'same_spring_different_body', label: 'Same Spring, Different Body' },
  { key: 'pop_quiz', label: 'Pop Quiz' },
  { key: 'weight_stack', label: 'Weight Stack' },
  { key: 'misc', label: 'Misc.' },
]
const UNCATEGORIZED = { key: 'uncategorized', label: 'Uncategorized' }
const ALL_CATEGORIES = [...CATEGORIES, UNCATEGORIZED]

const CATEGORY_LABEL = Object.fromEntries(ALL_CATEGORIES.map((c) => [c.key, c.label]))

const STATUSES = [
  { key: 'idea', label: 'Idea', icon: Circle },
  { key: 'in_progress', label: 'In progress', icon: CircleDot },
  { key: 'published', label: 'Published', icon: CheckCircle2 },
]
const STATUS_LABEL = Object.fromEntries(STATUSES.map((s) => [s.key, s.label]))

const FORMATS = [
  { key: 'reel', label: 'Reel' },
  { key: 'carousel', label: 'Carousel' },
  { key: 'static', label: 'Static' },
]

const STATUS_RANK = { in_progress: 0, idea: 1, published: 2 }

// Backlog above archive: when you open this page you're usually asking
// "what's next?", not "what did I do in March?".
function sortPosts(a, b) {
  const rank = STATUS_RANK[a.status] - STATUS_RANK[b.status]
  if (rank !== 0) return rank
  if (a.status === 'published') {
    return (b.posted_at ?? '').localeCompare(a.posted_at ?? '')
  }
  return (b.created_at ?? '').localeCompare(a.created_at ?? '')
}

function formatDate(iso) {
  if (!iso) return null
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return iso
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function AdminInstagram() {
  const { user, signOut } = useEnrollment()
  const { request } = useAdminAPI()

  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [collapsed, setCollapsed] = useState({})

  const refetch = useCallback(async () => {
    try {
      const data = await request('/api/admin/instagram')
      setPosts(data.posts ?? [])
      setError(null)
    } catch (e) {
      setError(e.message)
    }
    setLoading(false)
  }, [request])

  useEffect(() => {
    refetch()
  }, [refetch])

  // Optimistic-ish local patching so toggling a status doesn't refetch
  // and re-collapse everything you were looking at.
  const applyPatch = useCallback((updated) => {
    setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
  }, [])

  const updatePost = useCallback(
    async (id, body) => {
      const { post } = await request(`/api/admin/instagram?id=${id}`, {
        method: 'PATCH',
        body,
      })
      applyPatch(post)
      return post
    },
    [request, applyPatch]
  )

  const deletePost = useCallback(
    async (id) => {
      await request(`/api/admin/instagram?id=${id}`, { method: 'DELETE' })
      setPosts((prev) => prev.filter((p) => p.id !== id))
    },
    [request]
  )

  const byCategory = useMemo(() => {
    const map = Object.fromEntries(ALL_CATEGORIES.map((c) => [c.key, []]))
    for (const p of posts) (map[p.category] ??= []).push(p)
    for (const key of Object.keys(map)) map[key].sort(sortPosts)
    return map
  }, [posts])

  const counts = useMemo(() => {
    const map = Object.fromEntries(
      ALL_CATEGORIES.map((c) => [c.key, { idea: 0, in_progress: 0, published: 0 }])
    )
    for (const p of posts) {
      const bucket = (map[p.category] ??= { idea: 0, in_progress: 0, published: 0 })
      bucket[p.status] += 1
    }
    return map
  }, [posts])

  const visibleCategories = ALL_CATEGORIES.filter(
    (c) => c.key !== 'uncategorized' || byCategory.uncategorized?.length
  )

  return (
    <div style={{ minHeight: '100vh' }}>
      <AdminNav user={user} onSignOut={signOut} />

      <main className="pp-main" style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <div className="pp-header-row" style={{ marginBottom: '2rem' }}>
          <div>
            <p
              style={{
                fontSize: '0.7rem',
                fontWeight: 600,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: 'var(--color-accent)',
                marginBottom: '0.5rem',
              }}
            >
              Instagram
            </p>
            <h1
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
                color: 'var(--color-ink)',
                margin: 0,
              }}
            >
              Planner
            </h1>
          </div>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {['all', 'idea', 'in_progress', 'published'].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                style={{
                  fontSize: '0.7rem',
                  padding: '0.4rem 0.75rem',
                  background: statusFilter === s ? 'var(--color-accent)' : 'transparent',
                  color:
                    statusFilter === s ? 'var(--color-accent-ink)' : 'var(--color-ink-muted)',
                  border: '1px solid var(--color-rule)',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  fontWeight: 600,
                }}
              >
                {s === 'all' ? 'All' : STATUS_LABEL[s]}
              </button>
            ))}
          </div>
        </div>

        <CaptureForm onCreated={refetch} request={request} />

        <SectionLabel>Coverage</SectionLabel>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '1rem',
            marginBottom: '2.5rem',
          }}
        >
          {CATEGORIES.map((c) => {
            const n = counts[c.key] ?? { idea: 0, in_progress: 0, published: 0 }
            const backlog = []
            if (n.in_progress) backlog.push(`${n.in_progress} in progress`)
            if (n.idea) backlog.push(`${n.idea} idea${n.idea === 1 ? '' : 's'}`)
            return (
              <div
                key={c.key}
                className="pp-card"
                style={{
                  padding: '1.1rem 1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.45rem',
                  minHeight: '108px',
                  justifyContent: 'space-between',
                  borderLeft:
                    n.published === 0 ? '2px solid var(--color-accent)' : undefined,
                }}
              >
                <span className="pp-section-label" style={{ fontSize: '0.62rem' }}>
                  {c.label}
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '1.75rem',
                    color: 'var(--color-ink)',
                    lineHeight: 1,
                  }}
                >
                  {n.published}
                  <span
                    style={{
                      fontSize: '0.7rem',
                      color: 'var(--color-ink-muted)',
                      marginLeft: '0.4rem',
                    }}
                  >
                    posted
                  </span>
                </span>
                <span style={{ fontSize: '0.72rem', color: 'var(--color-ink-muted)' }}>
                  {backlog.length ? backlog.join(' · ') : 'Nothing queued'}
                </span>
              </div>
            )
          })}
        </div>

        {error && <p style={{ color: '#ff7d7d', fontSize: '0.85rem' }}>{error}</p>}
        {loading && (
          <p style={{ color: 'var(--color-ink-muted)', fontSize: '0.9rem' }}>Loading…</p>
        )}

        {!loading &&
          visibleCategories.map((c) => {
            const all = byCategory[c.key] ?? []
            const shown = statusFilter === 'all' ? all : all.filter((p) => p.status === statusFilter)
            const isCollapsed = collapsed[c.key]
            return (
              <section key={c.key} style={{ marginBottom: '2rem' }}>
                <button
                  type="button"
                  onClick={() => setCollapsed((v) => ({ ...v, [c.key]: !v[c.key] }))}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    width: '100%',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: '1px solid var(--color-rule)',
                    padding: '0 0 0.6rem',
                    marginBottom: '0.85rem',
                    cursor: 'pointer',
                    color: 'var(--color-ink)',
                    textAlign: 'left',
                  }}
                >
                  {isCollapsed ? <ChevronRight size={15} /> : <ChevronDown size={15} />}
                  <span
                    style={{
                      fontFamily: 'var(--font-serif)',
                      fontSize: '1.1rem',
                      flex: 1,
                      minWidth: 0,
                    }}
                  >
                    {c.label}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)' }}>
                    {shown.length}
                    {statusFilter !== 'all' && all.length !== shown.length ? ` of ${all.length}` : ''}
                  </span>
                </button>

                {!isCollapsed && shown.length === 0 && (
                  <p
                    style={{
                      color: 'var(--color-ink-muted)',
                      fontSize: '0.85rem',
                      margin: '0 0 0.5rem',
                    }}
                  >
                    {statusFilter === 'all'
                      ? 'Nothing here yet. This is a hole.'
                      : `No ${STATUS_LABEL[statusFilter].toLowerCase()} posts in this category.`}
                  </p>
                )}

                {!isCollapsed && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {shown.map((p) => (
                      <PostRow
                        key={p.id}
                        post={p}
                        onUpdate={updatePost}
                        onDelete={deletePost}
                      />
                    ))}
                  </div>
                )}
              </section>
            )
          })}
      </main>
    </div>
  )
}

function CaptureForm({ onCreated, request }) {
  const [category, setCategory] = useState(CATEGORIES[0].key)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [hook, setHook] = useState('')
  const [format, setFormat] = useState('')
  const [expanded, setExpanded] = useState(false)
  const [saving, setSaving] = useState(false)

  async function submit(e) {
    e.preventDefault()
    if (!title.trim() || saving) return
    setSaving(true)
    try {
      await request('/api/admin/instagram', {
        method: 'POST',
        body: {
          category,
          title: title.trim(),
          description: description.trim() || null,
          hook: hook.trim() || null,
          format: format || null,
        },
      })
      setTitle('')
      setDescription('')
      setHook('')
      setFormat('')
      await onCreated()
    } catch (e) {
      alert(`Could not save: ${e.message}`)
    }
    setSaving(false)
  }

  return (
    <form
      onSubmit={submit}
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-rule)',
        padding: '1.25rem',
        marginBottom: '2.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
      }}
    >
      <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={{ ...inputStyle, width: 'auto', flex: '0 1 240px' }}
          disabled={saving}
        >
          {CATEGORIES.map((c) => (
            <option key={c.key} value={c.key}>
              {c.label}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Topic (e.g. 'Why a lighter spring can feel harder')"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{ ...inputStyle, flex: '1 1 260px', width: 'auto' }}
          disabled={saving}
        />
      </div>

      <textarea
        rows={2}
        placeholder="Description: the angle, the point, what you'd show…"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
        disabled={saving}
      />

      {expanded && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            style={{ ...inputStyle, width: 'auto', flex: '0 1 200px' }}
            disabled={saving}
          >
            <option value="">Format (optional)</option>
            {FORMATS.map((f) => (
              <option key={f.key} value={f.key}>
                {f.label}
              </option>
            ))}
          </select>
          <textarea
            rows={2}
            placeholder="Hook or caption draft (optional)"
            value={hook}
            onChange={(e) => setHook(e.target.value)}
            style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
            disabled={saving}
          />
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <button
          type="submit"
          disabled={saving || !title.trim()}
          style={{
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
            opacity: saving || !title.trim() ? 0.5 : 1,
          }}
        >
          <Plus size={14} /> Drop idea
        </button>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--color-ink-muted)',
            fontSize: '0.78rem',
            cursor: 'pointer',
            textDecoration: 'underline',
          }}
        >
          {expanded ? 'Fewer fields' : 'Format & hook'}
        </button>
      </div>
    </form>
  )
}

function PostRow({ post, onUpdate, onDelete }) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  async function setStatus(status) {
    if (status === post.status || busy) return
    setBusy(true)
    try {
      await onUpdate(post.id, { status })
      if (status === 'published') setOpen(true)
    } catch (e) {
      alert(`Could not update: ${e.message}`)
    }
    setBusy(false)
  }

  async function remove() {
    if (!confirm(`Delete "${post.title}"? This cannot be undone.`)) return
    try {
      await onDelete(post.id)
    } catch (e) {
      alert(`Delete failed: ${e.message}`)
    }
  }

  const hasMetrics =
    post.views != null || post.comments != null || post.shares != null || post.saves != null

  return (
    <div
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-rule)',
        padding: '0.9rem 1.1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.6rem',
        opacity: busy ? 0.6 : 1,
      }}
    >
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            style={{
              background: 'transparent',
              border: 'none',
              padding: 0,
              textAlign: 'left',
              cursor: 'pointer',
              color: 'var(--color-ink)',
              fontSize: '0.98rem',
              fontFamily: 'inherit',
              textDecoration: post.status === 'published' ? 'none' : 'none',
            }}
          >
            {post.title}
          </button>

          <div
            style={{
              display: 'flex',
              gap: '0.5rem',
              alignItems: 'center',
              flexWrap: 'wrap',
              marginTop: '0.35rem',
            }}
          >
            {post.format && <Tag>{FORMATS.find((f) => f.key === post.format)?.label}</Tag>}
            {post.status === 'published' && post.posted_at && (
              <span style={metaTextStyle}>{formatDate(post.posted_at)}</span>
            )}
            {post.status === 'published' && hasMetrics && (
              <span style={metaTextStyle}>
                {post.views ?? '—'} views · {post.comments ?? '—'} comments ·{' '}
                {post.shares ?? '—'} shares · {post.saves ?? '—'} saves
              </span>
            )}
            {post.post_url && (
              <a
                href={post.post_url}
                target="_blank"
                rel="noreferrer noopener"
                style={{
                  ...metaTextStyle,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  color: 'var(--color-accent)',
                  textDecoration: 'none',
                }}
              >
                View <ExternalLink size={11} />
              </a>
            )}
          </div>

          {post.description && !open && (
            <p
              style={{
                fontSize: '0.83rem',
                color: 'var(--color-ink-muted)',
                margin: '0.4rem 0 0',
                whiteSpace: 'pre-wrap',
              }}
            >
              {post.description}
            </p>
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.25rem', flexShrink: 0 }}>
          {STATUSES.map((s) => {
            const Icon = s.icon
            const active = post.status === s.key
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => setStatus(s.key)}
                disabled={busy}
                title={s.label}
                aria-label={`Mark as ${s.label}`}
                aria-pressed={active}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '30px',
                  height: '30px',
                  border: '1px solid var(--color-rule)',
                  background: active ? 'var(--color-accent)' : 'transparent',
                  color: active ? 'var(--color-accent-ink)' : 'var(--color-ink-muted)',
                  cursor: busy ? 'default' : 'pointer',
                }}
              >
                <Icon size={14} />
              </button>
            )
          })}
        </div>
      </div>

      {open && <PostEditor post={post} onUpdate={onUpdate} onDelete={remove} />}
    </div>
  )
}

function PostEditor({ post, onUpdate, onDelete }) {
  const [draft, setDraft] = useState(() => ({
    category: post.category,
    title: post.title,
    description: post.description ?? '',
    hook: post.hook ?? '',
    format: post.format ?? '',
    posted_at: post.posted_at ?? '',
    post_url: post.post_url ?? '',
    views: post.views ?? '',
    comments: post.comments ?? '',
    shares: post.shares ?? '',
    saves: post.saves ?? '',
  }))
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  function set(field, value) {
    setDraft((d) => ({ ...d, [field]: value }))
    setSaved(false)
  }

  async function save() {
    if (!draft.title.trim()) {
      alert('Title cannot be empty.')
      return
    }
    setSaving(true)
    try {
      await onUpdate(post.id, draft)
      setSaved(true)
    } catch (e) {
      alert(`Save failed: ${e.message}`)
    }
    setSaving(false)
  }

  return (
    <div
      style={{
        borderTop: '1px solid var(--color-rule)',
        paddingTop: '0.9rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.7rem',
      }}
    >
      <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
        <select
          value={draft.category}
          onChange={(e) => set('category', e.target.value)}
          style={{ ...inputStyle, width: 'auto', flex: '0 1 240px' }}
        >
          {ALL_CATEGORIES.map((c) => (
            <option key={c.key} value={c.key}>
              {c.label}
            </option>
          ))}
        </select>
        <select
          value={draft.format}
          onChange={(e) => set('format', e.target.value)}
          style={{ ...inputStyle, width: 'auto', flex: '0 1 180px' }}
        >
          <option value="">No format</option>
          {FORMATS.map((f) => (
            <option key={f.key} value={f.key}>
              {f.label}
            </option>
          ))}
        </select>
      </div>

      <input
        type="text"
        value={draft.title}
        onChange={(e) => set('title', e.target.value)}
        placeholder="Topic"
        style={inputStyle}
      />
      <textarea
        rows={2}
        value={draft.description}
        onChange={(e) => set('description', e.target.value)}
        placeholder="Description"
        style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
      />
      <textarea
        rows={2}
        value={draft.hook}
        onChange={(e) => set('hook', e.target.value)}
        placeholder="Hook or caption draft"
        style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
      />

      <FieldLabel>Once it's live</FieldLabel>
      <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
        <input
          type="date"
          value={draft.posted_at}
          onChange={(e) => set('posted_at', e.target.value)}
          style={{ ...inputStyle, width: 'auto', flex: '0 1 170px' }}
        />
        <input
          type="url"
          value={draft.post_url}
          onChange={(e) => set('post_url', e.target.value)}
          placeholder="https://www.instagram.com/p/…"
          style={{ ...inputStyle, flex: '1 1 260px', width: 'auto' }}
        />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
          gap: '0.6rem',
        }}
      >
        {['views', 'comments', 'shares', 'saves'].map((m) => (
          <div key={m} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <span style={{ ...metaTextStyle, textTransform: 'capitalize' }}>{m}</span>
            <input
              type="number"
              min="0"
              value={draft[m]}
              onChange={(e) => set(m, e.target.value)}
              placeholder="—"
              style={inputStyle}
            />
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={save}
          disabled={saving}
          style={{
            padding: '0.6rem 1.1rem',
            background: 'var(--color-accent)',
            color: 'var(--color-accent-ink)',
            border: 'none',
            fontSize: '0.82rem',
            fontWeight: 500,
            cursor: 'pointer',
            opacity: saving ? 0.5 : 1,
          }}
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
        {saved && (
          <span style={{ fontSize: '0.78rem', color: 'var(--color-ink-muted)' }}>Saved.</span>
        )}
        <button
          type="button"
          onClick={onDelete}
          style={{ ...iconBtnStyle, marginLeft: 'auto' }}
          aria-label="Delete post"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}

function Tag({ children }) {
  return (
    <span
      style={{
        fontSize: '0.62rem',
        padding: '0.18rem 0.45rem',
        background: 'rgba(255,255,255,0.05)',
        color: 'var(--color-ink-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        fontWeight: 600,
      }}
    >
      {children}
    </span>
  )
}

function FieldLabel({ children }) {
  return (
    <span
      style={{
        fontSize: '0.65rem',
        fontWeight: 600,
        letterSpacing: '0.15em',
        textTransform: 'uppercase',
        color: 'var(--color-ink-muted)',
        marginTop: '0.3rem',
      }}
    >
      {children}
    </span>
  )
}

function SectionLabel({ children }) {
  return (
    <h2
      style={{
        fontSize: '0.7rem',
        fontWeight: 600,
        letterSpacing: '0.15em',
        textTransform: 'uppercase',
        color: 'var(--color-ink-muted)',
        marginBottom: '1rem',
      }}
    >
      {children}
    </h2>
  )
}

const inputStyle = {
  width: '100%',
  padding: '0.65rem 0.85rem',
  background: 'var(--color-bg)',
  border: '1px solid var(--color-rule)',
  color: 'var(--color-ink)',
  fontSize: '0.88rem',
  fontFamily: 'var(--font-serif)',
  outline: 'none',
}

const metaTextStyle = {
  fontSize: '0.72rem',
  color: 'var(--color-ink-muted)',
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
