import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { useAdminAPI } from '../../hooks/admin/useAdminAPI'

export default function BulkGrantModal({ tools, sourceWorkshops, onClose }) {
  const { request } = useAdminAPI()

  const [targetId, setTargetId] = useState('')
  const [sourceId, setSourceId] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [preview, setPreview] = useState(null)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    setPreview(null)
    setResult(null)
    setError(null)
    if (!sourceId || !targetId || sourceId === targetId) return
    let cancelled = false
    async function run() {
      try {
        const r = await request('/api/admin/bulk-grant-entitlement', {
          method: 'POST',
          body: {
            source_webinar_id: sourceId,
            target_webinar_id: targetId,
            dry_run: true,
          },
        })
        if (!cancelled) setPreview(r)
      } catch (err) {
        if (!cancelled) setError(err.message)
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [sourceId, targetId, request])

  async function grant() {
    if (!sourceId || !targetId) return
    setBusy(true)
    setError(null)
    try {
      const r = await request('/api/admin/bulk-grant-entitlement', {
        method: 'POST',
        body: {
          source_webinar_id: sourceId,
          target_webinar_id: targetId,
          expires_at: expiresAt || null,
        },
      })
      setResult(r)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const targetTitle = tools.find((t) => t.id === targetId)?.title
  const sourceTitle = sourceWorkshops.find((w) => w.id === sourceId)?.title
  const sameIds = sourceId && targetId && sourceId === targetId

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Bulk grant tool access"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-rule)',
          width: '100%',
          maxWidth: '520px',
          maxHeight: '90vh',
          overflow: 'auto',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem 1.25rem',
            borderBottom: '1px solid var(--color-rule)',
          }}
        >
          <h2
            style={{
              fontFamily: '"DM Serif Display", serif',
              fontSize: '1.15rem',
              color: 'var(--color-ink)',
              margin: 0,
            }}
          >
            Bulk grant tool access
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--color-ink-muted)',
              cursor: 'pointer',
              padding: '0.25rem',
            }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-ink-muted)', margin: 0 }}>
            Grant a tool to every member who already has access to a selected workshop. Members who
            already have the tool are skipped.
          </p>

          <Field label="Tool to grant">
            <select value={targetId} onChange={(e) => setTargetId(e.target.value)} style={inputStyle}>
              <option value="">Select a tool…</option>
              {tools.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Source — grant to everyone with access to">
            <select value={sourceId} onChange={(e) => setSourceId(e.target.value)} style={inputStyle}>
              <option value="">Select a workshop…</option>
              {sourceWorkshops.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.title} ({w.status})
                </option>
              ))}
            </select>
          </Field>

          <Field label="Expires (optional)">
            <input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              style={inputStyle}
            />
          </Field>

          {sameIds && (
            <p style={{ fontSize: '0.8rem', color: '#ff7d7d', margin: 0 }}>
              Source and target must differ.
            </p>
          )}

          {!sameIds && preview && !result && (
            <div
              style={{
                background: 'var(--color-bg)',
                border: '1px solid var(--color-rule)',
                padding: '0.75rem 1rem',
                fontSize: '0.85rem',
                color: 'var(--color-ink)',
                lineHeight: 1.5,
              }}
            >
              <div style={{ color: 'var(--color-ink-muted)', fontSize: '0.75rem', marginBottom: '0.4rem' }}>
                Preview
              </div>
              <div>
                <strong>{preview.source_users}</strong> member
                {preview.source_users === 1 ? '' : 's'} have access to{' '}
                <em>{sourceTitle}</em>.
              </div>
              <div>
                <strong>{preview.newly_granted}</strong> will be granted access to{' '}
                <em>{targetTitle}</em>.
              </div>
              <div style={{ color: 'var(--color-ink-muted)' }}>
                {preview.already_granted} already have it (no-op).
              </div>
            </div>
          )}

          {result && (
            <div
              style={{
                background: 'rgba(100,255,150,0.08)',
                border: '1px solid rgba(100,255,150,0.25)',
                padding: '0.75rem 1rem',
                fontSize: '0.85rem',
                color: 'var(--color-ink)',
                lineHeight: 1.5,
              }}
            >
              Granted access to <strong>{result.newly_granted}</strong> member
              {result.newly_granted === 1 ? '' : 's'}. {result.already_granted} already had access.
            </div>
          )}

          {error && (
            <p style={{ fontSize: '0.8rem', color: '#ff7d7d', margin: 0 }}>{error}</p>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.5rem',
            padding: '1rem 1.25rem',
            borderTop: '1px solid var(--color-rule)',
          }}
        >
          <button type="button" onClick={onClose} style={secondaryBtn}>
            {result ? 'Close' : 'Cancel'}
          </button>
          {!result && (
            <button
              type="button"
              onClick={grant}
              disabled={
                busy || !sourceId || !targetId || sameIds || (preview && preview.newly_granted === 0)
              }
              style={{
                ...primaryBtn,
                opacity:
                  busy || !sourceId || !targetId || sameIds || (preview && preview.newly_granted === 0)
                    ? 0.5
                    : 1,
                cursor:
                  busy || !sourceId || !targetId || sameIds || (preview && preview.newly_granted === 0)
                    ? 'not-allowed'
                    : 'pointer',
              }}
            >
              {busy
                ? 'Granting…'
                : preview
                  ? `Grant to ${preview.newly_granted} member${preview.newly_granted === 1 ? '' : 's'}`
                  : 'Grant'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
      <span
        style={{
          fontSize: '0.7rem',
          fontWeight: 600,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--color-ink-muted)',
        }}
      >
        {label}
      </span>
      {children}
    </label>
  )
}

const inputStyle = {
  padding: '0.55rem 0.7rem',
  background: 'var(--color-bg)',
  color: 'var(--color-ink)',
  border: '1px solid var(--color-rule)',
  fontSize: '0.85rem',
  fontFamily: '"DM Sans", sans-serif',
  outline: 'none',
  width: '100%',
}

const primaryBtn = {
  padding: '0.55rem 1rem',
  background: 'var(--color-accent)',
  color: '#1C1A17',
  border: 'none',
  fontSize: '0.85rem',
  fontFamily: '"DM Sans", sans-serif',
  fontWeight: 500,
}

const secondaryBtn = {
  padding: '0.55rem 1rem',
  background: 'transparent',
  color: 'var(--color-ink)',
  border: '1px solid var(--color-rule)',
  fontSize: '0.85rem',
  fontFamily: '"DM Sans", sans-serif',
  cursor: 'pointer',
}
