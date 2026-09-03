import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Trash2, Edit3, Copy } from 'lucide-react'
import { useEnrollment } from '../../hooks/useEnrollment'
import { useAllWorkshops } from '../../hooks/admin/useAllWorkshops'
import { useAdminAPI } from '../../hooks/admin/useAdminAPI'
import { supabase } from '../../lib/supabase'
import AdminNav from '../../components/admin/AdminNav'

function formatCents(cents) {
  return `$${((cents ?? 0) / 100).toFixed(2)}`
}

export default function AdminWorkshops() {
  const { user, signOut } = useEnrollment()
  const { workshops: allWorkshops, loading, refetch } = useAllWorkshops()
  const { request } = useAdminAPI()
  const [revenueByWorkshop, setRevenueByWorkshop] = useState({})
  // This page used to hard-filter to kind === 'webinar', which meant a course
  // row was reachable only by typing its edit URL. Tools and resources keep
  // their own page, so the filter covers the two sellable, schedulable kinds.
  const [kindFilter, setKindFilter] = useState('webinar')
  const workshops =
    kindFilter === 'all'
      ? allWorkshops.filter((w) => w.kind === 'webinar' || w.kind === 'course')
      : allWorkshops.filter((w) => w.kind === kindFilter)
  const courseCount = allWorkshops.filter((w) => w.kind === 'course').length

  // Per-workshop revenue lives on the analytics-summary endpoint (the same
  // source the dashboard and analytics pages use); merge it in by id.
  useEffect(() => {
    request('/api/admin/analytics-summary')
      .then((data) => {
        const map = {}
        for (const w of data?.per_workshop ?? []) {
          map[w.id] = w.revenue_cents
        }
        setRevenueByWorkshop(map)
      })
      .catch(() => {})
  }, [request])

  async function deleteWorkshop(id, title) {
    if (!confirm(`Delete "${title}"? This cascades to its content and entitlements.`)) return
    const { error } = await supabase.from('webinars').delete().eq('id', id)
    if (error) {
      alert(`Delete failed: ${error.message}`)
      return
    }
    refetch()
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      <AdminNav user={user} onSignOut={signOut} />

      <main className="pp-main" style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <div className="pp-header-row" style={{ marginBottom: '2rem' }}>
          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(1.5rem, 3vw, 2rem)',
              color: 'var(--color-ink)',
              margin: 0,
            }}
          >
            Workshops
          </h1>
          <Link
            to="/admin/workshops/new"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.7rem 1.1rem',
              background: 'var(--color-accent)',
              color: 'var(--color-accent-ink)',
              textDecoration: 'none',
              fontSize: '0.85rem',
              fontWeight: 500,
            }}
          >
            <Plus size={14} /> New workshop
          </Link>
        </div>

        {courseCount > 0 && (
          <div
            style={{
              display: 'flex',
              gap: '0.5rem',
              marginBottom: '1.25rem',
              flexWrap: 'wrap',
            }}
          >
            {[
              { id: 'webinar', label: 'Workshops' },
              { id: 'course', label: `Courses (${courseCount})` },
              { id: 'all', label: 'All' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setKindFilter(f.id)}
                style={{
                  padding: '0.4rem 0.85rem',
                  background:
                    kindFilter === f.id ? 'var(--color-accent)' : 'transparent',
                  color:
                    kindFilter === f.id
                      ? 'var(--color-accent-ink)'
                      : 'var(--color-ink-muted)',
                  border: '1px solid var(--color-rule)',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontFamily: 'var(--font-serif)',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <p style={{ color: 'var(--color-ink-muted)', fontSize: '0.9rem' }}>Loading…</p>
        ) : workshops.length === 0 ? (
          <p style={{ color: 'var(--color-ink-muted)', fontSize: '0.9rem' }}>
            No workshops yet. Create your first one.
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
                  <Th>Title</Th>
                  <Th>Slug</Th>
                  <Th>Status</Th>
                  <Th>Scheduled</Th>
                  <Th>Price</Th>
                  <Th align="right">Revenue</Th>
                  <Th align="right">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {workshops.map((w) => (
                  <tr
                    key={w.id}
                    style={{ borderBottom: '1px solid var(--color-rule)' }}
                  >
                    <Td>
                      {w.title}
                      {kindFilter !== 'webinar' && w.kind === 'course' && (
                        <span
                          style={{
                            marginLeft: '0.5rem',
                            fontSize: '0.65rem',
                            fontWeight: 600,
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            color: 'var(--color-ink-muted)',
                            border: '1px solid var(--color-rule)',
                            padding: '0.1rem 0.35rem',
                          }}
                        >
                          Course
                        </span>
                      )}
                    </Td>
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
                    <Td align="right" mono>
                      {formatCents(revenueByWorkshop[w.id])}
                    </Td>
                    <Td align="right">
                      <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                        <Link
                          to={`/admin/workshops/${w.slug}/edit`}
                          aria-label="Edit"
                          style={iconLinkStyle}
                        >
                          <Edit3 size={14} />
                        </Link>
                        <Link
                          to={`/admin/workshops/new?from=${encodeURIComponent(w.slug)}`}
                          aria-label="Duplicate"
                          title="Duplicate this workshop and its content"
                          style={iconLinkStyle}
                        >
                          <Copy size={14} />
                        </Link>
                        <button
                          type="button"
                          onClick={() => deleteWorkshop(w.id, w.title)}
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
