import { Link } from 'react-router-dom'
import { Calendar, Clock, ArrowRight } from 'lucide-react'
import StatusBadge from './StatusBadge'

export default function WorkshopCard({ workshop, linkTo }) {
  const date = workshop.scheduled_at
    ? new Date(workshop.scheduled_at).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null

  const time = workshop.scheduled_at
    ? new Date(workshop.scheduled_at).toLocaleTimeString('en-US', {
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
      {workshop.hero_image_url && (
        <img
          src={workshop.hero_image_url}
          alt={workshop.title}
          style={{
            width: '100%',
            aspectRatio: '16 / 9',
            objectFit: 'cover',
            display: 'block',
          }}
        />
      )}

      <StatusBadge status={workshop.kind === 'tool' ? 'tool' : workshop.status} />

      <h3
        style={{
          fontFamily: '"DM Serif Display", serif',
          fontSize: '1.15rem',
          lineHeight: '1.3',
          color: 'var(--color-ink)',
          margin: 0,
        }}
      >
        {workshop.title}
      </h3>

      {workshop.subtitle && (
        <p
          style={{
            fontSize: '0.9rem',
            lineHeight: '1.6',
            color: 'var(--color-ink-muted)',
            margin: 0,
          }}
        >
          {workshop.subtitle}
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
        {workshop.duration_min && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <Clock size={13} /> {workshop.duration_min} min
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
        {workshop.kind === 'tool'
          ? 'Open Tool'
          : workshop.status === 'complete'
          ? 'View Recording'
          : 'View Details'}
        <ArrowRight size={14} />
      </div>
    </Link>
  )
}
