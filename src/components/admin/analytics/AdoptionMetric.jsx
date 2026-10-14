/** A percentage with its raw fraction underneath and a bar for the shape of it. */
export default function AdoptionMetric({ label, current, total, totalLabel = 'people' }) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0
  return (
    <div>
      <p style={{ margin: '0 0 0.25rem', fontSize: '0.8rem', color: 'var(--color-ink-muted)' }}>{label}</p>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
        <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', color: 'var(--color-ink)' }}>{pct}%</span>
        <span style={{ fontSize: '0.72rem', color: 'var(--color-ink-muted)' }}>
          ({current} / {total} {totalLabel})
        </span>
      </div>
      <div
        style={{
          marginTop: '0.5rem',
          height: 6,
          borderRadius: 3,
          background: 'rgba(227, 227, 227, 0.1)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            background: 'var(--color-accent)',
            borderRadius: 3,
            transition: 'width 0.3s ease',
          }}
        />
      </div>
    </div>
  )
}
