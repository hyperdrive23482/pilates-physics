// Draws the static reformer: rails, footbar, risers, and the moving carriage.

import { worldToSvg } from './coords.js'

/** @typedef {import('../../../../lib/reformer/types.js').Reformer} Reformer */

export default function ReformerLayer({ reformer, carriageX }) {
  const headPost = worldToSvg({ x: 0, y: 0 })
  const footPost = worldToSvg({ x: reformer.frameLength, y: 0 })
  const railLeft = worldToSvg({ x: 0, y: reformer.frameHeight })
  const railRight = worldToSvg({ x: reformer.frameLength, y: reformer.frameHeight })

  // Risers: vertical posts at the head end, pulleys on top. Side view shows
  // the two routes superimposed; we draw one post at the unique pulley x.
  const uniquePulleys = new Map()
  for (const r of reformer.routes) {
    const key = `${r.pulley.x.toFixed(4)}|${r.pulley.y.toFixed(4)}`
    if (!uniquePulleys.has(key)) uniquePulleys.set(key, r.pulley)
  }
  const riserBase = worldToSvg({ x: 0, y: reformer.frameHeight })

  // Carriage rectangle: carriageX is the world x of the carriage's spring-end
  // (foot-end edge). The head-end edge is at carriageX - carriageLength.
  const carriageHead = worldToSvg({ x: carriageX - reformer.carriageLength, y: reformer.frameHeight })
  const carriageFoot = worldToSvg({ x: carriageX, y: reformer.frameHeight })
  const carriageThicknessSvg = 18 // PLACEHOLDER  visual thickness only

  // Footbar
  const footbarBase = worldToSvg({ x: reformer.footbar.x, y: reformer.frameHeight })
  const footbarTop = worldToSvg(reformer.footbar)

  // Spring anchor marker
  const springAnchor = worldToSvg(reformer.springAnchor)

  // Travel-range ticks
  const tickMin = worldToSvg({ x: reformer.carriageMinX, y: reformer.frameHeight })
  const tickMax = worldToSvg({ x: reformer.carriageMaxX, y: reformer.frameHeight })
  const tickRest = worldToSvg({ x: reformer.carriageRestX, y: reformer.frameHeight })

  return (
    <g aria-label="Reformer frame and carriage">
      {/* Floor line */}
      <line
        x1={worldToSvg({ x: -0.2, y: 0 }).x}
        y1={worldToSvg({ x: 0, y: 0 }).y}
        x2={worldToSvg({ x: reformer.frameLength + 0.2, y: 0 }).x}
        y2={worldToSvg({ x: 0, y: 0 }).y}
        stroke="var(--color-rule)"
        strokeWidth={1}
      />

      {/* Vertical posts at the ends, from floor to rail height */}
      <line x1={headPost.x} y1={headPost.y} x2={railLeft.x} y2={railLeft.y}  stroke="var(--color-rule)" strokeWidth={2} />
      <line x1={footPost.x} y1={footPost.y} x2={railRight.x} y2={railRight.y} stroke="var(--color-rule)" strokeWidth={2} />

      {/* Top rail */}
      <line
        x1={railLeft.x}
        y1={railLeft.y}
        x2={railRight.x}
        y2={railRight.y}
        stroke="var(--color-ink-muted)"
        strokeWidth={1.5}
      />

      {/* Travel range ticks below the rail */}
      <line x1={tickMin.x} y1={tickMin.y + 8} x2={tickMin.x} y2={tickMin.y + 18} stroke="var(--color-rule)" strokeWidth={1} />
      <line x1={tickMax.x} y1={tickMax.y + 8} x2={tickMax.x} y2={tickMax.y + 18} stroke="var(--color-rule)" strokeWidth={1} />
      <line x1={tickRest.x} y1={tickRest.y + 8} x2={tickRest.x} y2={tickRest.y + 22} stroke="var(--color-ink-muted)" strokeWidth={1} strokeDasharray="3 3" />
      <text x={tickRest.x} y={tickRest.y + 36} textAnchor="middle" fontSize={10} fontFamily="var(--font-mono)" fill="var(--color-ink-dim)">rest</text>

      {/* Risers + pulleys */}
      {[...uniquePulleys.values()].map((p) => {
        const top = worldToSvg(p)
        return (
          <g key={`riser-${p.x}-${p.y}`}>
            <line x1={riserBase.x + (top.x - riserBase.x)} y1={riserBase.y} x2={top.x} y2={top.y} stroke="var(--color-rule)" strokeWidth={2} />
            <circle cx={top.x} cy={top.y} r={5} fill="var(--color-bg)" stroke="var(--color-ink-muted)" strokeWidth={1.5} />
          </g>
        )
      })}

      {/* Footbar */}
      <line x1={footbarBase.x} y1={footbarBase.y} x2={footbarTop.x} y2={footbarTop.y} stroke="var(--color-ink-muted)" strokeWidth={3} />
      <circle cx={footbarTop.x} cy={footbarTop.y} r={3.5} fill="var(--color-ink-muted)" />

      {/* Spring anchor */}
      <circle cx={springAnchor.x} cy={springAnchor.y} r={4} fill="var(--color-rule)" stroke="var(--color-ink-muted)" strokeWidth={1} />

      {/* Carriage */}
      <rect
        x={carriageHead.x}
        y={carriageHead.y - carriageThicknessSvg}
        width={carriageFoot.x - carriageHead.x}
        height={carriageThicknessSvg}
        fill="var(--color-surface-raised)"
        stroke="var(--color-ink-muted)"
        strokeWidth={1.5}
      />
    </g>
  )
}
