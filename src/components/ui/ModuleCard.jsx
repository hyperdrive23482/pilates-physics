import { Link } from 'react-router-dom'

export default function ModuleCard({ module }) {
  const { number, title, description, color, comingSoon } = module

  return (
    <div
      style={{
        borderTop: `3px solid ${color}`,
        background: 'var(--color-surface)',
        padding: '1.75rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        position: 'relative',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span
          style={{
            fontSize: '0.7rem',
            fontWeight: '600',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: color,
          }}
        >
          Module {number}
        </span>
        {comingSoon && (
          <span
            style={{
              fontSize: '0.65rem',
              fontWeight: '600',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              background: color,
              color: '#fff',
              padding: '0.2rem 0.5rem',
            }}
          >
            Coming Soon
          </span>
        )}
      </div>

      <h3
        style={{
          fontFamily: '"DM Serif Display", serif',
          fontSize: '1.2rem',
          lineHeight: '1.3',
          color: 'var(--color-ink)',
          margin: 0,
        }}
      >
        {title}
      </h3>

      <p
        style={{
          fontSize: '0.875rem',
          lineHeight: '1.6',
          color: 'var(--color-ink-muted)',
          margin: 0,
        }}
      >
        {description}
      </p>

      {comingSoon ? (
        <span
          style={{
            marginTop: 'auto',
            paddingTop: '0.75rem',
            fontSize: '0.8rem',
            fontWeight: '500',
            color: 'var(--color-ink-muted)',
            borderTop: '1px solid var(--color-rule)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
          }}
        >
          Coming Soon
        </span>
      ) : (
        <Link
          to="/course"
          style={{
            marginTop: 'auto',
            paddingTop: '0.75rem',
            fontSize: '0.8rem',
            fontWeight: '500',
            color: color,
            textDecoration: 'none',
            borderTop: '1px solid var(--color-rule)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
          }}
        >
          Preview →
        </Link>
      )}
    </div>
  )
}
