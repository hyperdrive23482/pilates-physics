import { Video, Calendar, Clock, Copy, Check } from 'lucide-react'
import { useState } from 'react'

export default function ZoomInfo({ webinar }) {
  const [copied, setCopied] = useState(null)

  if (!webinar.zoom_link) return null
  if (webinar.status !== 'upcoming' && webinar.status !== 'live') return null

  function copyToClipboard(text, field) {
    navigator.clipboard.writeText(text)
    setCopied(field)
    setTimeout(() => setCopied(null), 2000)
  }

  const date = webinar.scheduled_at
    ? new Date(webinar.scheduled_at).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null

  const time = webinar.scheduled_at
    ? new Date(webinar.scheduled_at).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        timeZoneName: 'short',
      })
    : null

  return (
    <div
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-rule)',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Video size={18} style={{ color: 'var(--color-accent)' }} />
        <h3
          style={{
            fontFamily: '"DM Serif Display", serif',
            fontSize: '1.1rem',
            color: 'var(--color-ink)',
            margin: 0,
          }}
        >
          Zoom Meeting Details
        </h3>
      </div>

      {date && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Calendar size={16} style={{ color: 'var(--color-ink-muted)', flexShrink: 0 }} />
          <span style={{ fontSize: '0.9rem', color: 'var(--color-ink)' }}>{date}</span>
        </div>
      )}

      {time && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Clock size={16} style={{ color: 'var(--color-ink-muted)', flexShrink: 0 }} />
          <span style={{ fontSize: '0.9rem', color: 'var(--color-ink)' }}>
            {time}
            {webinar.duration_min ? ` (${webinar.duration_min} min)` : ''}
          </span>
        </div>
      )}

      <div
        style={{
          borderTop: '1px solid var(--color-rule)',
          paddingTop: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <a
            href={webinar.zoom_link}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: '0.9rem',
              color: 'var(--color-accent)',
              textDecoration: 'none',
              fontWeight: '500',
            }}
          >
            Join Zoom Meeting
          </a>
          <button
            onClick={() => copyToClipboard(webinar.zoom_link, 'link')}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-ink-muted)',
              padding: '2px',
              display: 'flex',
            }}
            title="Copy link"
          >
            {copied === 'link' ? <Check size={14} /> : <Copy size={14} />}
          </button>
        </div>

        {webinar.zoom_passcode && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-ink-muted)' }}>
              Passcode: <span style={{ color: 'var(--color-ink)' }}>{webinar.zoom_passcode}</span>
            </span>
            <button
              onClick={() => copyToClipboard(webinar.zoom_passcode, 'passcode')}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--color-ink-muted)',
                padding: '2px',
                display: 'flex',
              }}
              title="Copy passcode"
            >
              {copied === 'passcode' ? <Check size={14} /> : <Copy size={14} />}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
