// Collapsible panel section. Reuses the visual pattern of the SpringLoadCalculator
// FAQ item: a chevron-rotated header that toggles open/closed.

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { panelInputStyle, panelLabelStyle } from './panelStyles.js'

export default function PanelShell({ title, defaultOpen = true, children, action = null }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <section style={{ borderBottom: '1px solid var(--color-rule)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.7rem 0',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--color-ink)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.7rem',
            fontWeight: 600,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            textAlign: 'left',
          }}
        >
          <span>{title}</span>
          <ChevronDown
            size={14}
            style={{
              color: 'var(--color-ink-muted)',
              transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.15s',
            }}
          />
        </button>
        {action}
      </div>
      {open && <div style={{ padding: '0 0 0.85rem' }}>{children}</div>}
    </section>
  )
}

export function FieldRow({ label, children, note }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(80px, 110px) 1fr',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.25rem 0',
      }}
    >
      <div style={panelLabelStyle}>
        {label}
        {note && (
          <span
            style={{
              marginLeft: 6,
              fontSize: '0.55rem',
              color: 'var(--color-ink-dim)',
              letterSpacing: '0.08em',
            }}
          >
            {note}
          </span>
        )}
      </div>
      <div>{children}</div>
    </div>
  )
}

// Number input that converts display <-> SI via toDisplay/fromDisplay.
export function UnitInput({ valueSI, toDisplay, fromDisplay, step = 1, min, max, suffix, onChangeSI }) {
  const displayValue = toDisplay(valueSI)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
      <input
        type="number"
        value={Number.isFinite(displayValue) ? displayValue : ''}
        step={step}
        min={min}
        max={max}
        onChange={(e) => {
          const raw = parseFloat(e.target.value)
          if (Number.isFinite(raw)) onChangeSI(fromDisplay(raw))
        }}
        style={panelInputStyle}
      />
      {suffix && (
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--color-ink-dim)' }}>
          {suffix}
        </span>
      )}
    </div>
  )
}
