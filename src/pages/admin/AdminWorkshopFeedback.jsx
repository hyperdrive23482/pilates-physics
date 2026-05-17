import { useEffect, useState } from 'react'
import { useEnrollment } from '../../hooks/useEnrollment'
import { useAdminAPI } from '../../hooks/admin/useAdminAPI'
import AdminNav from '../../components/admin/AdminNav'
import WorkshopFeedbackPanel from '../../components/admin/WorkshopFeedbackPanel'

export default function AdminWorkshopFeedback() {
  const { user, signOut } = useEnrollment()
  const { request } = useAdminAPI()
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [selectedKey, setSelectedKey] = useState(null)

  useEffect(() => {
    request('/api/admin/workshop-feedback')
      .then((d) => {
        setData(d)
        if (d.workshops?.[0]) setSelectedKey(d.workshops[0].key)
      })
      .catch((e) => setError(e.message))
  }, [request])

  const selected = selectedKey ? data?.by_workshop?.[selectedKey] : null

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <AdminNav user={user} onSignOut={signOut} />

      <main className="pp-main" style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <h1
          style={{
            fontFamily: '"DM Serif Display", serif',
            fontSize: 'clamp(1.5rem, 3vw, 2rem)',
            color: 'var(--color-ink)',
            margin: '0 0 2rem',
          }}
        >
          Workshop feedback
        </h1>

        {error && <p style={{ color: '#ff7d7d', fontSize: '0.85rem' }}>{error}</p>}
        {!data && !error && (
          <p style={{ color: 'var(--color-ink-muted)', fontSize: '0.9rem' }}>Loading…</p>
        )}

        {data && data.workshops.length === 0 && (
          <p style={{ color: 'var(--color-ink-muted)', fontSize: '0.9rem' }}>
            No feedback submitted yet for any workshop.
          </p>
        )}

        {data && data.workshops.length > 0 && (
          <>
            <div style={{ marginBottom: '2rem' }}>
              <label
                htmlFor="ws-select"
                style={{
                  display: 'block',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color: 'var(--color-ink-muted)',
                  marginBottom: '0.5rem',
                }}
              >
                Workshop
              </label>
              <select
                id="ws-select"
                value={selectedKey ?? ''}
                onChange={(e) => setSelectedKey(e.target.value)}
                style={{
                  background: 'var(--color-surface)',
                  color: 'var(--color-ink)',
                  border: '1px solid var(--color-rule)',
                  padding: '0.6rem 0.8rem',
                  fontSize: '0.9rem',
                  fontFamily: '"DM Sans", sans-serif',
                  minWidth: '320px',
                }}
              >
                {data.workshops.map((w) => (
                  <option key={w.key} value={w.key}>
                    {w.workshop_title} — {w.workshop_date} ({w.count})
                  </option>
                ))}
              </select>
            </div>

            {selected && (
              <WorkshopFeedbackPanel
                workshopTitle={selected.workshop_title}
                workshopDate={selected.workshop_date}
                data={selected}
              />
            )}
          </>
        )}
      </main>
    </div>
  )
}
