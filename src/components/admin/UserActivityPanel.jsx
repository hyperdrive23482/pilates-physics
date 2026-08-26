import { useEffect, useState, useCallback } from 'react'
import { ClipboardCheck, Copy } from 'lucide-react'
import { useAdminAPI } from '../../hooks/admin/useAdminAPI'
import { buildDisputeEvidence } from '../../lib/disputeEvidence'

const EVENT_LABELS = {
  login: 'Signed in',
  portal_view: 'Portal view',
  dashboard_view: 'Dashboard',
  content_click: 'Opened content',
  download: 'Download',
  tool_open: 'Tool',
  certificate_download: 'Certificate',
  checkout_start: 'Checkout started',
  purchase: 'Purchase',
  entitlement_granted: 'Access granted',
  lead_magnet_claim: 'Free resource',
}

const fmt = (value) =>
  new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })

export default function UserActivityPanel({ userRow }) {
  const { request } = useAdminAPI()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ user_id: userRow.id })
      if (userRow.email) params.set('email', userRow.email)
      setData(await request(`/api/admin/user-activity?${params}`))
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [request, userRow.id, userRow.email])

  useEffect(() => {
    load()
  }, [load])

  async function copyEvidence() {
    try {
      await navigator.clipboard.writeText(buildDisputeEvidence(data))
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      setError('Could not copy to clipboard.')
    }
  }

  if (loading) return <p style={mutedStyle}>Loading activity…</p>
  if (error) return <p style={{ ...mutedStyle, color: '#ff7d7d' }}>{error}</p>
  if (!data) return null

  const events = [...(data.events ?? [])].reverse()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
        <span style={mutedStyle}>
          {events.length === 0
            ? 'No recorded activity'
            : `${events.length} event${events.length === 1 ? '' : 's'}`}
          {data.truncated ? ' (capped)' : ''}
        </span>
        <button
          type="button"
          onClick={copyEvidence}
          disabled={!events.length}
          title="Copy a plain-text summary formatted for Stripe's Access activity log field"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.4rem 0.65rem',
            background: 'transparent',
            color: 'var(--color-ink)',
            border: '1px solid var(--color-rule)',
            cursor: events.length ? 'pointer' : 'not-allowed',
            opacity: events.length ? 1 : 0.5,
            fontSize: '0.75rem',
            fontFamily: 'var(--font-serif)',
          }}
        >
          {copied ? <ClipboardCheck size={12} /> : <Copy size={12} />}
          {copied ? 'Copied' : 'Copy dispute evidence'}
        </button>
      </div>

      {events.length > 0 && (
        <div style={{ maxHeight: '320px', overflowY: 'auto', border: '1px solid var(--color-rule)' }}>
          {events.map((e) => (
            <div
              key={e.id}
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: '0.6rem',
                padding: '0.4rem 0.6rem',
                borderBottom: '1px solid var(--color-rule)',
                fontSize: '0.75rem',
              }}
            >
              <span style={{ color: 'var(--color-ink-muted)', whiteSpace: 'nowrap' }}>
                {fmt(e.created_at)}
              </span>
              <span style={{ color: 'var(--color-ink)', flex: 1, minWidth: 0 }}>
                {EVENT_LABELS[e.event_type] ?? e.event_type}
                {(e.metadata?.content_title || e.tool_slug || e.webinar_slug) && (
                  <span style={{ color: 'var(--color-ink-muted)' }}>
                    {' · '}
                    {e.metadata?.content_title || e.tool_slug || e.webinar_slug}
                  </span>
                )}
              </span>
              {/* Server-recorded events cannot be produced by a browser, so the
                  distinction is worth showing rather than flattening. */}
              <span
                title={e.source === 'server' ? 'Recorded server-side' : 'Reported by the signed-in browser'}
                style={{
                  fontSize: '0.6rem',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: e.source === 'server' ? 'var(--color-accent)' : 'var(--color-ink-muted)',
                  whiteSpace: 'nowrap',
                }}
              >
                {e.source}
              </span>
              <span style={{ color: 'var(--color-ink-muted)', whiteSpace: 'nowrap' }}>
                {e.ip_address ?? '—'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const mutedStyle = { fontSize: '0.8rem', color: 'var(--color-ink-muted)', margin: 0 }
