import { useState } from 'react'
import { Trash2, Plus } from 'lucide-react'
import { useAdminAPI } from '../../hooks/admin/useAdminAPI'

export default function EntitlementManager({ userRow, webinars, onChange }) {
  const { request } = useAdminAPI()
  const [webinarId, setWebinarId] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  async function grant() {
    if (!webinarId) return
    setBusy(true)
    setError(null)
    try {
      await request('/api/admin/grant-entitlement', {
        method: 'POST',
        body: {
          user_id: userRow.id,
          webinar_id: webinarId,
          expires_at: expiresAt || null,
        },
      })
      setWebinarId('')
      setExpiresAt('')
      onChange?.()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function revoke(id) {
    if (!confirm('Revoke this entitlement?')) return
    setBusy(true)
    setError(null)
    try {
      await request('/api/admin/revoke-entitlement', {
        method: 'POST',
        body: { entitlement_id: id },
      })
      onChange?.()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {userRow.entitlements?.length ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          {userRow.entitlements.map((e) => (
            <div
              key={e.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.8rem',
                background: 'var(--color-bg)',
                padding: '0.4rem 0.6rem',
                border: '1px solid var(--color-rule)',
              }}
            >
              <span style={{ color: 'var(--color-ink)' }}>
                {e.webinar?.title ?? e.webinar_id}
                <span style={{ color: 'var(--color-ink-muted)', marginLeft: '0.5rem' }}>
                  · {e.source}
                  {e.expires_at ? ` · expires ${new Date(e.expires_at).toLocaleDateString()}` : ''}
                </span>
              </span>
              <button
                type="button"
                onClick={() => revoke(e.id)}
                disabled={busy}
                aria-label="Revoke"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--color-ink-muted)',
                  cursor: busy ? 'wait' : 'pointer',
                  padding: '0.2rem',
                }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ fontSize: '0.8rem', color: 'var(--color-ink-muted)', margin: 0 }}>
          No entitlements.
        </p>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: '0.4rem' }}>
        <select
          value={webinarId}
          onChange={(e) => setWebinarId(e.target.value)}
          style={inputStyle}
        >
          <option value="">Grant access to…</option>
          {webinars.map((w) => (
            <option key={w.id} value={w.id}>
              {w.title} ({w.status})
            </option>
          ))}
        </select>
        <input
          type="date"
          value={expiresAt}
          onChange={(e) => setExpiresAt(e.target.value)}
          placeholder="Expires (optional)"
          style={inputStyle}
        />
        <button
          type="button"
          onClick={grant}
          disabled={busy || !webinarId}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.3rem',
            padding: '0.45rem 0.7rem',
            background: 'var(--color-accent)',
            color: '#1C1A17',
            border: 'none',
            cursor: busy || !webinarId ? 'not-allowed' : 'pointer',
            fontSize: '0.8rem',
            fontFamily: '"DM Sans", sans-serif',
            opacity: busy || !webinarId ? 0.6 : 1,
          }}
        >
          <Plus size={12} /> Grant
        </button>
      </div>

      {error && <p style={{ fontSize: '0.75rem', color: '#ff7d7d', margin: 0 }}>{error}</p>}
    </div>
  )
}

const inputStyle = {
  padding: '0.4rem 0.6rem',
  background: 'var(--color-bg)',
  color: 'var(--color-ink)',
  border: '1px solid var(--color-rule)',
  fontSize: '0.8rem',
  fontFamily: '"DM Sans", sans-serif',
  outline: 'none',
}
