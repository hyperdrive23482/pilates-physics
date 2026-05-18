export default function StatCard({ label, value, sublabel }) {
  return (
    <div
      className="pp-card"
      style={{
        padding: '1.25rem 1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        minHeight: '100px',
        justifyContent: 'space-between',
      }}
    >
      <span className="pp-section-label" style={{ fontSize: '0.65rem' }}>
        {label}
      </span>
      <span
        style={{
          fontFamily: 'var(--font-serif)',
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
