// Two teaching diagrams for the "How to read these graphs" section.
// Both use the same axes and the same Balanced Body red line (b = 8 lb,
// k = 1.0 lb/in, 32 in reformer) as the real lineup graphs, so what people
// learn here transfers directly. Figure 1 names the four parts of Hooke's
// law on the graph; Figure 2 animates the up-then-left read-off.
//
// Geometry stays in the canonical imperial values (b = 8 lb, k = 1 lb/in,
// 32 in stroke); the `unit` prop only re-labels ticks and callouts, matching
// how SpringBrandGraph handles the kg/cm toggle.

import { UNITS, forceValue, lengthValue } from './graphUtils'

const W = 640
const H = 400
const A = { x: 70, y: 40, w: 538, h: 300 } // plot area
const MAXX = 32 // inches
const MAXF = 48 // lb (headroom above the 40 lb top of the line)

const RED = '#C73E3E' // Balanced Body red, from springSpecs
const GRID = '#2E2B26'
const AXIS = '#F1EFE8'
const TICK = '#888780'
const INK = '#F1EFE8'
const MONO = 'JetBrains Mono, ui-monospace, monospace'

// One colour per variable in Force = (k × x) + b, reused in the equation
// caption so each term ties back to the thing it points at on the graph.
const C_F = '#7FC7BD' // Force  (teal)
const C_K = '#E0A73A' // k      (gold)
const C_X = '#6AA0DF' // x      (blue)
const C_B = '#C88BD6' // b      (mauve)

const gx = (x) => A.x + (x / MAXX) * A.w
const gy = (f) => A.y + A.h - (f / MAXF) * A.h

const X_TICKS = [0, 8, 16, 24, 32]
const Y_TICKS = [0, 10, 20, 30, 40]

// Line: f(x) = 1.0·x + 8  →  (0, 8) to (32, 40)
const LINE_START = { x: gx(0), y: gy(8) }
const LINE_END = { x: gx(MAXX), y: gy(40) }

function BaseChart({ forceTitleColor = TICK, xTitleColor = TICK, faintLine = false, unit = 'imperial', children }) {
  return (
    <>
      {/* Grid */}
      {Y_TICKS.map((f) => (
        <line key={`yg-${f}`} x1={A.x} y1={gy(f)} x2={A.x + A.w} y2={gy(f)} stroke={GRID} strokeWidth="1" />
      ))}
      {X_TICKS.map((x) => (
        <line key={`xg-${x}`} x1={gx(x)} y1={A.y} x2={gx(x)} y2={A.y + A.h} stroke={GRID} strokeWidth="1" />
      ))}

      {/* Axes */}
      <line x1={A.x} y1={A.y + A.h} x2={A.x + A.w} y2={A.y + A.h} stroke={AXIS} strokeWidth="1.5" />
      <line x1={A.x} y1={A.y} x2={A.x} y2={A.y + A.h} stroke={AXIS} strokeWidth="1.5" />

      {/* Y ticks + labels */}
      {Y_TICKS.map((f) => (
        <text key={`yt-${f}`} x={A.x - 10} y={gy(f) + 5} textAnchor="end" fill={TICK} fontSize="15" fontFamily={MONO}>
          {f}
        </text>
      ))}
      {/* X ticks + labels */}
      {X_TICKS.map((x) => (
        <g key={`xt-${x}`}>
          <line x1={gx(x)} y1={A.y + A.h} x2={gx(x)} y2={A.y + A.h + 5} stroke={AXIS} strokeWidth="1" />
          <text x={gx(x)} y={A.y + A.h + 22} textAnchor="middle" fill={TICK} fontSize="15" fontFamily={MONO}>
            {unit === 'metric' ? Math.round(lengthValue(x, unit)) : `${x}"`}
          </text>
        </g>
      ))}

      {/* Axis titles */}
      <text
        x={20}
        y={A.y + A.h / 2}
        textAnchor="middle"
        fill={forceTitleColor}
        fontSize="16"
        fontFamily={MONO}
        transform={`rotate(-90, 20, ${A.y + A.h / 2})`}
      >
        Force, the weight you feel ({UNITS[unit].force})
      </text>
      <text x={A.x + A.w / 2} y={H - 8} textAnchor="middle" fill={xTitleColor} fontSize="16" fontFamily={MONO}>
        Stretch, how far it is pulled ({UNITS[unit].length})
      </text>

      {/* The spring line */}
      <line
        x1={LINE_START.x}
        y1={LINE_START.y}
        x2={LINE_END.x}
        y2={LINE_END.y}
        stroke={RED}
        strokeWidth={faintLine ? 2.5 : 3}
        strokeLinecap="round"
        opacity={faintLine ? 0.55 : 1}
      />

      {children}
    </>
  )
}

