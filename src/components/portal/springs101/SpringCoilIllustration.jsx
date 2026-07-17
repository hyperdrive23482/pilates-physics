// Stylized coil illustration of a single physical spring, driven by a
// springSpecs.json entry so it always matches the calculator's data.
// Wire thickness encodes the spring rate relative to the heaviest spring
// in the same apparatus (heavier rate = thicker wire).

const VIEW_W = 240
const VIEW_H = 56
const MID_Y = VIEW_H / 2
const HOOK_W = 22
const TURNS = 12
const AMP = 16

// One coil turn is two mirrored cubic curves forming an ellipse-ish loop
// that advances by `pitch`, which reads as a helix at small sizes.
function coilPath(x0, x1) {
  const pitch = (x1 - x0) / TURNS
  const lean = pitch * 0.85
  let d = `M ${x0} ${MID_Y}`
  for (let i = 0; i < TURNS; i += 1) {
    const sx = x0 + i * pitch
    const ex = sx + pitch
    d += ` C ${sx + lean} ${MID_Y - AMP}, ${ex - lean} ${MID_Y - AMP}, ${ex - pitch / 2} ${MID_Y}`
    d += ` C ${ex - lean} ${MID_Y + AMP}, ${sx + lean} ${MID_Y + AMP}, ${ex} ${MID_Y}`
  }
  return d
}

function hookPath(atStart) {
  const r = 7
  if (atStart) {
    return `M ${HOOK_W} ${MID_Y} H ${r + 3} A ${r} ${r} 0 1 0 ${r + 3} ${MID_Y - 0.01}`
  }
  const x = VIEW_W - HOOK_W
  return `M ${x} ${MID_Y} H ${VIEW_W - r - 3} A ${r} ${r} 0 1 1 ${VIEW_W - r - 3} ${MID_Y - 0.01}`
}

export default function SpringCoilIllustration({ spring, maxK }) {
  const weight = Math.max(0, Math.min(1, maxK > 0 ? spring.k / maxK : 0))
  const strokeWidth = 2 + weight * 3
  const body = coilPath(HOOK_W, VIEW_W - HOOK_W)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label={`${spring.label} spring`}
        style={{ width: '100%', maxWidth: '240px', height: 'auto', display: 'block' }}
      >
        <path d={hookPath(true)} fill="none" stroke="var(--color-ink-muted)" strokeWidth="2" />
        <path d={hookPath(false)} fill="none" stroke="var(--color-ink-muted)" strokeWidth="2" />
        {/* Faint underlay keeps pale colors (white springs) defined on the dark bg */}
        <path d={body} fill="none" stroke="var(--color-rule)" strokeWidth={strokeWidth + 2} strokeLinecap="round" />
        <path d={body} fill="none" stroke={spring.displayColor} strokeWidth={strokeWidth} strokeLinecap="round" />
      </svg>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-ink)' }}>
          {spring.label}
        </span>
        {spring.tensionLabel ? (
          <span
            style={{
              fontSize: '0.65rem',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--color-ink-muted)',
              border: '1px solid var(--color-rule)',
              padding: '1px 6px',
            }}
          >
            {spring.tensionLabel}
          </span>
        ) : null}
      </div>
      <span
        style={{
          fontFamily: '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
          fontSize: '0.7rem',
          color: 'var(--color-ink-muted)',
        }}
      >
        starts at {spring.b} lb · +{spring.k.toFixed(2)} lb per inch
      </span>
    </div>
  )
}
