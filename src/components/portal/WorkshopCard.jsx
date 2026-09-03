import { Link } from 'react-router-dom'
import { Calendar, Clock, ArrowRight } from 'lucide-react'
import StatusBadge from './StatusBadge'

// `progress` is only passed for courses: { done, total }. It turns the card
// into a resume point rather than a link to the front of something already
// half finished.
export default function WorkshopCard({ workshop, linkTo, progress }) {
  const date = workshop.scheduled_at
    ? new Date(workshop.scheduled_at).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null

  return (
    <Link
      to={linkTo}
      className="pp-card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
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

      <StatusBadge
        status={
          workshop.kind === 'tool' || workshop.kind === 'resource'
            ? workshop.kind
            : workshop.status
        }
      />

      <h3
        style={{
          fontFamily: 'var(--font-serif)',
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

      {progress && progress.total > 0 && (
        <div style={{ marginTop: 'auto' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '0.75rem',
              color: 'var(--color-ink-muted)',
              marginBottom: '0.35rem',
            }}
          >
            <span>
              {progress.done} of {progress.total} modules
            </span>
            <span>{Math.round((progress.done / progress.total) * 100)}%</span>
          </div>
          <div style={{ height: '3px', background: 'var(--color-rule)', overflow: 'hidden' }}>
            <div
              style={{
                width: `${Math.round((progress.done / progress.total) * 100)}%`,
                height: '100%',
                background: 'var(--color-accent)',
              }}
            />
          </div>
        </div>
      )}

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.375rem',
          fontSize: '0.85rem',
          fontWeight: '500',
          color: 'var(--color-accent)',
          marginTop: progress ? '0.75rem' : 'auto',
        }}
      >
        {workshop.kind === 'course'
          ? progress && progress.done > 0
            ? progress.done >= progress.total
              ? 'Review the course'
              : 'Continue'
            : 'Start the course'
          : workshop.kind === 'tool'
          ? 'Open Tool'
          : workshop.kind === 'resource'
          ? 'Open Resource'
          : workshop.status === 'complete'
          ? 'View Recording'
          : workshop.status === 'awaiting_recording'
          ? 'View Materials'
          : 'View Details'}
        <ArrowRight size={14} />
      </div>
    </Link>
  )
}
