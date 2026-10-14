import { formatCount } from './shared'

/**
 * A breakdown: label on the left, count on the right, a bar behind each row
 * scaled to the largest. Used for channels, referrers, sources, campaigns.
 */
export default function BreakdownTable({ title, rows, empty, valueLabel }) {
  if (!rows || rows.length === 0) {
    if (!empty) return null
    return (
      <div>
        {title ? <h4 style={headingStyle}>{title}</h4> : null}
        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-ink-muted)' }}>{empty}</p>
      </div>
    )
  }
  const max = Math.max(...rows.map((r) => r.value), 1)
  return (
    <div>
      {title ? <h4 style={headingStyle}>{title}</h4> : null}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {rows.map((row) => (
          <div
            key={row.label}
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.82rem',
              padding: '0.2rem 0.5rem',
              borderRadius: 4,
              color: 'var(--color-ink)',
            }}
          >
            <div
              aria-hidden
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: 0,
                width: `${(row.value / max) * 100}%`,
                background: 'rgba(240, 159, 38, 0.12)',
                borderRadius: 4,
              }}
            />
            <span
              style={{
                position: 'relative',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                paddingRight: '0.5rem',
              }}
            >
              {row.label}
            </span>
            <span
              style={{
                position: 'relative',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                color: 'var(--color-ink-muted)',
                fontVariantNumeric: 'tabular-nums',
                flexShrink: 0,
              }}
            >
              {formatCount(row.value)}
              {valueLabel ? ` ${valueLabel}` : ''}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

const headingStyle = {
  margin: '0 0 0.5rem',
  fontSize: '0.65rem',
  fontWeight: 600,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'var(--color-ink-muted)',
}
