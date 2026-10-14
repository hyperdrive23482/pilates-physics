import { BAD, WARN } from '../analytics/primitives'
import { SEVERITY_LABEL } from '../../../lib/seoFindings'

/**
 * Small pieces the four SEO tabs share: severity badge, a finding as text,
 * the compact button, a labelled number, and a pill.
 */

const SEVERITY_COLOR = { error: BAD, warn: WARN, info: 'var(--color-ink-dim)' }

export function SeverityBadge({ severity }) {
  const color = SEVERITY_COLOR[severity] ?? 'var(--color-ink-dim)'
  return (
    <span
      style={{
        flexShrink: 0,
        display: 'inline-block',
        minWidth: '4.5rem',
        textAlign: 'center',
        padding: '0.15rem 0.45rem',
        border: `1px solid ${color}`,
        borderRadius: 4,
        color,
        fontFamily: 'var(--font-mono)',
        fontSize: '0.62rem',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
      }}
    >
      {SEVERITY_LABEL[severity] ?? severity}
    </span>
  )
}

export function Pill({ children, title, struck }) {
  return (
    <span
      title={title}
      style={{
        display: 'inline-block',
        padding: '0.15rem 0.5rem',
        border: '1px solid var(--color-rule)',
        borderRadius: 999,
        fontFamily: 'var(--font-mono)',
        fontSize: '0.7rem',
        color: 'var(--color-ink-muted)',
        textDecoration: struck ? 'line-through' : undefined,
      }}
    >
      {children}
    </span>
  )
}

export function SmallButton({ children, onClick, disabled, primary, title }) {
  return (
    <button
      type="button"
      className={primary ? 'pp-btn pp-btn--primary' : 'pp-btn'}
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{ padding: '0.45rem 0.85rem', fontSize: '0.68rem', opacity: disabled ? 0.55 : 1, cursor: disabled ? 'default' : 'pointer' }}
    >
      {children}
    </button>
  )
}

export function Snapshot({ label, value, hint }) {
  return (
    <div>
      <p className="pp-section-label" style={{ fontSize: '0.6rem', margin: '0 0 0.35rem' }}>
        {label}
      </p>
      <p style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: '1.5rem', color: 'var(--color-ink)' }}>{value}</p>
      {hint ? <p style={{ margin: '0.2rem 0 0', fontSize: '0.7rem', color: 'var(--color-ink-dim)' }}>{hint}</p> : null}
    </div>
  )
}

export function FindingLine({ f }) {
  return (
    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', fontSize: '0.85rem' }}>
      <SeverityBadge severity={f.severity} />
      <div style={{ minWidth: 0 }}>
        <p style={{ margin: 0, color: 'var(--color-ink)' }}>{f.title}</p>
        <p style={{ margin: '0.2rem 0 0', color: 'var(--color-ink-muted)' }}>{f.detail}</p>
        <p style={{ margin: '0.3rem 0 0', fontSize: '0.75rem', color: 'var(--color-ink-muted)' }}>
          <strong style={{ color: 'var(--color-ink)' }}>Fix:</strong> {f.fix}
          {f.source_files?.length ? (
            <span style={{ fontFamily: 'var(--font-mono)' }}> ({f.source_files.join(', ')})</span>
          ) : null}
        </p>
      </div>
    </div>
  )
}

/** A select styled like DateRangeSelect. */
export function PlainSelect({ value, onChange, children, label }) {
  return (
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem' }}>
      {label ? (
        <span className="pp-section-label" style={{ fontSize: '0.6rem' }}>
          {label}
        </span>
      ) : null}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          background: 'var(--color-surface)',
          color: 'var(--color-ink)',
          border: '1px solid var(--color-rule)',
          borderRadius: 4,
          padding: '0.4rem 0.6rem',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.75rem',
          maxWidth: '100%',
        }}
      >
        {children}
      </select>
    </label>
  )
}
