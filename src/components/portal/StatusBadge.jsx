import { Calendar, Radio, PlayCircle, Archive } from 'lucide-react'

const config = {
  upcoming: { label: 'Upcoming', color: '#5B9BD5', icon: Calendar },
  live: { label: 'Live Now', color: '#e06c75', icon: Radio },
  complete: { label: 'Recording Available', color: 'var(--color-accent)', icon: PlayCircle },
  archived: { label: 'Archived', color: 'var(--color-ink-muted)', icon: Archive },
}

export default function StatusBadge({ status }) {
  const { label, color, icon: Icon } = config[status] || config.upcoming

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.375rem',
        fontSize: '0.7rem',
        fontWeight: '600',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color,
        padding: '0.25rem 0.625rem',
        border: `1px solid ${color}`,
        borderRadius: '2px',
      }}
    >
      <Icon size={12} />
      {label}
    </span>
  )
}
