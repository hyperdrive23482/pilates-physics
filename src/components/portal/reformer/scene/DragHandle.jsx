// Dumb draggable SVG circle. Converts pointer events to world coordinates
// using the parent <svg>'s bounding-rect (via SceneContext.svgRef) and emits
// the world position; the parent decides what action to dispatch.

import { useState, useCallback } from 'react'
import { worldToSvg, clientToSvg, svgToWorld } from './coords.js'
import { useSceneContext } from './SceneContext.jsx'

/**
 * @param {{
 *   worldPos:        import('../../../../lib/reformer/types.js').Vec2,
 *   onPointerWorld:  (worldPos: import('../../../../lib/reformer/types.js').Vec2) => void,
 *   ariaLabel?:      string,
 *   variant?:        'joint' | 'endpoint' | 'root',
 * }} props
 */
export default function DragHandle({
  worldPos,
  onPointerWorld,
  ariaLabel,
  variant = 'joint',
}) {
  const { svgRef, interactive } = useSceneContext()
  const [active, setActive] = useState(false)

  const toWorld = useCallback(
    (e) => {
      if (!svgRef?.current) return null
      const svgP = clientToSvg(svgRef.current, e.clientX, e.clientY)
      return svgToWorld(svgP)
    },
    [svgRef],
  )

  const handleDown = useCallback(
    (e) => {
      if (!interactive) return
      e.stopPropagation()
      try {
        e.currentTarget.setPointerCapture(e.pointerId)
      } catch {
        // some browsers throw if pointer is no longer present
      }
      setActive(true)
      const w = toWorld(e)
      if (w) onPointerWorld(w)
    },
    [interactive, onPointerWorld, toWorld],
  )

  const handleMove = useCallback(
    (e) => {
      if (!active) return
      const w = toWorld(e)
      if (w) onPointerWorld(w)
    },
    [active, onPointerWorld, toWorld],
  )

  const handleUp = useCallback(
    (e) => {
      if (!active) return
      try {
        e.currentTarget.releasePointerCapture(e.pointerId)
      } catch { /* noop */ }
      setActive(false)
    },
    [active],
  )

  const svgP = worldToSvg(worldPos)
  const visual = variantStyle(variant, active)

  return (
    <g aria-label={ariaLabel}>
      <circle
        cx={svgP.x}
        cy={svgP.y}
        r={visual.visualRadius}
        fill={visual.fill}
        stroke={visual.stroke}
        strokeWidth={1.5}
      />
      <circle
        cx={svgP.x}
        cy={svgP.y}
        r={visual.hitRadius}
        fill="transparent"
        stroke={active ? 'var(--color-accent)' : 'transparent'}
        strokeWidth={1}
        style={{
          cursor: interactive ? (active ? 'grabbing' : 'grab') : 'default',
          touchAction: 'none',
          pointerEvents: interactive ? 'auto' : 'none',
        }}
        onPointerDown={handleDown}
        onPointerMove={handleMove}
        onPointerUp={handleUp}
        onPointerCancel={handleUp}
      />
    </g>
  )
}

function variantStyle(variant, active) {
  if (variant === 'root') {
    return {
      visualRadius: 5,
      hitRadius: 12,
      fill: active ? 'var(--color-accent)' : 'var(--color-surface-raised)',
      stroke: 'var(--color-accent)',
    }
  }
  if (variant === 'endpoint') {
    return {
      visualRadius: 4,
      hitRadius: 11,
      fill: 'var(--color-accent)',
      stroke: 'var(--color-accent)',
    }
  }
  return {
    visualRadius: 3,
    hitRadius: 10,
    fill: 'var(--color-bg)',
    stroke: 'var(--color-ink)',
  }
}
