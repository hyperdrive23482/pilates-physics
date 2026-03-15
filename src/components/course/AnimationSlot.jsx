export function AnimationSlot({ lessonId }) {
  return (
    <div
      id={`animation-${lessonId}`}
      style={{
        width: '100%',
        minHeight: '300px',
        border: '1px dashed var(--color-rule)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--color-surface)',
        margin: '2rem 0',
      }}
      aria-label="Interactive animation"
    >
      <div
        style={{
          textAlign: 'center',
          color: 'var(--color-ink-muted)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
        }}
      >
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          style={{ margin: '0 auto', opacity: 0.4 }}
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <span style={{ fontSize: '0.8rem' }}>Interactive diagram</span>
        <span style={{ fontSize: '0.72rem', opacity: 0.7 }}>Loading…</span>
      </div>
    </div>
  )
}
