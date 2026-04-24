import { useEffect, useState } from 'react'
import { useEnrollment } from '../../hooks/useEnrollment'
import { useAdminAPI } from '../../hooks/admin/useAdminAPI'
import AdminNav from '../../components/admin/AdminNav'

const WIDGET_FILE = 'pose-overlay-studio.html'

export default function AdminPoseStudio() {
  const { user, signOut } = useEnrollment()
  const { request } = useAdminAPI()
  const [html, setHtml] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    request(`/api/admin/animation?name=${encodeURIComponent(WIDGET_FILE)}`)
      .then(({ html }) => {
        if (!cancelled) setHtml(html)
      })
      .catch((e) => {
        if (!cancelled) setError(e.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [request])

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
            Pose Studio
          </h1>
          <p style={{ color: 'var(--color-ink-muted)', fontSize: '0.85rem', marginTop: '0.35rem' }}>
            Upload a video to overlay a MediaPipe pose skeleton and record the annotated output.
          </p>
        </div>

        {error && (
          <p style={{ color: '#ff7d7d', fontSize: '0.85rem', marginBottom: '1rem' }}>{error}</p>
        )}

        <div
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-rule)',
            minHeight: '900px',
          }}
        >
          {loading ? (
            <p
              style={{
                padding: '1.5rem',
                color: 'var(--color-ink-muted)',
                fontSize: '0.9rem',
              }}
            >
              Loading…
            </p>
          ) : html ? (
            <iframe
              srcDoc={html}
              title="Pose Studio"
              style={{
                width: '100%',
                height: '1200px',
                border: 'none',
                display: 'block',
                background: '#0d0e10',
              }}
            />
          ) : null}
        </div>
      </main>
    </div>
  )
}
