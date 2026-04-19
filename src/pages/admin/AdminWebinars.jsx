import { Link } from 'react-router-dom'
import { Plus, Trash2, Edit3 } from 'lucide-react'
import { useEnrollment } from '../../hooks/useEnrollment'
import { useAllWebinars } from '../../hooks/admin/useAllWebinars'
import { supabase } from '../../lib/supabase'
import AdminNav from '../../components/admin/AdminNav'

export default function AdminWebinars() {
  const { user, signOut } = useEnrollment()
  const { webinars, loading, refetch } = useAllWebinars()

  async function deleteWebinar(id, title) {
    if (!confirm(`Delete "${title}"? This cascades to its content and entitlements.`)) return
    const { error } = await supabase.from('webinars').delete().eq('id', id)
    if (error) {
      alert(`Delete failed: ${error.message}`)
      return
    }
    refetch()
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <AdminNav user={user} onSignOut={signOut} />

      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '6rem 2rem 4rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', marginBottom: '2rem' }}>
          <h1
            style={{
              fontFamily: '"DM Serif Display", serif',
              fontSize: 'clamp(1.5rem, 3vw, 2rem)',
              color: 'var(--color-ink)',
              margin: 0,
            }}
          >
            Webinars
          </h1>
          <Link
            to="/admin/webinars/new"
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
            <Plus size={14} /> New webinar
          </Link>
        </div>

        {loading ? (
          <p style={{ color: 'var(--color-ink-muted)', fontSize: '0.9rem' }}>Loading…</p>
        ) : webinars.length === 0 ? (
          <p style={{ color: 'var(--color-ink-muted)', fontSize: '0.9rem' }}>
            No webinars yet. Create your first one.
          </p>
        ) : (
          <div
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-rule)',
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-rule)' }}>
                  <Th>Title</Th>
                  <Th>Slug</Th>
                  <Th>Status</Th>
                  <Th>Scheduled</Th>
                  <Th>Price</Th>
                  <Th align="right">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {webinars.map((w) => (
                  <tr
                    key={w.id}
                    style={{ borderBottom: '1px solid var(--color-rule)' }}
                  >
                    <Td>{w.title}</Td>
                    <Td mono>{w.slug}</Td>
                    <Td>
                      <StatusPill status={w.status} />
                    </Td>
                    <Td mono>
                      {w.scheduled_at ? new Date(w.scheduled_at).toLocaleString() : '—'}
                    </Td>
                    <Td mono>
                      {w.price_cents != null ? `$${(w.price_cents / 100).toFixed(2)}` : '—'}
                    </Td>
                    <Td align="right">
                      <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                        <Link
                          to={`/admin/webinars/${w.slug}/edit`}
                          aria-label="Edit"
                          style={iconLinkStyle}
                        >
                          <Edit3 size={14} />
                        </Link>
                        <button
                          type="button"
                          onClick={() => deleteWebinar(w.id, w.title)}
                          aria-label="Delete"
                          style={iconBtnStyle}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
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
      draft: 'rgba(255,255,255,0.08)',
      upcoming: 'rgba(100,180,255,0.15)',
      live: 'rgba(100,255,150,0.15)',
      complete: 'rgba(200,180,100,0.15)',
      archived: 'rgba(255,255,255,0.05)',
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