// ── Figure 1: the four parts of the equation, pointed out on the line ──────
function EquationDiagram({ unit }) {
  // Rise/run callout for k: run = 8 units of stretch, rise = +8 lb of force.
  const runLabel = unit === 'metric' ? `${Math.round(lengthValue(8, unit))} cm` : '8"'
  const riseLabel = `+${Math.round(forceValue(8, unit))} ${UNITS[unit].force}`
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="A Balanced Body red spring line with the four parts of the equation labelled: Force on the vertical axis, stretch on the horizontal axis, b where the line starts, and k as its steepness."
      style={{ width: '100%', maxWidth: `${W}px`, display: 'block', margin: '0 auto' }}
    >
      <BaseChart forceTitleColor={C_F} xTitleColor={C_X} unit={unit}>
        {/* b — starting tension, at the y-intercept */}
        <circle cx={LINE_START.x} cy={LINE_START.y} r="5" fill={C_B} stroke="#1C1A17" strokeWidth="1.5" />
        <line x1={LINE_START.x} y1={LINE_START.y} x2={148} y2={214} stroke={C_B} strokeWidth="1.2" strokeDasharray="3 3" />
        <text x={150} y={206} fill={C_B} fontSize="14" fontWeight="700" fontFamily={MONO}>
          b
        </text>
        <text x={166} y={206} fill={INK} fontSize="12.5">
          starting tension
        </text>
        <text x={150} y={223} fill={TICK} fontSize="11.5">
          the pull before you move
        </text>

        {/* k — steepness, shown as a rise-over-run step under the line */}
        <line x1={gx(16)} y1={gy(24)} x2={gx(24)} y2={gy(24)} stroke={C_K} strokeWidth="1.5" strokeDasharray="3 3" />
        <line x1={gx(24)} y1={gy(24)} x2={gx(24)} y2={gy(32)} stroke={C_K} strokeWidth="1.5" strokeDasharray="3 3" />
        <text x={(gx(16) + gx(24)) / 2} y={gy(24) + 16} textAnchor="middle" fill={C_K} fontSize="13" fontFamily={MONO}>
          {runLabel}
        </text>
        <text x={gx(24) + 8} y={(gy(24) + gy(32)) / 2 + 4} fill={C_K} fontSize="13" fontFamily={MONO}>
          {riseLabel}
        </text>
        <text x={gx(24) + 30} y={gy(30)} fill={C_K} fontSize="14" fontWeight="700" fontFamily={MONO}>
          k
        </text>
        <text x={gx(24) + 44} y={gy(30)} fill={INK} fontSize="12.5">
          how steeply
        </text>
        <text x={gx(24) + 30} y={gy(30) + 17} fill={TICK} fontSize="11.5">
          it climbs
        </text>

        {/* Force / Stretch are the axes themselves; small arrows point at them */}
        <text x={A.x + 8} y={A.y + 4} fill={C_F} fontSize="16" fontFamily={MONO}>
          ↑ Force
        </text>
        <text x={A.x + A.w - 8} y={A.y + A.h - 12} textAnchor="end" fill={C_X} fontSize="16" fontFamily={MONO}>
          Stretch →
        </text>
      </BaseChart>
    </svg>
  )
}

