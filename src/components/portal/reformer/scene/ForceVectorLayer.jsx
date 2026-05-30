// Force-vector arrows. The total spring force pulls the carriage toward the
// spring anchor; each taut rope's force pulls the hand toward its pulley.
// Arrow lengths are magnitude * FORCE_PX_PER_N clamped to FORCE_MAX_PX. The
// label uses JetBrains Mono so numbers stay readable against the scene.

import {
  worldToSvg,
  FORCE_PX_PER_N,
  FORCE_MAX_PX,
  FORCE_MIN_VISIBLE_N,
} from './coords.js'
import { nToLb } from '../../../../lib/reformer/units.js'

/** @typedef {import('../../../../lib/reformer/types.js').Reformer}   Reformer */
/** @typedef {import('../../../../lib/reformer/types.js').Rope}       Rope */
/** @typedef {import('../../../../lib/reformer/types.js').RopeResult} RopeResult */
/** @typedef {import('../../../../lib/reformer/types.js').Vec2}       Vec2 */

/**
 * @param {{
 *  reformer: Reformer,
 *  ropes: Rope[],
 *  ropeResults: RopeResult[],
 *  totalSpringForce: number,
 *  jointPositions: Object<string, Vec2>,
 *  carriageX: number,
 * }} props
 */
export default function ForceVectorLayer({
  reformer,
  ropes,
  ropeResults,
  totalSpringForce,
  jointPositions,
  carriageX,
}) {
  return (
    <g aria-label="Force vectors">
      <defs>
        <marker
          id="rfm-arrowhead"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M0,0 L10,5 L0,10 z" fill="var(--color-accent)" />
        </marker>
      </defs>

      <SpringForceArrow
        reformer={reformer}
        carriageX={carriageX}
        total={totalSpringForce}
      />

      {ropeResults.map((rr) => {
        const rope = ropes.find((r) => r.id === rr.id)
        if (!rope) return null
        const hand = jointPositions[rope.handId]
        if (!hand) return null
        return <RopeForceArrow key={rr.id} rr={rr} hand={hand} />
      })}
    </g>
  )
}

function SpringForceArrow({ reformer, carriageX, total }) {
  if (total < FORCE_MIN_VISIBLE_N) return null
  const startWorld = { x: carriageX, y: reformer.carriageSpringY }
  const start = worldToSvg(startWorld)
  const anchorSvg = worldToSvg(reformer.springAnchor)
  const dx = anchorSvg.x - start.x
  const dy = anchorSvg.y - start.y
  const len0 = Math.hypot(dx, dy)
  if (len0 < 1e-6) return null
  const ux = dx / len0
  const uy = dy / len0
  const lenPx = Math.min(FORCE_MAX_PX, total * FORCE_PX_PER_N)
  const end = { x: start.x + ux * lenPx, y: start.y + uy * lenPx }
  return (
    <g>
      <line
        x1={start.x}
        y1={start.y}
        x2={end.x}
        y2={end.y}
        stroke="var(--color-accent)"
        strokeWidth={2}
        markerEnd="url(#rfm-arrowhead)"
      />
      <text
        x={(start.x + end.x) / 2}
        y={(start.y + end.y) / 2 - 7}
        fill="var(--color-accent)"
        fontSize="11"
        fontFamily="var(--font-mono)"
        textAnchor="middle"
      >
        {nToLb(total).toFixed(1)} lb
      </text>
    </g>
  )
}

function RopeForceArrow({ rr, hand }) {
  if (rr.slack) return null
  const mag = Math.hypot(rr.forceVectorAtHand.x, rr.forceVectorAtHand.y)
  if (mag < FORCE_MIN_VISIBLE_N) return null
  const start = worldToSvg(hand)
  // World direction. Note: SVG y is down, so we flip world dy when going to SVG.
  const ux = rr.forceVectorAtHand.x / mag
  const uy = -rr.forceVectorAtHand.y / mag
  const lenPx = Math.min(FORCE_MAX_PX, mag * FORCE_PX_PER_N)
  const end = { x: start.x + ux * lenPx, y: start.y + uy * lenPx }
  const corner = { x: end.x, y: start.y }
  return (
    <g>
      {/* Horizontal then vertical component guides */}
      <line
        x1={start.x} y1={start.y}
        x2={corner.x} y2={corner.y}
        stroke="var(--color-ink-dim)"
        strokeWidth={1}
        strokeDasharray="3 3"
      />
      <line
        x1={corner.x} y1={corner.y}
        x2={end.x} y2={end.y}
        stroke="var(--color-ink-dim)"
        strokeWidth={1}
        strokeDasharray="3 3"
      />
      {/* Resultant */}
      <line
        x1={start.x} y1={start.y}
        x2={end.x} y2={end.y}
        stroke="var(--color-accent)"
        strokeWidth={2}
        markerEnd="url(#rfm-arrowhead)"
      />
      {/* Label near the arrow tip */}
      <text
        x={end.x + 6}
        y={end.y - 4}
        fill="var(--color-accent)"
        fontSize="11"
        fontFamily="var(--font-mono)"
      >
        {nToLb(mag).toFixed(1)} lb · {rr.angleFromHorizontal.toFixed(0)}°
      </text>
    </g>
  )
}
