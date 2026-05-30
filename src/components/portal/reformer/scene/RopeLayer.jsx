// Rope polylines from the carriage end, over each pulley, to the hand. Slack
// ropes render dashed and dimmed. Pulleys are drawn here so they sit on top
// of the rope ends visually.

import { worldToSvg } from './coords.js'
import { ropeCarriageEndPos } from '../../../../lib/reformer/rope.js'

/** @typedef {import('../../../../lib/reformer/types.js').Reformer} Reformer */
/** @typedef {import('../../../../lib/reformer/types.js').Rope}     Rope */
/** @typedef {import('../../../../lib/reformer/types.js').RopeResult} RopeResult */
/** @typedef {import('../../../../lib/reformer/types.js').Attachment} Attachment */
/** @typedef {import('../../../../lib/reformer/types.js').Vec2}     Vec2 */

/**
 * @param {{
 *  reformer: Reformer,
 *  ropes: Rope[],
 *  ropeResults: RopeResult[],
 *  attachments: Attachment[],
 *  jointPositions: Object<string, Vec2>,
 *  carriageX: number,
 * }} props
 */
export default function RopeLayer({ reformer, ropes, ropeResults, attachments, jointPositions, carriageX }) {
  const carriageEndWorld = ropeCarriageEndPos(reformer, carriageX)

  return (
    <g aria-label="Ropes and pulleys">
      {ropes.map((rope, i) => {
        const route = reformer.routes.find((r) => r.id === rope.id)
        if (!route) return null
        const att = attachments.find((a) => a.endId === rope.handId)
        const isActive = !!att && att.mode === 'pinnedToRopeEnd' && att.ropeId === rope.id
        const rr = ropeResults.find((r) => r.id === rope.id)
        const slack = !isActive || (rr?.slack ?? true)
        const hand = isActive ? jointPositions[rope.handId] : null

        const offY = (i - (ropes.length - 1) / 2) * 5
        const A = worldToSvg(carriageEndWorld)
        const P = worldToSvg(route.pulley)
        const H = hand ? worldToSvg(hand) : null

        const A2 = { x: A.x, y: A.y + offY }
        const P2 = { x: P.x, y: P.y + offY }
        const points = H
          ? `${A2.x},${A2.y} ${P2.x},${P2.y} ${H.x},${H.y + offY}`
          : `${A2.x},${A2.y} ${P2.x},${P2.y}`

        const stroke = slack ? 'var(--color-ink-dim)' : 'var(--color-ink-muted)'
        return (
          <g key={rope.id}>
            <polyline
              points={points}
              fill="none"
              stroke={stroke}
              strokeWidth={1.5}
              strokeLinejoin="round"
              strokeLinecap="round"
              strokeDasharray={slack ? '5 4' : undefined}
            />
          </g>
        )
      })}
    </g>
  )
}
