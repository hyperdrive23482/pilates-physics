import { useEffect, useState } from 'react'
import { useEnrollment } from '../../hooks/useEnrollment'
import { useAdminAPI } from '../../hooks/admin/useAdminAPI'
import AdminNav from '../../components/admin/AdminNav'

export default function AdminAnimations() {
  const { user, signOut } = useEnrollment()
  const { request } = useAdminAPI()

  const [list, setList] = useState([])
  const [selected, setSelected] = useState(null)
  const [html, setHtml] = useState('')
  const [listLoading, setListLoading] = useState(true)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const { animations } = await request('/api/admin/animations-list')
        if (cancelled) return
        setList(animations)
        if (animations.length > 0) setSelected(animations[0].name)
      } catch (e) {
        if (!cancelled) setError(e.message)
      } finally {
        if (!cancelled) setListLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [request])

  useEffect(() => {
    if (!selected) return
    let cancelled = false
    async function load() {
      setPreviewLoading(true)
      setHtml('')
      try {
        const { html: content } = await request(
          `/api/admin/animation?name=${encodeURIComponent(selected)}`
        )
        if (!cancelled) setHtml(content)
      } catch (e) {
        if (!cancelled) setError(e.message)
      } finally {
        if (!cancelled) setPreviewLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [selected, request])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <AdminNav user={user} onSignOut={signOut} />

      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '6rem 2rem 4rem' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <h1
            style={{
              fontFamily: '"DM Serif Display", serif',
              fontSize: 'clamp(1.5rem, 3vw, 2rem)',
              color: 'var(--color-ink)',
              margin: 0,
            }}
          >
            Animations
          </h1>
          <p style={{ color: 'var(--color-ink-muted)', fontSize: '0.85rem', marginTop: '0.35rem' }}>
            Private — served from <code>/animations/</code> behind admin auth.
          </p>
        </div>

        {error && (
          <p style={{ color: '#ff7d7d', fontSize: '0.85rem', marginBottom: '1rem' }}>{error}</p>
        )}

        {listLoading ? (
          <p style={{ color: 'var(--color-ink-muted)', fontSize: '0.9rem' }}>Loading…</p>
        ) : list.length === 0 ? (
          <p style={{ color: 'var(--color-ink-muted)', fontSize: '0.9rem' }}>
            No animations found.
          </p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '1.5rem' }}>
            <aside
              style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-rule)',
                alignSelf: 'start',
              }}
            >
              {list.map((a) => {
                const isActive = a.name === selected
                return (
                  <button
                    key={a.name}
                    type="button"
                    onClick={() => setSelected(a.name)}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '0.8rem 1rem',
                      background: isActive ? 'rgba(255,255,255,0.04)' : 'transparent',
                      border: 'none',
                      borderBottom: '1px solid var(--color-rule)',
                      borderLeft: isActive
                        ? '2px solid var(--color-accent)'
                        : '2px solid transparent',
                      textAlign: 'left',
                      cursor: 'pointer',
                      color: isActive ? 'var(--color-ink)' : 'var(--color-ink-muted)',
                      fontFamily: 'inherit',
                      fontSize: '0.85rem',
                    }}
                  >
                    <div style={{ lineHeight: 1.3 }}>{a.title}</div>
                    <div
                      style={{
                        fontSize: '0.7rem',
                        color: 'var(--color-ink-muted)',
                        marginTop: '0.25rem',
                        fontFamily: '"DM Mono", monospace',
                      }}
                    >
                      {a.name}
                    </div>
                  </button>
                )
              })}
            </aside>

            <div
              style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-rule)',
                minHeight: '900px',
                position: 'relative',
              }}
            >
              {previewLoading ? (
                <p
                  style={{
                    padding: '1.5rem',
                    color: 'var(--color-ink-muted)',
                    fontSize: '0.9rem',
                  }}
                >
                  Loading animation…
                </p>
              ) : html ? (
                <iframe
                  srcDoc={html}
                  title={selected ?? 'Animation preview'}
                  style={{
                    width: '100%',
                    height: '900px',
                    border: 'none',
                    display: 'block',
                    background: '#0e0e0e',
                  }}
                />
              ) : null}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
