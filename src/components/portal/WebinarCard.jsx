import { Link } from 'react-router-dom'
import { Calendar, Clock, ArrowRight } from 'lucide-react'
import StatusBadge from './StatusBadge'

export default function WebinarCard({ webinar, linkTo }) {
  const date = webinar.scheduled_at
    ? new Date(webinar.scheduled_at).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null

  const time = webinar.scheduled_at
    ? new Date(webinar.scheduled_at).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      })
    : null

  return (
    <Link
      to={linkTo}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        padding: '1.5rem',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-rule)',
        textDecoration: 'none',
        transition: 'border-color 0.2s',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--color-accent)')}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--color-rule)')}
    >
      {webinar.hero_image_url && (
        <img
          src={webinar.hero_image_url}
          alt={webinar.title}
          style={{
            width: '100%',
            aspectRatio: '16 / 9',
            objectFit: 'cover',
            display: 'block',
          }}
        />
      )}

      <StatusBadge status={webinar.kind === 'tool' ? 'tool' : webinar.status} />

      <h3
        style={{
          fontFamily: '"DM Serif Display", serif',
          fontSize: '1.15rem',
          lineHeight: '1.3',
          color: 'var(--color-ink)',
          margin: 0,
        }}
      >
        {webinar.title}
      </h3>

      {webinar.subtitle && (
        <p
          style={{
            fontSize: '0.9rem',
            lineHeight: '1.6',
            color: 'var(--color-ink-muted)',
            margin: 0,
          }}
        >
          {webinar.subtitle}
        </p>
      )}

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          fontSize: '0.8rem',
          color: 'var(--color-ink-muted)',
        }}
      >
        {date && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <Calendar size={13} /> {date}
          </span>
        )}
        {webinar.duration_min && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <Clock size={13} /> {webinar.duration_min} min
          </span>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.375rem',
          fontSize: '0.85rem',
          fontWeight: '500',
          color: 'var(--color-accent)',
          marginTop: 'auto',
        }}
      >
        {webinar.kind === 'tool'
          ? 'Open Tool'
          : webinar.status === 'complete'
          ? 'View Recording'
          : 'View Details'}
        <ArrowRight size={14} />
      </div>
    </Link>
  )
}
