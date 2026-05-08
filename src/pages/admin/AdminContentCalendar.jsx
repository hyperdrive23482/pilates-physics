import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { useEnrollment } from '../../hooks/useEnrollment'
import { useAdminAPI } from '../../hooks/admin/useAdminAPI'
import AdminNav from '../../components/admin/AdminNav'

export default function AdminContentCalendar() {
  const { user, signOut } = useEnrollment()
  const { request } = useAdminAPI()
  const [pieces, setPieces] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refetch = useCallback(async () => {
    setLoading(true)
    try {
      const data = await request('/api/admin/content/pieces')
      setPieces(data.pieces ?? [])
      setError(null)
    } catch (e) {
      setError(e.message)
    }
    setLoading(false)
  }, [request])

  useEffect(() => {
    refetch()
  }, [refetch])

  const now = Date.now()
  const sorted = [...pieces].sort((a, b) => {
    const ka = keyTime(a)
    const kb = keyTime(b)
    return ka - kb
  })
  const upcoming = sorted.filter((p) => keyTime(p) >= now && p.status !== 'archived')
  const past = sorted
    .filter((p) => keyTime(p) < now || p.status === 'published')
    .reverse()

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

        <div className="pp-header-row" style={{ marginBottom: '2rem' }}>
          <h1
            style={{
              fontFamily: '"DM Serif Display", serif',
              fontSize: 'clamp(1.5rem, 3vw, 2rem)',
              color: 'var(--color-ink)',
              margin: 0,
            }}
          >
            Content calendar
          </h1>
        </div>

        {error && <p style={{ color: '#ff7d7d', fontSize: '0.85rem' }}>{error}</p>}
        {loading && <p style={{ color: 'var(--color-ink-muted)', fontSize: '0.9rem' }}>Loading…</p>}

        <Section title="Upcoming">
          {upcoming.length === 0 ? (
            <Empty>Nothing scheduled or in progress.</Empty>
          ) : (
            <Table rows={upcoming} />
          )}
        </Section>

        <Section title="Past">
          {past.length === 0 ? <Empty>No past content yet.</Empty> : <Table rows={past} />}
        </Section>
      </main>
    </div>
  )
}

function keyTime(p) {
  if (p.published_at) return new Date(p.published_at).getTime()
  if (p.scheduled_for) return new Date(p.scheduled_for).getTime()
  return new Date(p.updated_at).getTime()
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: '2.5rem' }}>
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
        {title}
      </h2>
      {children}
    </div>
  )
}

function Empty({ children }) {
  return <p style={{ color: 'var(--color-ink-muted)', fontSize: '0.9rem' }}>{children}</p>
}

function Table({ rows }) {
  return (
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
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr
              key={p.id}
              style={{ borderBottom: '1px solid var(--color-rule)' }}
            >
              <Td mono>
                {p.published_at
                  ? new Date(p.published_at).toLocaleString()
                  : p.scheduled_for
                    ? new Date(p.scheduled_for).toLocaleString()
                    : new Date(p.updated_at).toLocaleString()}
              </Td>
              <Td>
                <Link
                  to={`/admin/content/pieces/${p.id}`}
                  style={{ color: 'var(--color-ink)', textDecoration: 'none' }}
                >
                  {p.title || 'Untitled'}
                </Link>
              </Td>
              <Td>
                <StatusPill status={p.status} />
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
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
      }}
    >
      {children}
    </td>
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
      {status}
    </span>
  )
}
