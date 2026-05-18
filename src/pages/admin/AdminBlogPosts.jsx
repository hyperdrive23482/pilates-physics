import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, Image as ImageIcon } from 'lucide-react'
import { useEnrollment } from '../../hooks/useEnrollment'
import { useAdminAPI } from '../../hooks/admin/useAdminAPI'
import AdminNav from '../../components/admin/AdminNav'

const STATUS_LABELS = {
  draft: 'Draft',
  scheduled: 'Scheduled',
  published: 'Published',
}

export default function AdminBlogPosts() {
  const { user, signOut } = useEnrollment()
  const { request } = useAdminAPI()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all')

  const refetch = useCallback(async () => {
    setLoading(true)
    try {
      const data = await request('/api/admin/content/blog-posts')
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

  const counts = posts.reduce(
    (acc, p) => {
      acc.all++
      acc[p.status] = (acc[p.status] ?? 0) + 1
      return acc
    },
    { all: 0, draft: 0, scheduled: 0, published: 0 },
  )

  const filtered = filter === 'all' ? posts : posts.filter((p) => p.status === filter)

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

        <div className="pp-header-row" style={{ marginBottom: '1.5rem' }}>
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
              Content
            </p>
            <h1
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'clamp(1.5rem, 3vw, 2rem)',
                color: 'var(--color-ink)',
                margin: 0,
              }}
            >
              Blog posts
            </h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-ink-muted)', margin: '0.4rem 0 0' }}>
              Direct edits to every row in the blog. Use this for seeded or legacy posts that
              never went through the editorial pipeline.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
          <FilterChip active={filter === 'all'} onClick={() => setFilter('all')} label={`All (${counts.all})`} />
          <FilterChip active={filter === 'draft'} onClick={() => setFilter('draft')} label={`Drafts (${counts.draft})`} />
          <FilterChip active={filter === 'scheduled'} onClick={() => setFilter('scheduled')} label={`Scheduled (${counts.scheduled})`} />
          <FilterChip active={filter === 'published'} onClick={() => setFilter('published')} label={`Published (${counts.published})`} />
        </div>

        {error && <p style={{ color: '#ff7d7d', fontSize: '0.85rem' }}>{error}</p>}
        {loading && <p style={{ color: 'var(--color-ink-muted)', fontSize: '0.9rem' }}>Loading…</p>}

        {!loading && filtered.length === 0 && (
          <p style={{ color: 'var(--color-ink-muted)', fontSize: '0.9rem' }}>No posts match this filter.</p>
        )}

        {filtered.length > 0 && (
          <div
            className="pp-table-wrap"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-rule)' }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-rule)' }}>
                  <Th>Date</Th>
                  <Th>Title</Th>
                  <Th>Status</Th>
                  <Th>Image</Th>
                  <Th>Source</Th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--color-rule)' }}>
                    <Td mono>
                      {p.published_at
                        ? new Date(p.published_at).toLocaleDateString()
                        : p.scheduled_for
                          ? new Date(p.scheduled_for).toLocaleDateString()
                          : new Date(p.updated_at).toLocaleDateString()}
                    </Td>
                    <Td>
                      <Link
                        to={`/admin/content/blog-posts/${p.id}`}
                        style={{ color: 'var(--color-ink)', textDecoration: 'none' }}
                      >
                        {p.title || 'Untitled'}
                      </Link>
                      <div style={{ fontSize: '0.7rem', color: 'var(--color-ink-muted)', marginTop: '0.15rem' }}>
                        /{p.slug}
                      </div>
                    </Td>
                    <Td>
                      <StatusPill status={p.status} />
                    </Td>
                    <Td>
                      {p.featured_image_url ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: 'var(--color-accent)', fontSize: '0.75rem' }}>
                          <ImageIcon size={12} /> Yes
                        </span>
                      ) : (
                        <span style={{ color: 'var(--color-ink-muted)', fontSize: '0.75rem' }}>—</span>
                      )}
                    </Td>
                    <Td>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)' }}>
                        {p.canonical_url ? 'Seeded' : 'CMS'}
                      </span>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}

function FilterChip({ active, onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '0.4rem 0.85rem',
        background: active ? 'var(--color-accent)' : 'transparent',
        color: active ? 'var(--color-accent-ink)' : 'var(--color-ink)',
        border: '1px solid',
        borderColor: active ? 'var(--color-accent)' : 'var(--color-rule)',
        fontSize: '0.78rem',
        fontFamily: 'var(--font-serif)',
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  )
}

function Th({ children }) {
  return (
    <th
      style={{
        textAlign: 'left',
        padding: '0.75rem 1rem',
        fontSize: '0.65rem',
        fontWeight: 600,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: 'var(--color-ink-muted)',
      }}
    >
      {children}
    </th>
  )
}

function Td({ children, mono }) {
  return (
    <td
      style={{
        padding: '0.75rem 1rem',
        color: 'var(--color-ink)',
        fontFamily: mono ? 'ui-monospace, SFMono-Regular, monospace' : undefined,
        fontSize: mono ? '0.8rem' : undefined,
        verticalAlign: 'top',
      }}
    >
      {children}
    </td>
  )
}

function StatusPill({ status }) {
  const bg =
    {
      draft: 'rgba(255,255,255,0.06)',
      scheduled: 'rgba(255,180,100,0.18)',
      published: 'rgba(100,255,150,0.15)',
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