// ── Figure 2: the up-then-left read-off, animated on a loop ────────────────
function ReadOffDiagram({ unit }) {
  const px = gx(12)
  const py = gy(20)
  const bottom = A.y + A.h
  const DUR = '5s'
  const metric = unit === 'metric'
  // Read-off is at 12 units of stretch → ≈ 20 lb of force on the BB red line.
  const startLabel = metric ? `${Math.round(lengthValue(12, unit))} cm` : '12"'
  const startAria = metric ? `${Math.round(lengthValue(12, unit))} centimeters` : '12 inches'
  const answerLabel = `≈ ${Math.round(forceValue(20, unit))} ${UNITS[unit].force}`
  const answerAria = metric ? `${Math.round(forceValue(20, unit))} kilograms` : '20 pounds'

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={`Animated read-off: a dotted line rises from ${startAria} on the bottom axis up to the spring line, then runs left to the side axis, landing at about ${answerAria}.`}
      style={{ width: '100%', maxWidth: `${W}px`, display: 'block', margin: '0 auto' }}
    >
      <BaseChart faintLine unit={unit}>
        {/* Start marker on the x-axis at 12" (always visible) */}
        <circle cx={px} cy={bottom} r="4.5" fill={C_X} stroke="#1C1A17" strokeWidth="1.5" />
        <text x={px} y={bottom + 40} textAnchor="middle" fill={C_X} fontSize="15" fontFamily={MONO}>
          Start: {startLabel}
        </text>

        {/* 1) dotted line grows UP from the axis to the spring line */}
        <line x1={px} y1={bottom} x2={px} y2={bottom} stroke={AXIS} strokeWidth="2" strokeDasharray="2 5" strokeLinecap="round">
          <animate
            attributeName="y2"
            dur={DUR}
            repeatCount="indefinite"
            keyTimes="0;0.10;0.30;0.86;0.92;1"
            values={`${bottom};${bottom};${py};${py};${bottom};${bottom}`}
          />
          <animate
            attributeName="opacity"
            dur={DUR}
            repeatCount="indefinite"
            keyTimes="0;0.09;0.10;0.86;0.92;1"
            values="0;0;1;1;0;0"
          />
        </line>
        {/* up arrowhead at the line */}
        <polygon points={`${px - 5},${py + 9} ${px + 5},${py + 9} ${px},${py}`} fill={AXIS}>
          <animate attributeName="opacity" dur={DUR} repeatCount="indefinite" keyTimes="0;0.28;0.30;0.86;0.92;1" values="0;0;1;1;0;0" />
        </polygon>

        {/* 2) dotted line grows LEFT from the spring line to the y-axis */}
        <line x1={px} y1={py} x2={px} y2={py} stroke={AXIS} strokeWidth="2" strokeDasharray="2 5" strokeLinecap="round">
          <animate
            attributeName="x2"
            dur={DUR}
            repeatCount="indefinite"
            keyTimes="0;0.34;0.54;0.86;0.92;1"
            values={`${px};${px};${A.x};${A.x};${px};${px}`}
          />
          <animate
            attributeName="opacity"
            dur={DUR}
            repeatCount="indefinite"
            keyTimes="0;0.33;0.34;0.86;0.92;1"
            values="0;0;1;1;0;0"
          />
        </line>
        {/* left arrowhead + the answer at the y-axis */}
        <g>
          <animate attributeName="opacity" dur={DUR} repeatCount="indefinite" keyTimes="0;0.52;0.54;0.86;0.92;1" values="0;0;1;1;0;0" />
          <polygon points={`${A.x + 9},${py - 5} ${A.x + 9},${py + 5} ${A.x},${py}`} fill={AXIS} />
          <circle cx={A.x} cy={py} r="4.5" fill={RED} stroke="#1C1A17" strokeWidth="1.5" />
          <text x={A.x + 12} y={py - 12} textAnchor="start" fill={INK} fontSize="18" fontWeight="700" fontFamily={MONO}>
            {answerLabel}
          </text>
        </g>

        {/* dot where the read-off meets the line */}
        <circle cx={px} cy={py} r="4" fill={AXIS}>
          <animate attributeName="opacity" dur={DUR} repeatCount="indefinite" keyTimes="0;0.28;0.30;0.86;0.92;1" values="0;0;1;1;0;0" />
        </circle>
      </BaseChart>
    </svg>
  )
}

// Exported as two separate figures so the page can place explanatory prose
// between the "parts of the graph" diagram and the animated read-off.
export function GraphPartsFigure({ unit = 'imperial' }) {
  return (
    <figure style={{ margin: '1.75rem 0' }}>
      <EquationDiagram unit={unit} />
    </figure>
  )
}

export function ReadOffFigure({ unit = 'imperial' }) {
  return (
    <figure style={{ margin: '1.75rem 0' }}>
      <ReadOffDiagram unit={unit} />
    </figure>
  )
}
