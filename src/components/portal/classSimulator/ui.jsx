// Small shared controls for the Class Simulator, styled to match
// SpringLoadCalculator's segmented toggle.

export function SegmentedToggle({ value, onChange, options, ariaLabel, size = 'md' }) {
  const pad = size === 'sm' ? '0.35rem 0.6rem' : '0.5rem 1rem'
  const font = size === 'sm' ? '0.72rem' : '0.8rem'
  return (
    <div
      style={{
        display: 'inline-flex',
        border: '1px solid var(--color-rule)',
        borderRadius: '2px',
        background: 'var(--color-bg)',
      }}
      role="radiogroup"
      aria-label={ariaLabel}
    >
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            style={{
              padding: pad,
              fontSize: font,
              fontFamily: 'var(--font-serif)',
              fontWeight: '500',
              letterSpacing: '0.02em',
              color: active ? 'var(--color-accent-ink)' : 'var(--color-ink-muted)',
              background: active ? 'var(--color-accent)' : 'transparent',
              border: 'none',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

/** Tiny uppercase mono label used above control groups. */
export function FieldLabel({ children }) {
  return (
    <div
      style={{
        fontSize: '0.62rem',
        fontFamily: 'var(--font-mono, monospace)',
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: 'var(--color-ink-muted)',
        marginBottom: '0.35rem',
      }}
    >
      {children}
    </div>
  )
}
