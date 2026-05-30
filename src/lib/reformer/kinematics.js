// Forward kinematics for the side-view stick figure.
//
// Each segment in `human.segments` has a parentId (or null = root) and a
// length in meters. Each segment's *absolute* world angle (radians, measured
// from world +x toward +y) lives in `human.angles` keyed by segment id.
// FK walks the chain in dependency order and returns world positions of every
// named joint plus joint angles between adjacent segments.

import { fromAngle, add, dist } from './vec.js'
import { normalizeAngle, radToDeg } from './units.js'

/** @typedef {import('./types.js').Human} Human */
/** @typedef {import('./types.js').Vec2}  Vec2 */

// Each segment's distal end maps to a named joint. The proximal end of a
// segment is its parent's distal joint (or rootPos for root segments).
const SEGMENT_TO_DISTAL_JOINT = {
  trunk: 'shoulder',
  headNeck: 'headTop',
  upperArm: 'elbow',
  forearm: 'wrist',
  hand: 'handTip',
  thigh: 'knee',
  shank: 'ankle',
  foot: 'toeTip',
}

// Joint id -> the segment that ENDS at that joint (used when reading angles).
export const JOINT_TO_SEGMENT = SEGMENT_TO_DISTAL_JOINT

// Distal-joint helper for a segment id.
export function distalJointId(segmentId) {
  return SEGMENT_TO_DISTAL_JOINT[segmentId]
}

// Internal joint angles to report. Each joint is the meeting of a parent
// segment and a child segment; the reported angle is the child's world angle
// minus the parent's world angle, normalized to (-PI, PI], in degrees.
const JOINT_ANGLES_SPEC = {
  neck:     { parent: 'trunk',    child: 'headNeck' },
  shoulder: { parent: 'trunk',    child: 'upperArm' },
  elbow:    { parent: 'upperArm', child: 'forearm'  },
  wrist:    { parent: 'forearm',  child: 'hand'     },
  hip:      { parent: 'trunk',    child: 'thigh'    },
  knee:     { parent: 'thigh',    child: 'shank'    },
  ankle:    { parent: 'shank',    child: 'foot'     },
}

// End-point joints that can be pinned to a rope or to a frame point.
export const ENDPOINT_JOINTS = ['handTip', 'toeTip']

/**
 * Walk the segment chain and return world positions of every named joint.
 *
 * @param {Human} human
 * @returns {Object.<string, Vec2>}  joint id -> world position
 */
export function forwardKinematics(human) {
  /** @type {Object.<string, Vec2>} */
  const jointPositions = { pelvis: { ...human.rootPos } }

  for (const seg of human.segments) {
    const proximal = seg.parentId
      ? jointPositions[SEGMENT_TO_DISTAL_JOINT[seg.parentId]]
      : human.rootPos
    const angle = human.angles[seg.id] ?? 0
    const distal = add(proximal, fromAngle(angle, seg.length))
    jointPositions[SEGMENT_TO_DISTAL_JOINT[seg.id]] = distal
  }
  return jointPositions
}

/**
 * Joint angles in degrees, derived from the current human.angles map. This is
 * a pure derivation (no FK needed): each internal joint is just the difference
 * between two segment world angles.
 *
 * @param {Human} human
 * @returns {Object.<string, number>}  joint id -> degrees in (-180, 180]
 */
export function jointAnglesDeg(human) {
  const out = {}
  for (const [jointId, spec] of Object.entries(JOINT_ANGLES_SPEC)) {
    const childAngle = human.angles[spec.child] ?? 0
    const parentAngle = human.angles[spec.parent] ?? 0
    out[jointId] = radToDeg(normalizeAngle(childAngle - parentAngle))
  }
  return out
}

/**
 * Recompute a single segment's absolute world angle so its distal end lands
 * at the given world target. Returns the new angle (rad) without mutating
 * the Human. Used by drag-endpoint actions to move the nearest joint without
 * running a full-chain IK.
 *
 * @param {Vec2}   proximal
 * @param {Vec2}   target
 * @returns {number} rad
 */
export function angleForSegmentToReach(proximal, target) {
  return Math.atan2(target.y - proximal.y, target.x - proximal.x)
}

/**
 * Is the endpoint joint reachable from the human's root with the chain's
 * fixed segment lengths? A 2D chain can reach any point whose distance from
 * the root is at most the sum of the lengths on the path to that endpoint.
 *
 * @param {Human}  human
 * @param {string} endId  e.g. 'toeTip' | 'handTip'
 * @param {Vec2}   worldTarget
 * @returns {boolean}
 */
export function isReachable(human, endId, worldTarget) {
  const segs = segmentChainTo(human.segments, endId)
  if (!segs.length) return false
  const reach = segs.reduce((acc, s) => acc + s.length, 0)
  return dist(human.rootPos, worldTarget) <= reach + 1e-9
}

/**
 * The chain of segments from root to the given endpoint joint, in order.
 *
 * @param {import('./types.js').BodySegment[]} segments
 * @param {string} endId
 * @returns {import('./types.js').BodySegment[]}
 */
export function segmentChainTo(segments, endId) {
  const segById = new Map(segments.map((s) => [s.id, s]))
  let segId = Object.entries(SEGMENT_TO_DISTAL_JOINT).find(([, j]) => j === endId)?.[0]
  if (!segId) return []
  const out = []
  while (segId) {
    const seg = segById.get(segId)
    if (!seg) break
    out.unshift(seg)
    segId = seg.parentId
  }
  return out
}
