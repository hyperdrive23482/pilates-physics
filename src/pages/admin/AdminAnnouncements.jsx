import { Link } from 'react-router-dom'
import { Plus, Trash2, Edit3 } from 'lucide-react'
import { useEnrollment } from '../../hooks/useEnrollment'
import { useAllAnnouncements } from '../../hooks/admin/useAllAnnouncements'
import { supabase } from '../../lib/supabase'
import AdminNav from '../../components/admin/AdminNav'

function computeStatus(row, allRows, now) {
  if (!row.enabled) return 'disabled'
  if (new Date(row.starts_at).getTime() > now) return 'scheduled'
  const activeId = allRows
    .filter((r) => r.enabled && new Date(r.starts_at).getTime() <= now)
    .sort((a, b) => new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime())[0]?.id
  return row.id === activeId ? 'active' : 'past'
}

function truncate(s, n) {
  if (!s) return ''
  return s.length > n ? s.slice(0, n - 1) + '…' : s
}

export default function AdminAnnouncements() {
  const { user, signOut } = useEnrollment()
  const { announcements, loading, refetch } = useAllAnnouncements()

  async function deleteAnnouncement(id, message) {
    if (!confirm(`Delete announcement "${truncate(message, 40)}"?`)) return
    const { error } = await supabase.from('announcements').delete().eq('id', id)
    if (error) {
      alert(`Delete failed: ${error.message}`)
      return
    }
    refetch()
  }

  const now = Date.now()

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <AdminNav user={user} onSignOut={signOut} />

      <main className="pp-main" style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <div className="pp-header-row" style={{ marginBottom: '2rem' }}>
          <h1
            style={{
              fontFamily: '"DM Serif Display", serif',
              fontSize: 'clamp(1.5rem, 3vw, 2rem)',
              color: 'var(--color-ink)',
              margin: 0,
            }}
          >
            Announcements
          </h1>
          <Link
            to="/admin/announcements/new"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.7rem 1.1rem',
              background: 'var(--color-accent)',
              color: '#1C1A17',
              textDecoration: 'none',
              fontSize: '0.85rem',
              fontWeight: 500,
            }}
          >
            <Plus size={14} /> New announcement
          </Link>
        </div>

        <p
          style={{
            color: 'var(--color-ink-muted)',
            fontSize: '0.85rem',
            margin: '0 0 1.5rem',
            lineHeight: 1.5,
          }}
        >
          The site bar shows the most recent enabled announcement whose start date has passed.
          Schedule a future announcement and it will replace the current one automatically.
        </p>

        {loading ? (
          <p style={{ color: 'var(--color-ink-muted)', fontSize: '0.9rem' }}>Loading…</p>
        ) : announcements.length === 0 ? (
          <p style={{ color: 'var(--color-ink-muted)', fontSize: '0.9rem' }}>
            No announcements yet. Create your first one.
          </p>
        ) : (
          <div
            className="pp-table-wrap"
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-rule)',
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-rule)' }}>
                  <Th>Message</Th>
                  <Th>Link</Th>
                  <Th>Starts at</Th>
                  <Th>Status</Th>
                  <Th align="right">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {announcements.map((a) => {
                  const status = computeStatus(a, announcements, now)
                  return (
                    <tr key={a.id} style={{ borderBottom: '1px solid var(--color-rule)' }}>
                      <Td>{truncate(a.message, 80)}</Td>
                      <Td mono>
                        {a.link_url ? truncate(a.link_url, 30) : '—'}
                      </Td>
                      <Td mono>{new Date(a.starts_at).toLocaleString()}</Td>
                      <Td>
                        <StatusPill status={status} />
                      </Td>
                      <Td align="right">
                        <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                          <Link
                            to={`/admin/announcements/${a.id}/edit`}
                            aria-label="Edit"
                            style={iconLinkStyle}
                          >
                            <Edit3 size={14} />
                          </Link>
                          <button
                            type="button"
                            onClick={() => deleteAnnouncement(a.id, a.message)}
                            aria-label="Delete"
                            style={iconBtnStyle}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </Td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}

function Th({ children, align = 'left' }) {
  return (
    <th
      style={{
        textAlign: align,
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

function Td({ children, align = 'left', mono }) {
  return (
    <td
      style={{
        padding: '0.75rem 1rem',
        textAlign: align,
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
      active: 'rgba(100,255,150,0.15)',
      scheduled: 'rgba(100,180,255,0.15)',
      past: 'rgba(255,255,255,0.05)',
      disabled: 'rgba(255,255,255,0.08)',
    }[status] ?? 'rgba(255,255,255,0.08)'
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

const iconLinkStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '28px',
  height: '28px',
  border: '1px solid var(--color-rule)',
  color: 'var(--color-ink)',
  background: 'transparent',
  textDecoration: 'none',
}

const iconBtnStyle = {
  ...iconLinkStyle,
  cursor: 'pointer',
  color: 'var(--color-ink-muted)',
}
