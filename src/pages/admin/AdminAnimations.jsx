import { useEffect, useState } from 'react'
import { ExternalLink, Smartphone } from 'lucide-react'
import { useEnrollment } from '../../hooks/useEnrollment'
import { useAdminAPI } from '../../hooks/admin/useAdminAPI'
import AdminNav from '../../components/admin/AdminNav'

const MOBILE_SCALE_STYLE = `
<style data-mobile-scale>
  h1 { font-size: clamp(30px, 5vw, 44px) !important; }
  .subtitle { font-size: 22px !important; line-height: 1.5 !important; }
  .eyebrow, .panel-label, .work-label, .notes-title {
    font-size: 18px !important;
    letter-spacing: 0.1em !important;
  }
  .work-value { font-size: 36px !important; }
  .work-value.center-val { font-size: 42px !important; }
  .legend-item, .notes li { font-size: 22px !important; }
  .notes-caveat { font-size: 20px !important; }
  button { font-size: 16px !important; padding: 14px 28px !important; }
</style>`

function applyMobileScale(html) {
  if (!html) return html
  const withCss = html.includes('</head>')
    ? html.replace('</head>', `${MOBILE_SCALE_STYLE}</head>`)
    : MOBILE_SCALE_STYLE + html
  return withCss.replace(
    /(\.font\s*=\s*['"`])(\d+)px /g,
    (_, prefix, px) => `${prefix}${Math.round(Number(px) * 1.6)}px `
  )
}

export default function AdminAnimations() {
  const { user, signOut } = useEnrollment()
  const { request } = useAdminAPI()

  const [list, setList] = useState([])
  const [selected, setSelected] = useState(null)
  const [html, setHtml] = useState('')
  const [listLoading, setListLoading] = useState(true)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [error, setError] = useState(null)
  const [mobileScale, setMobileScale] = useState(false)

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

  const displayedHtml = mobileScale ? applyMobileScale(html) : html

  function openStandalone() {
    if (!displayedHtml) return
    const blob = new Blob([displayedHtml], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank', 'noopener,noreferrer')
    // Give the new tab a generous window to load before reclaiming the blob.
    setTimeout(() => URL.revokeObjectURL(url), 60_000)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <AdminNav user={user} onSignOut={signOut} />

      <main className="pp-main" style={{ maxWidth: '1400px', margin: '0 auto' }}>
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
          <div className="pp-animations-layout">
            <aside
              style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-rule)',
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
                position: 'relative',
              }}
            >
              {html && !previewLoading && (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '0.5rem',
                    padding: '0.45rem 0.6rem',
                    borderBottom: '1px solid var(--color-rule)',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setMobileScale((v) => !v)}
                    title="Scale up labels for screenshotting at narrow widths (social content). Carries through to standalone view."
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.35rem 0.7rem',
                      background: mobileScale ? 'rgba(255,255,255,0.04)' : 'transparent',
                      border: mobileScale
                        ? '1px solid var(--color-accent)'
                        : '1px solid var(--color-rule)',
                      color: mobileScale ? 'var(--color-accent)' : 'var(--color-ink)',
                      fontFamily: 'inherit',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                    }}
                  >
                    <Smartphone size={12} /> Mobile scale{mobileScale ? ' · on' : ''}
                  </button>
                  <button
                    type="button"
                    onClick={openStandalone}
                    title="Open as standalone full-screen page (no admin nav) — useful for mobile preview and screen recording"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.35rem 0.7rem',
                      background: 'transparent',
                      border: '1px solid var(--color-rule)',
                      color: 'var(--color-ink)',
                      fontFamily: 'inherit',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                    }}
                  >
                    <ExternalLink size={12} /> Open standalone
                  </button>
                </div>
              )}
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
                  srcDoc={displayedHtml}
                  title={selected ?? 'Animation preview'}
                  style={{
                    width: '100%',
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
