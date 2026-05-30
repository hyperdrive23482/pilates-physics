// Stick-figure body layer. Renders segments as lines, the head as a circle,
// and every named joint as a draggable handle. Dragging the pelvis translates
// the whole figure; dragging any other joint rotates its owner-segment subtree
// rigidly about the segment's proximal anchor.

import { useCallback } from 'react'
import { worldToSvg } from './coords.js'
import DragHandle from './DragHandle.jsx'
import { JOINT_TO_SEGMENT } from '../../../../lib/reformer/kinematics.js'
import { useDispatch } from '../store/ModelContext.jsx'
import { setRootPos, rotateSubtree } from '../store/actions.js'
import { normalizeAngle } from '../../../../lib/reformer/units.js'

/** @typedef {import('../../../../lib/reformer/types.js').Human} Human */
/** @typedef {import('../../../../lib/reformer/types.js').Vec2}  Vec2 */

const SEGMENT_STYLE = {
  trunk:    { stroke: 'var(--color-ink)',       width: 3 },
  headNeck: { stroke: 'var(--color-ink-muted)', width: 2 },
  upperArm: { stroke: 'var(--color-ink)',       width: 2.5 },
  forearm:  { stroke: 'var(--color-ink)',       width: 2.5 },
  hand:     { stroke: 'var(--color-ink-muted)', width: 2 },
  thigh:    { stroke: 'var(--color-ink)',       width: 2.5 },
  shank:    { stroke: 'var(--color-ink)',       width: 2.5 },
  foot:     { stroke: 'var(--color-ink-muted)', width: 2 },
}

// jointId -> { kind, segmentId, proximalJointId }
// Each joint is the distal end of exactly one segment; dragging the joint
// rotates that segment (and its subtree) about its proximal anchor.
const DRAG_SPEC = {
  pelvis:   { kind: 'translate' },
  shoulder: { kind: 'rotate', segmentId: 'trunk',    proximalJointId: 'pelvis' },
  elbow:    { kind: 'rotate', segmentId: 'upperArm', proximalJointId: 'shoulder' },
  wrist:    { kind: 'rotate', segmentId: 'forearm',  proximalJointId: 'elbow' },
  handTip:  { kind: 'rotate', segmentId: 'hand',     proximalJointId: 'wrist' },
  headTop:  { kind: 'rotate', segmentId: 'headNeck', proximalJointId: 'shoulder' },
  knee:     { kind: 'rotate', segmentId: 'thigh',    proximalJointId: 'pelvis' },
  ankle:    { kind: 'rotate', segmentId: 'shank',    proximalJointId: 'knee' },
  toeTip:   { kind: 'rotate', segmentId: 'foot',     proximalJointId: 'ankle' },
}

const ENDPOINT_JOINTS = new Set(['handTip', 'toeTip'])

export default function BodyLayer({ human, jointPositions }) {
  const dispatch = useDispatch()

  return (
    <g aria-label="Stick figure body">
      {/* Segment lines (static lines drawn under handles) */}
      {human.segments.map((seg) => {
        const proximalJointId = seg.parentId ? JOINT_TO_SEGMENT[seg.parentId] : 'pelvis'
        const distalJointId = JOINT_TO_SEGMENT[seg.id]
        const a = jointPositions[proximalJointId]
        const b = jointPositions[distalJointId]
        if (!a || !b) return null
        const A = worldToSvg(a)
        const B = worldToSvg(b)
        const style = SEGMENT_STYLE[seg.id] ?? { stroke: 'var(--color-ink)', width: 2 }
        return (
          <line
            key={seg.id}
            x1={A.x} y1={A.y} x2={B.x} y2={B.y}
            stroke={style.stroke}
            strokeWidth={style.width}
            strokeLinecap="round"
          />
        )
      })}

      {/* Head circle */}
      {jointPositions.headTop && jointPositions.shoulder && (
        <HeadCircle headTop={jointPositions.headTop} shoulder={jointPositions.shoulder} />
      )}

      {/* Draggable joint handles */}
      {Object.entries(DRAG_SPEC).map(([jointId, spec]) => {
        const pos = jointPositions[jointId]
        if (!pos) return null
        const variant =
          spec.kind === 'translate' ? 'root' : ENDPOINT_JOINTS.has(jointId) ? 'endpoint' : 'joint'
        return (
          <JointHandle
            key={jointId}
            jointId={jointId}
            spec={spec}
            worldPos={pos}
            jointPositions={jointPositions}
            human={human}
            dispatch={dispatch}
            variant={variant}
          />
        )
      })}
    </g>
  )
}

function JointHandle({ jointId, spec, worldPos, jointPositions, human, dispatch, variant }) {
  const onPointerWorld = useCallback(
    (target) => {
      if (spec.kind === 'translate') {
        dispatch(setRootPos(target))
        return
      }
      const proximal = jointPositions[spec.proximalJointId]
      if (!proximal) return
      const dx = target.x - proximal.x
      const dy = target.y - proximal.y
      if (Math.hypot(dx, dy) < 1e-6) return
      const newAngle = Math.atan2(dy, dx)
      const currentAngle = human.angles[spec.segmentId] ?? 0
      const delta = normalizeAngle(newAngle - currentAngle)
      if (Math.abs(delta) < 1e-6) return
      dispatch(rotateSubtree(spec.segmentId, delta))
    },
    [spec, jointPositions, human, dispatch],
  )

  return (
    <DragHandle
      worldPos={worldPos}
      onPointerWorld={onPointerWorld}
      ariaLabel={`Drag handle for ${jointId}`}
      variant={variant}
    />
  )
}

function HeadCircle({ headTop, shoulder }) {
  const dx = headTop.x - shoulder.x
  const dy = headTop.y - shoulder.y
  const lenWorld = Math.hypot(dx, dy)
  const radiusWorld = lenWorld * 0.55
  const midWorld = { x: (headTop.x + shoulder.x) / 2, y: (headTop.y + shoulder.y) / 2 }
  const C = worldToSvg(midWorld)
  const tipSvg = worldToSvg({ x: midWorld.x, y: midWorld.y + radiusWorld })
  const rSvg = Math.abs(C.y - tipSvg.y)
  return (
    <circle cx={C.x} cy={C.y} r={rSvg} fill="var(--color-bg)" stroke="var(--color-ink-muted)" strokeWidth={1.5} />
  )
}
