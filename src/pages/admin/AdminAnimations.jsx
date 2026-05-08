import { useEffect, useState } from 'react'
import { ExternalLink } from 'lucide-react'
import { useEnrollment } from '../../hooks/useEnrollment'
import { useAdminAPI } from '../../hooks/admin/useAdminAPI'
import AdminNav from '../../components/admin/AdminNav'

// Injected into <head> of every animation: scale-class CSS overrides + a
// canvas font-setter monkey-patch that scales any `Npx ...` font string
// when window.__ppLabelScale > 1. Patch lives in <head> so it's installed
// before the animation's own <script> runs.
const MOBILE_SCALE_HEAD = `
<style data-pp-mobile-scale>
  body.__pp-mobile-scale h1 { font-size: clamp(30px, 5vw, 44px) !important; }
  body.__pp-mobile-scale .subtitle { font-size: 22px !important; line-height: 1.5 !important; }
  body.__pp-mobile-scale .eyebrow,
  body.__pp-mobile-scale .panel-label,
  body.__pp-mobile-scale .work-label,
  body.__pp-mobile-scale .notes-title { font-size: 18px !important; letter-spacing: 0.1em !important; }
  body.__pp-mobile-scale .work-value { font-size: 36px !important; }
  body.__pp-mobile-scale .work-value.center-val { font-size: 42px !important; }
  body.__pp-mobile-scale .legend-item,
  body.__pp-mobile-scale .notes li { font-size: 22px !important; }
  body.__pp-mobile-scale .notes-caveat { font-size: 20px !important; }
  body.__pp-mobile-scale button:not(#__pp_mobile_scale_btn) { font-size: 16px !important; padding: 14px 28px !important; }
</style>
<script data-pp-mobile-scale-patch>
(function(){
  var proto = window.CanvasRenderingContext2D && CanvasRenderingContext2D.prototype;
  if (!proto) return;
  var desc = Object.getOwnPropertyDescriptor(proto, 'font');
  var p = proto;
  while (!desc && (p = Object.getPrototypeOf(p))) {
    desc = p && Object.getOwnPropertyDescriptor(p, 'font');
  }
  if (!desc || !desc.set || !desc.get) return;
  window.__ppLabelScale = 1;
  Object.defineProperty(proto, 'font', {
    configurable: true,
    get: function(){ return desc.get.call(this); },
    set: function(v){
      if (typeof v === 'string' && (window.__ppLabelScale || 1) !== 1) {
        v = v.replace(/(\\d+(?:\\.\\d+)?)px /, function(_, n){
          return Math.round(Number(n) * window.__ppLabelScale) + 'px ';
        });
      }
      desc.set.call(this, v);
    }
  });
})();
</script>`

// Injected before </body>: a fixed-position toggle button. Hidden when the
// page is inside an iframe (admin preview) so the button only shows up on
// the standalone tab where screen-recording happens.
const MOBILE_SCALE_BODY = `
<script data-pp-mobile-scale-controls>
(function(){
  if (window.top !== window.self) return;
  function init(){
    var btn = document.createElement('button');
    btn.id = '__pp_mobile_scale_btn';
    btn.type = 'button';
    btn.textContent = 'Mobile scale';
    btn.style.cssText = 'position:fixed;top:12px;right:12px;z-index:99999;padding:8px 14px;font-family:\\'DM Mono\\',monospace;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;background:rgba(20,20,20,0.85);color:#e8e4dc;border:1px solid #2a2a2a;border-radius:6px;cursor:pointer;backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);';
    btn.addEventListener('click', function(){
      var on = !document.body.classList.contains('__pp-mobile-scale');
      document.body.classList.toggle('__pp-mobile-scale', on);
      window.__ppLabelScale = on ? 1.6 : 1;
      btn.style.borderColor = on ? '#c8a96e' : '#2a2a2a';
      btn.style.color = on ? '#c8a96e' : '#e8e4dc';
      btn.textContent = on ? 'Mobile scale · on' : 'Mobile scale';
      window.dispatchEvent(new Event('resize'));
    });
    document.body.appendChild(btn);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
</script>`

function injectMobileScaleControls(html) {
  if (!html) return html
  const withHead = html.includes('</head>')
    ? html.replace('</head>', `${MOBILE_SCALE_HEAD}</head>`)
    : MOBILE_SCALE_HEAD + html
  return withHead.includes('</body>')
    ? withHead.replace('</body>', `${MOBILE_SCALE_BODY}</body>`)
    : withHead + MOBILE_SCALE_BODY
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

  const displayedHtml = injectMobileScaleControls(html)

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
                    padding: '0.45rem 0.6rem',
                    borderBottom: '1px solid var(--color-rule)',
                  }}
                >
                  <button
                    type="button"
                    onClick={openStandalone}
                    title="Open as standalone full-screen page (no admin nav). Includes a mobile-scale toggle in the top-right for screenshotting at narrow widths."
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
