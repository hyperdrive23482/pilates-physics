// Coil glyphs for every attached spring. Slack springs render dimmed.

import { worldToSvg } from './coords.js'

const COIL_COUNT = 12       // PLACEHOLDER  visual coil density
const COIL_AMP_SVG = 4.5    // PLACEHOLDER  zig-zag amplitude in SVG units

/** @typedef {import('../../../../lib/reformer/types.js').Reformer} Reformer */
/** @typedef {import('../../../../lib/reformer/types.js').Spring}   Spring */
/** @typedef {import('../../../../lib/reformer/types.js').SpringResult} SpringResult */

/**
 * @param {{
 *  reformer: Reformer,
 *  springs: Spring[],
 *  springResults: SpringResult[],
 *  carriageX: number,
 * }} props
 */
export default function SpringLayer({ reformer, springs, springResults, carriageX }) {
  const carriageSpringWorld = { x: carriageX, y: reformer.carriageSpringY }
  const anchorWorld = reformer.springAnchor

  const attached = springs.filter((s) => s.attached)
  if (!attached.length) return null
  const offsetStep = 8 // SVG units

  return (
    <g aria-label="Springs">
      {attached.map((sp, i) => {
        const offY = (i - (attached.length - 1) / 2) * offsetStep
        const A = worldToSvg(anchorWorld)
        const B = worldToSvg(carriageSpringWorld)
        const p1 = { x: A.x, y: A.y + offY }
        const p2 = { x: B.x, y: B.y + offY }
        const sr = springResults.find((r) => r.id === sp.id)
        const slack = !sr || sr.stretch <= 0
        const d = springCoilPath(p1, p2)
        return (
          <g key={sp.id}>
            <path
              d={d}
              fill="none"
              stroke={sp.displayColor}
              strokeWidth={2}
              strokeOpacity={slack ? 0.3 : 1}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {/* End caps */}
            <circle cx={p1.x} cy={p1.y} r={3} fill={sp.displayColor} opacity={slack ? 0.3 : 1} />
            <circle cx={p2.x} cy={p2.y} r={3} fill={sp.displayColor} opacity={slack ? 0.3 : 1} />
          </g>
        )
      })}
    </g>
  )
}

function springCoilPath(p1, p2) {
  const dx = p2.x - p1.x
  const dy = p2.y - p1.y
  const len = Math.hypot(dx, dy)
  if (len < 1) return `M${p1.x},${p1.y} L${p2.x},${p2.y}`
  const nx = -dy / len
  const ny = dx / len
  const segments = COIL_COUNT * 2
  let d = `M${p1.x.toFixed(1)},${p1.y.toFixed(1)}`
  for (let c = 1; c <= segments - 1; c++) {
    const t = c / segments
    const cx = p1.x + dx * t
    const cy = p1.y + dy * t
    const sgn = c % 2 === 0 ? -1 : 1
    d += ` L${(cx + nx * COIL_AMP_SVG * sgn).toFixed(1)},${(cy + ny * COIL_AMP_SVG * sgn).toFixed(1)}`
  }
  d += ` L${p2.x.toFixed(1)},${p2.y.toFixed(1)}`
  return d
}
