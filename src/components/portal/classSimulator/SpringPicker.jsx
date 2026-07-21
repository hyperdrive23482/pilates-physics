import { Minus, Plus } from 'lucide-react'
import { BB_SPRINGS } from './exercises'

const MAX_PER_COLOR = 4

// Compact per-color quantity steppers for Balanced Body reformer springs.
export default function SpringPicker({ counts, onChange }) {
  const stepperButton = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '24px',
    height: '24px',
    border: '1px solid var(--color-rule)',
    borderRadius: '2px',
    background: 'var(--color-bg)',
    color: 'var(--color-ink)',
    cursor: 'pointer',
    padding: 0,
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
      {BB_SPRINGS.map((spring) => {
        const n = counts?.[spring.color] || 0
        return (
          <div
            key={spring.color}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.35rem 0.5rem',
              background: 'var(--color-bg)',
              border: '1px solid var(--color-rule)',
              borderLeft: `3px solid ${spring.displayColor}`,
              borderRadius: '2px',
            }}
          >
            <span
              style={{
                flex: 1,
                fontSize: '0.8rem',
                fontFamily: 'var(--font-serif)',
                color: n > 0 ? 'var(--color-ink)' : 'var(--color-ink-muted)',
              }}
            >
              {spring.label}
              <span style={{ color: 'var(--color-ink-muted)', fontSize: '0.7rem' }}>
                {' '}
                · {spring.tensionLabel}
              </span>
            </span>
            <button
              type="button"
              aria-label={`Remove one ${spring.label} spring`}
              disabled={n === 0}
              onClick={() => onChange({ ...counts, [spring.color]: Math.max(0, n - 1) })}
              style={{ ...stepperButton, opacity: n === 0 ? 0.35 : 1 }}
            >
              <Minus size={13} strokeWidth={1.75} />
            </button>
            <span
              style={{
                width: '18px',
                textAlign: 'center',
                fontSize: '0.85rem',
                fontFamily: 'var(--font-serif)',
                fontWeight: 600,
                color: 'var(--color-ink)',
              }}
            >
              {n}
            </span>
            <button
              type="button"
              aria-label={`Add one ${spring.label} spring`}
              disabled={n >= MAX_PER_COLOR}
              onClick={() =>
                onChange({ ...counts, [spring.color]: Math.min(MAX_PER_COLOR, n + 1) })
              }
              style={{ ...stepperButton, opacity: n >= MAX_PER_COLOR ? 0.35 : 1 }}
            >
              <Plus size={13} strokeWidth={1.75} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
