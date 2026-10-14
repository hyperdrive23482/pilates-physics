import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { NO_VALUE, formatCount, stepRate } from '../analytics/shared'

/**
 * One row of the funnel: a label, one number, how it relates to the rest, and
 * an expandable body.
 *
 * NO BARS, deliberately. Bars scaled to the step above invert the funnel on
 * sight when the denominators differ, and bars scaled to step 1 make every
 * later step an invisible sliver. The percentages carry the same information
 * in a form that cannot be read backwards.
 *
 * `comparison` is one of:
 *   { kind: 'top' }                                   the first step
 *   { kind: 'step', previous, previousIndex }         a share of the step above
 *   { kind: 'standalone', text }                      its own denominator, in words
 *
 * Standalone exists because not every step draws from the one above it. A
 * workshop buyer this month was usually a lead months ago, so dividing buyers
 * by this month's leads is arithmetic on two unrelated populations.
 */
export default function FunnelStep({ index, label, value, comparison, caption, children }) {
  const [open, setOpen] = useState(false)

  const rate = comparison?.kind === 'step' && value !== null && value !== undefined
    ? stepRate(value, comparison.previous)
    : null

  const note =
    comparison?.kind === 'standalone'
      ? comparison.text
      : rate !== null
      ? `${Math.round(rate * 100)}% of step ${comparison.previousIndex}`
      : null

  const Chevron = open ? ChevronDown : ChevronRight

  return (
    <div className="pp-card" style={{ padding: 0, overflow: 'hidden' }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          padding: '1rem 1.25rem',
          background: 'transparent',
          border: 'none',
          color: 'inherit',
          textAlign: 'left',
          cursor: 'pointer',
          font: 'inherit',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.7rem',
            color: 'var(--color-ink-muted)',
            width: '1rem',
            flexShrink: 0,
          }}
        >
          {index}
        </span>

        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1rem', color: 'var(--color-ink)' }}>
              {label}
            </span>
            {note ? (
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.7rem',
                  color: 'var(--color-ink-muted)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {note}
              </span>
            ) : null}
          </span>
          <span
            style={{ display: 'block', marginTop: '0.15rem', fontSize: '0.75rem', color: 'var(--color-ink-muted)' }}
          >
            {caption}
          </span>
        </span>

        <span
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '1.75rem',
            color: 'var(--color-ink)',
            fontVariantNumeric: 'tabular-nums',
            flexShrink: 0,
          }}
        >
          {value === null || value === undefined ? NO_VALUE : formatCount(value)}
        </span>
        <Chevron size={16} style={{ color: 'var(--color-ink-muted)', flexShrink: 0 }} />
      </button>

      {open ? (
        <div
          style={{
            borderTop: '1px solid var(--color-rule)',
            padding: '1rem 1.25rem 1.25rem 3.25rem',
            background: 'rgba(227, 227, 227, 0.02)',
          }}
        >
          {children}
        </div>
      ) : null}
    </div>
  )
}

/** A small labelled number inside an expanded step. */
export function Snapshot({ label, value, hint }) {
  return (
    <div>
      <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--color-ink-muted)' }}>{label}</p>
      <p
        style={{
          margin: '0.15rem 0 0',
          fontFamily: 'var(--font-serif)',
          fontSize: '1.25rem',
          color: 'var(--color-ink)',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </p>
      {hint ? <p style={{ margin: '0.15rem 0 0', fontSize: '0.7rem', color: 'var(--color-ink-muted)' }}>{hint}</p> : null}
    </div>
  )
}

/** Shown in place of an expansion when the data behind it did not arrive. */
export function DetailUnavailable({ reason }) {
  return <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--color-ink-muted)' }}>{reason}</p>
}

/**
 * How many of a cohort could not be tied to an account. Rendered only when
 * non-zero, because every rate in an expansion is out of `measured`, not out
 * of the step's headline number.
 */
export function UnmatchedNote({ unmatched, noun = 'people' }) {
  if (!unmatched || unmatched <= 0) return null
  return (
    <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--color-ink-muted)' }}>
      {unmatched} {noun} could not be matched to an account and are left out of the numbers above.
    </p>
  )
}
