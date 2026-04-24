import { useEffect, useState, useCallback } from 'react'
import { useEnrollment } from '../../hooks/useEnrollment'
import { useAdminAPI } from '../../hooks/admin/useAdminAPI'
import { useAllWebinars } from '../../hooks/admin/useAllWebinars'
import AdminNav from '../../components/admin/AdminNav'
import EntitlementManager from '../../components/admin/EntitlementManager'

export default function AdminUsers() {
  const { user, signOut } = useEnrollment()
  const { request } = useAdminAPI()
  const { webinars } = useAllWebinars()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState(null)

  const refetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { users: list } = await request('/api/admin/list-users')
      setUsers(list)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [request])

  useEffect(() => {
    refetch()
  }, [refetch])

  const filtered = users.filter((u) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      u.email?.toLowerCase().includes(q) ||
      u.first_name?.toLowerCase().includes(q) ||
      u.last_name?.toLowerCase().includes(q)
    )
  })

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <AdminNav user={user} onSignOut={signOut} />

      <main className="pp-main" style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <div className="pp-header-row" style={{ marginBottom: '1.5rem' }}>
          <h1
            style={{
              fontFamily: '"DM Serif Display", serif',
              fontSize: 'clamp(1.5rem, 3vw, 2rem)',
              color: 'var(--color-ink)',
              margin: 0,
            }}
          >
            Users
          </h1>
          <input
            type="search"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              padding: '0.5rem 0.75rem',
              background: 'var(--color-surface)',
              color: 'var(--color-ink)',
              border: '1px solid var(--color-rule)',
              fontSize: '0.85rem',
              fontFamily: '"DM Sans", sans-serif',
              minWidth: '240px',
              outline: 'none',
            }}
          />
        </div>

        {error && <p style={{ color: '#ff7d7d', fontSize: '0.85rem' }}>{error}</p>}
        {loading ? (
          <p style={{ color: 'var(--color-ink-muted)', fontSize: '0.9rem' }}>Loading…</p>
        ) : (
          <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-rule)' }}>
            {filtered.length === 0 && (
              <p style={{ padding: '1.5rem', color: 'var(--color-ink-muted)', fontSize: '0.9rem' }}>
                No users match.
              </p>
            )}
            {filtered.map((u) => {
              const isOpen = expanded === u.id
              return (
                <div key={u.id} style={{ borderBottom: '1px solid var(--color-rule)' }}>
                  <button
                    type="button"
                    onClick={() => setExpanded(isOpen ? null : u.id)}
                    className="pp-user-row"
                    style={{
                      width: '100%',
                      padding: '0.9rem 1rem',
                      background: 'transparent',
                      border: 'none',
                      textAlign: 'left',
                      cursor: 'pointer',
                      color: 'var(--color-ink)',
                      fontFamily: 'inherit',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.9rem' }}>
                        {u.first_name || u.last_name ? `${u.first_name} ${u.last_name}`.trim() : '(no name)'}
                        {u.is_admin && (
                          <span
                            style={{
                              marginLeft: '0.5rem',
                              fontSize: '0.65rem',
                              padding: '0.15rem 0.4rem',
                              background: 'var(--color-accent)',
                              color: '#1C1A17',
                              textTransform: 'uppercase',
                              letterSpacing: '0.1em',
                              fontWeight: 600,
                            }}
                          >
                            Admin
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--color-ink-muted)' }}>
                        {u.email}
                      </div>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-ink-muted)' }}>
                      {u.entitlements.length} entitlement{u.entitlements.length === 1 ? '' : 's'}
                    </div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-ink-muted)' }}>
                      {isOpen ? '▾' : '▸'}
                    </span>
                  </button>

                  {isOpen && (
                    <div style={{ padding: '0 1rem 1rem' }}>
                      <EntitlementManager
                        userRow={u}
                        webinars={webinars}
                        onChange={refetch}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
