export default function StatCard({ label, value, sublabel }) {
  return (
    <div
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-rule)',
        padding: '1.25rem 1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        minHeight: '100px',
        justifyContent: 'space-between',
      }}
    >
      <span
        style={{
          fontSize: '0.65rem',
          fontWeight: 600,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          color: 'var(--color-ink-muted)',
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: '"DM Serif Display", serif',
          fontSize: '1.75rem',
          color: 'var(--color-ink)',
          lineHeight: 1,
        }}
      >
        {value}
      </span>
      {sublabel ? (
        <span style={{ fontSize: '0.72rem', color: 'var(--color-ink-muted)' }}>{sublabel}</span>
      ) : null}
    </div>
  )
}
