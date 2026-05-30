// Dense mono-font readout table. Consumes DerivedState directly.

import { mToCm, nToLb } from '../../../../lib/reformer/units.js'

/** @typedef {import('../../../../lib/reformer/types.js').DerivedState} DerivedState */
/** @typedef {import('../../../../lib/reformer/types.js').Spring} Spring */

const num = (n, digits = 1) => (Number.isFinite(n) ? n.toFixed(digits) : '—')

const tdMono = {
  fontFamily: 'var(--font-mono)',
  fontSize: '0.78rem',
  padding: '0.25rem 0.5rem',
  color: 'var(--color-ink)',
  textAlign: 'right',
}
const thMono = {
  ...tdMono,
  color: 'var(--color-ink-muted)',
  fontWeight: 500,
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
  textAlign: 'left',
}
const sectionLabel = {
  fontFamily: 'var(--font-mono)',
  fontSize: '0.65rem',
  letterSpacing: '0.15em',
  textTransform: 'uppercase',
  color: 'var(--color-ink-muted)',
  margin: '0.85rem 0 0.25rem',
}

/**
 * @param {{ derived: DerivedState, springs: Spring[] }} props
 */
export default function ReadoutTable({ derived, springs }) {
  const flagLines = []
  if (derived.flags.infeasible) flagLines.push({ label: 'infeasible', tone: 'bad' })
  if (derived.flags.atLimit) flagLines.push({ label: 'at limit', tone: 'warn' })
  if (derived.flags.slack) flagLines.push({ label: 'slack rope', tone: 'warn' })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
      {flagLines.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
          {flagLines.map((f) => (
            <FlagPill key={f.label} label={f.label} tone={f.tone} />
          ))}
        </div>
      )}

      <h3 style={sectionLabel}>Carriage</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <tbody>
          <Row label="position" value={`${num(mToCm(derived.carriageX), 1)} cm`} />
          <Row
            label="displacement"
            value={`${signed(num(mToCm(derived.carriageDisplacement), 1))} cm`}
          />
        </tbody>
      </table>

      <h3 style={sectionLabel}>Springs</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={thMono}>color</th>
            <th style={{ ...thMono, textAlign: 'right' }}>stretch</th>
            <th style={{ ...thMono, textAlign: 'right' }}>tension</th>
          </tr>
        </thead>
        <tbody>
          {derived.springResults.map((sr) => {
            const spring = springs.find((s) => s.id === sr.id)
            const attached = spring?.attached
            return (
              <tr
                key={sr.id}
                style={{
                  opacity: attached ? 1 : 0.4,
                  borderLeft: `3px solid ${spring?.displayColor ?? 'transparent'}`,
                }}
              >
                <td style={{ ...tdMono, textAlign: 'left' }}>
                  {spring?.color ?? sr.id}
                  {!attached && <span style={{ marginLeft: 6, color: 'var(--color-ink-dim)' }}>off</span>}
                </td>
                <td style={tdMono}>{num(mToCm(sr.stretch), 1)} cm</td>
                <td style={tdMono}>{num(nToLb(sr.tension), 1)} lb</td>
              </tr>
            )
          })}
          <tr style={{ borderTop: '1px solid var(--color-rule)' }}>
            <td style={{ ...tdMono, textAlign: 'left', color: 'var(--color-ink-muted)' }}>total</td>
            <td style={tdMono}></td>
            <td style={{ ...tdMono, color: 'var(--color-accent)' }}>
              {num(nToLb(derived.totalSpringForce), 1)} lb
            </td>
          </tr>
        </tbody>
      </table>

      <h3 style={sectionLabel}>Ropes</h3>
      {derived.ropeResults.length === 0 ? (
        <p style={{ ...tdMono, textAlign: 'left', color: 'var(--color-ink-dim)', padding: '0.5rem 0' }}>
          No active ropes (no end is pinned to a rope end).
        </p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={thMono}>rope</th>
              <th style={{ ...thMono, textAlign: 'right' }}>tension</th>
              <th style={{ ...thMono, textAlign: 'right' }}>∠ from horiz</th>
              <th style={{ ...thMono, textAlign: 'right' }}>fH / fV</th>
            </tr>
          </thead>
          <tbody>
            {derived.ropeResults.map((rr) => (
              <tr key={rr.id} style={{ opacity: rr.slack ? 0.45 : 1 }}>
                <td style={{ ...tdMono, textAlign: 'left' }}>{rr.id}{rr.slack && <span style={{ marginLeft: 6, color: 'var(--color-ink-dim)' }}>slack</span>}</td>
                <td style={tdMono}>{num(nToLb(rr.tension), 1)} lb</td>
                <td style={tdMono}>{num(rr.angleFromHorizontal, 1)}°</td>
                <td style={tdMono}>
                  {signed(num(nToLb(rr.fH), 1))} / {signed(num(nToLb(rr.fV), 1))} lb
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h3 style={sectionLabel}>Body</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <tbody>
          {Object.entries(derived.jointAnglesDeg).map(([j, deg]) => (
            <Row key={j} label={j} value={`${num(deg, 1)}°`} />
          ))}
          <Row
            label="body weight"
            value={`${num(nToLb(derived.bodyWeightN), 1)} lb`}
            note="phase 2"
          />
        </tbody>
      </table>
    </div>
  )
}

function Row({ label, value, note }) {
  return (
    <tr>
      <td style={{ ...tdMono, textAlign: 'left', color: 'var(--color-ink-muted)' }}>
        {label}
        {note && (
          <span style={{ marginLeft: 6, fontSize: '0.6rem', color: 'var(--color-ink-dim)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            {note}
          </span>
        )}
      </td>
      <td style={tdMono}>{value}</td>
    </tr>
  )
}

function FlagPill({ label, tone }) {
  const colors = {
    warn: { bg: 'rgba(240, 159, 38, 0.12)', fg: 'var(--color-accent)', border: 'var(--color-accent)' },
    bad:  { bg: 'rgba(199, 62, 62, 0.12)',  fg: '#E89A9A',            border: '#E89A9A' },
  }[tone] ?? { bg: 'var(--color-surface-raised)', fg: 'var(--color-ink)', border: 'var(--color-rule)' }
  return (
    <span
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '0.65rem',
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        padding: '0.18rem 0.5rem',
        border: `1px solid ${colors.border}`,
        color: colors.fg,
        background: colors.bg,
      }}
    >
      {label}
    </span>
  )
}

function signed(s) {
  if (typeof s !== 'string' || s === '—') return s
  if (s.startsWith('-')) return s
  if (s === '0' || s === '0.0' || s === '0.00') return s
  return `+${s}`
}
