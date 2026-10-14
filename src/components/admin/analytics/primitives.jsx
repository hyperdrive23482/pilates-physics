import { NO_VALUE, formatFraction } from './shared'

/**
 * Small layout pieces every analytics tab uses: section headings, the table
 * cells, a fraction cell, soft-failure notes. Kept here so the five tabs
 * cannot drift apart in type size or spacing.
 */

export const WARN = '#e0a458'
export const OK = '#7fbf8f'
export const BAD = '#ff7d7d'

export function SectionHeading({ children, note }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
      <h2
        style={{
          fontSize: '0.7rem',
          fontWeight: 600,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          color: 'var(--color-ink-muted)',
          margin: 0,
        }}
      >
        {children}
      </h2>
      {note ? <span style={{ fontSize: '0.72rem', color: 'var(--color-ink-dim)' }}>{note}</span> : null}
    </div>
  )
}

export function Section({ title, note, children, style }) {
  return (
    <section style={{ marginBottom: '3rem', ...style }}>
      {title ? <SectionHeading note={note}>{title}</SectionHeading> : null}
      {children}
    </section>
  )
}

export function Table({ head, children, minWidth }) {
  return (
    <div className="pp-table-wrap" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-rule)' }}>
      <table style={{ width: '100%', minWidth, borderCollapse: 'collapse', fontSize: '0.85rem' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--color-rule)' }}>
            {head.map(([label, align, title], i) => (
              <Th key={i} align={align} title={title}>
                {label}
              </Th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}

export function Th({ children, align = 'left', title }) {
  return (
    <th
      title={title}
      style={{
        textAlign: align,
        padding: '0.75rem 1rem',
        fontSize: '0.65rem',
        fontWeight: 600,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: 'var(--color-ink-muted)',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </th>
  )
}

export function Td({ children, align = 'left', mono, muted, colSpan, style }) {
  return (
    <td
      colSpan={colSpan}
      style={{
        padding: '0.75rem 1rem',
        textAlign: align,
        color: muted ? 'var(--color-ink-muted)' : 'var(--color-ink)',
        fontFamily: mono ? 'var(--font-mono)' : undefined,
        fontSize: mono ? '0.78rem' : undefined,
        fontVariantNumeric: mono ? 'tabular-nums' : undefined,
        verticalAlign: 'top',
        ...style,
      }}
    >
      {children}
    </td>
  )
}

export function Row({ children, onClick, open }) {
  return (
    <tr
      onClick={onClick}
      style={{
        borderBottom: '1px solid var(--color-rule)',
        cursor: onClick ? 'pointer' : undefined,
        background: open ? 'rgba(227, 227, 227, 0.03)' : undefined,
      }}
    >
      {children}
    </tr>
  )
}

/** "n of m · p%", or a dash when the denominator is unknown. */
export function Fraction({ value }) {
  if (!value || typeof value.m !== 'number') return NO_VALUE
  return formatFraction(value.n, value.m)
}

export function Muted({ children, style }) {
  return <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--color-ink-muted)', ...style }}>{children}</p>
}

export function Note({ children, tone = 'muted', style }) {
  const color = tone === 'warn' ? WARN : tone === 'bad' ? BAD : 'var(--color-ink-dim)'
  return <p style={{ margin: '0.5rem 0 0', fontSize: '0.72rem', color, lineHeight: 1.5, ...style }}>{children}</p>
}

/** One line listing the blocks that did not load and why. */
export function SoftErrors({ errors }) {
  const keys = Object.keys(errors ?? {})
  if (keys.length === 0) return null
  return (
    <Note tone="warn" style={{ marginBottom: '1.5rem' }}>
      Not loaded: {keys.map((k) => `${k} (${errors[k]})`).join('; ')}
    </Note>
  )
}

export function EmptyPanel({ title, children }) {
  return (
    <div className="pp-card">
      {title ? (
        <p style={{ margin: '0 0 0.5rem', fontFamily: 'var(--font-serif)', fontSize: '1rem', color: 'var(--color-ink)' }}>
          {title}
        </p>
      ) : null}
      <Muted>{children}</Muted>
    </div>
  )
}

export function KpiGrid({ children, min = 200 }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(auto-fit, minmax(${min}px, 1fr))`,
        gap: '1rem',
        marginBottom: '1rem',
      }}
    >
      {children}
    </div>
  )
}

export function Kind({ kind }) {
  if (!kind) return null
  return (
    <span
      style={{
        marginLeft: '0.5rem',
        fontSize: '0.6rem',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: 'var(--color-ink-dim)',
      }}
    >
      {kind === 'webinar' ? 'workshop' : kind}
    </span>
  )
}
