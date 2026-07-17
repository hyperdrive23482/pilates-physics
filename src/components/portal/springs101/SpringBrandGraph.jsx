import { UNITS, forceValue, lengthValue, ticksForMax } from './graphUtils'

// One plotted force-vs-extension graph per brand, drawn with the same visual
// language as the Spring Load Calculator (grid, axes, mono tick labels).
// The y-scale (maxForce, in lbs) is shared across every brand in the same
// apparatus so the lineups compare honestly card to card.

const VB_W = 820
const VB_H = 320
const GRAPH = { left: 64, right: 24, top: 20, bottom: 56 }
const AREA = {
  x: GRAPH.left,
  y: GRAPH.top,
  w: VB_W - GRAPH.left - GRAPH.right,
  h: VB_H - GRAPH.top - GRAPH.bottom,
}

const MONO = 'JetBrains Mono, ui-monospace, monospace'

function toGraph(x, force, maxForce, maxTravel) {
  return {
    x: AREA.x + (x / maxTravel) * AREA.w,
    y: AREA.y + AREA.h - (force / maxForce) * AREA.h,
  }
}

function linePath(k, b, maxForce, maxTravel) {
  const start = toGraph(0, b, maxForce, maxTravel)
  const end = toGraph(maxTravel, k * maxTravel + b, maxForce, maxTravel)
  return `M${start.x.toFixed(1)},${start.y.toFixed(1)} L${end.x.toFixed(1)},${end.y.toFixed(1)}`
}

// Springs darker than this need a faint light halo to stay visible on the
// dark background (e.g. the near-black trapeze springs).
function isDark(hex) {
  const n = parseInt(hex.slice(1), 16)
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const bl = n & 255
  return 0.2126 * r + 0.7152 * g + 0.0722 * bl < 60
}

// Some brands paint two springs the same color (Yellow - Long / Yellow - Short).
// The second occurrence of a color gets a dash so the lines stay tellable apart.
function dashFor(spring, index, springs) {
  const firstIdx = springs.findIndex((s) => s.displayColor === spring.displayColor)
  return firstIdx !== index ? '7 5' : undefined
}

export default function SpringBrandGraph({ brand, maxTravel, xTicks, maxForce, unit }) {
  const yTicks = ticksForMax(maxForce)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label={`${brand.name} spring force versus extension graph`}
        style={{ width: '100%', display: 'block' }}
      >
        {/* Grid */}
        {yTicks.map((lb) => {
          const gy = AREA.y + AREA.h - (lb / maxForce) * AREA.h
          return (
            <line key={`yg-${lb}`} x1={AREA.x} y1={gy} x2={AREA.x + AREA.w} y2={gy} stroke="#2E2B26" strokeWidth="1" />
          )
        })}
        {xTicks.map((inch) => {
          const gx = AREA.x + (inch / maxTravel) * AREA.w
          return (
            <line key={`xg-${inch}`} x1={gx} y1={AREA.y} x2={gx} y2={AREA.y + AREA.h} stroke="#2E2B26" strokeWidth="1" />
          )
        })}

        {/* Axes */}
        <line x1={AREA.x} y1={AREA.y + AREA.h} x2={AREA.x + AREA.w} y2={AREA.y + AREA.h} stroke="#F1EFE8" strokeWidth="1.5" />
        <line x1={AREA.x} y1={AREA.y} x2={AREA.x} y2={AREA.y + AREA.h} stroke="#F1EFE8" strokeWidth="1.5" />

        {/* Y axis label */}
        <text
          x={18}
          y={AREA.y + AREA.h / 2}
          textAnchor="middle"
          fill="#888780"
          fontSize="11"
          fontFamily={MONO}
          transform={`rotate(-90, 18, ${AREA.y + AREA.h / 2})`}
        >
          Force ({UNITS[unit].force})
        </text>

        {/* Y ticks */}
        {yTicks.map((lb) => {
          const gy = AREA.y + AREA.h - (lb / maxForce) * AREA.h
          return (
            <text key={`yt-${lb}`} x={AREA.x - 8} y={gy + 4} textAnchor="end" fill="#888780" fontSize="10" fontFamily={MONO}>
              {Math.round(forceValue(lb, unit))}
            </text>
          )
        })}

        {/* X axis label */}
        <text
          x={AREA.x + AREA.w / 2}
          y={AREA.y + AREA.h + 42}
          textAnchor="middle"
          fill="#888780"
          fontSize="11"
          fontFamily={MONO}
        >
          Spring extension ({UNITS[unit].length})
        </text>

        {/* X ticks */}
        {xTicks.map((inch) => {
          const gx = AREA.x + (inch / maxTravel) * AREA.w
          return (
            <g key={`xt-${inch}`}>
              <line x1={gx} y1={AREA.y + AREA.h} x2={gx} y2={AREA.y + AREA.h + 5} stroke="#F1EFE8" strokeWidth="1" />
              <text x={gx} y={AREA.y + AREA.h + 18} textAnchor="middle" fill="#888780" fontSize="10" fontFamily={MONO}>
                {unit === 'metric' ? Math.round(lengthValue(inch, unit)) : `${inch}"`}
              </text>
            </g>
          )
        })}

        {/* Force lines */}
        {brand.springs.map((spring, i) => {
          const d = linePath(spring.k, spring.b, maxForce, maxTravel)
          const dash = dashFor(spring, i, brand.springs)
          return (
            <g key={spring.color}>
              {isDark(spring.displayColor) && (
                <path d={d} stroke="#E8E4D8" strokeWidth="4.5" fill="none" strokeLinecap="round" opacity="0.35" strokeDasharray={dash} />
              )}
              <path
                d={d}
                stroke={spring.displayColor}
                strokeWidth="2.5"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={dash}
              />
            </g>
          )
        })}
      </svg>

      {/* Legend with per-spring stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
          gap: '0.6rem 1.5rem',
        }}
      >
        {brand.springs.map((spring, i) => {
          const dash = dashFor(spring, i, brand.springs)
          return (
            <div key={spring.color} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.55rem' }}>
              <svg width="22" height="10" viewBox="0 0 22 10" style={{ flexShrink: 0, marginTop: '4px' }}>
                {isDark(spring.displayColor) && (
                  <line x1="1" y1="5" x2="21" y2="5" stroke="#E8E4D8" strokeWidth="6" opacity="0.35" strokeDasharray={dash} />
                )}
                <line x1="1" y1="5" x2="21" y2="5" stroke={spring.displayColor} strokeWidth="3" strokeLinecap="round" strokeDasharray={dash} />
              </svg>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-ink)', lineHeight: 1.3 }}>
                  {spring.label}
                  {spring.tensionLabel ? (
                    <span style={{ fontWeight: 400, color: 'var(--color-ink-muted)' }}> · {spring.tensionLabel}</span>
                  ) : null}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
