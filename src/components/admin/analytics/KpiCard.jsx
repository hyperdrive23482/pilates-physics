/**
 * A headline number. Clickable ones drive the metric chart on their tab: the
 * selected card gets an accent ring and the chart below redraws for it.
 */
export default function KpiCard({ title, value, subtitle, icon: Icon, selected = false, onClick }) {
  const interactive = typeof onClick === 'function'
  return (
    <div
      className="pp-card"
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onClick()
              }
            }
          : undefined
      }
      style={{
        padding: '1.25rem 1.5rem',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: '1rem',
        minHeight: '100px',
        cursor: interactive ? 'pointer' : 'default',
        outline: selected ? '2px solid var(--color-accent)' : 'none',
        outlineOffset: '-1px',
        transition: 'border-color 0.15s ease',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: 0 }}>
        <span className="pp-section-label" style={{ fontSize: '0.65rem' }}>
          {title}
        </span>
        <span
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '1.75rem',
            color: 'var(--color-ink)',
            lineHeight: 1,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {value}
        </span>
        {subtitle ? (
          <span style={{ fontSize: '0.72rem', color: 'var(--color-ink-muted)' }}>{subtitle}</span>
        ) : null}
      </div>
      {Icon ? (
        <span
          aria-hidden
          style={{
            flexShrink: 0,
            width: 40,
            height: 40,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(240, 159, 38, 0.12)',
            color: 'var(--color-accent)',
          }}
        >
          <Icon size={18} />
        </span>
      ) : null}
    </div>
  )
}
