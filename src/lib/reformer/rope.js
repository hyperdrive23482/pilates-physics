// Rope geometry, the per-rope 1D carriage solver, the shared-carriage
// resolution rule, and force decomposition at the hand.
//
// Path model:
//   carriageEnd  -->  pulley  -->  hand
//   pathLength = dist(carriageEnd, pulley) * mechanicalAdvantage
//              + dist(pulley, hand)
// A doubled (block-and-tackle) route has mechanicalAdvantage = 2: the carriage
// side has two strands, so carriage travel is halved per unit of rope pulled
// through the pulley, and tension reflected to the hand is doubled.
//
// Solver: residual = pathLength - rope.totalLength. residual is monotonically
// increasing in carriageX (the pulley sits at the head end; as carriageX
// increases toward the foot, the carriage-side leg lengthens). We use
// bisection on [carriageMinX, carriageMaxX] then two Newton polish steps.

import { dist, sub, norm } from './vec.js'
import { radToDeg } from './units.js'

/** @typedef {import('./types.js').Vec2}     Vec2 */
/** @typedef {import('./types.js').Reformer} Reformer */
/** @typedef {import('./types.js').Rope}     Rope */
/** @typedef {import('./types.js').RopeResult} RopeResult */

const TOL = 1e-6
const MAX_ITER = 60

/**
 * World position of the rope attachment point on the carriage (head edge).
 *
 * @param {Reformer} reformer
 * @param {number} carriageX
 * @returns {Vec2}
 */
export function ropeCarriageEndPos(reformer, carriageX) {
  return { x: carriageX - reformer.carriageLength, y: reformer.carriageSpringY }
}

/**
 * Total rope path length given the three key points and pulley routing.
 *
 * @param {Vec2}   carriageEnd
 * @param {Vec2}   pulley
 * @param {Vec2}   hand
 * @param {number} mechAdv      1 = single, 2 = doubled / block-and-tackle
 * @returns {number} m
 */
export function ropePathLength(carriageEnd, pulley, hand, mechAdv = 1) {
  return dist(carriageEnd, pulley) * mechAdv + dist(pulley, hand)
}

/**
 * residual = pathLength(carriageX) - rope.totalLength. Zero where the rope
 * sits exactly taut at that carriage position.
 *
 * @param {number}   carriageX
 * @param {Rope}     rope
 * @param {Reformer} reformer
 * @param {Vec2}     hand
 * @returns {number} m
 */
export function ropeResidual(carriageX, rope, reformer, hand) {
  const route = reformer.routes.find((r) => r.id === rope.id)
  if (!route) return 0
  const ce = ropeCarriageEndPos(reformer, carriageX)
  return ropePathLength(ce, route.pulley, hand, route.mechanicalAdvantage) - rope.totalLength
}

/**
 * Solve for the carriage position that makes this single rope exactly taut at
 * the given hand position. Returns the demanded carriageX plus flags.
 *
 * residual is monotonically increasing in carriageX, so:
 *   residual(min) >= 0  =>  path too long even when fully retracted
 *                           (clamp to carriageMinX, atLimit:true)
 *   residual(max) <= 0  =>  path always shorter than L
 *                           (rope slack at every reachable carriage position)
 *   straddle            =>  bisection + Newton polish to a tight root
 *
 * @param {Rope}     rope
 * @param {Reformer} reformer
 * @param {Vec2}     hand
 * @param {number|null} seedX  warm-start / fallback carriage position
 * @returns {{ carriageX:number, slack:boolean, atLimit:boolean, converged:boolean }}
 */
export function solveCarriageForRope(rope, reformer, hand, seedX = null) {
  const xMin = reformer.carriageMinX
  const xMax = reformer.carriageMaxX
  const rMin = ropeResidual(xMin, rope, reformer, hand)
  const rMax = ropeResidual(xMax, rope, reformer, hand)

  if (rMin >= 0) {
    return { carriageX: xMin, slack: false, atLimit: true, converged: true }
  }
  if (rMax <= 0) {
    const fallback = seedX ?? reformer.carriageRestX
    return { carriageX: fallback, slack: true, atLimit: false, converged: true }
  }

  let lo = xMin, hi = xMax
  let iter = 0
  while (iter < MAX_ITER && (hi - lo) > TOL) {
    const mid = (lo + hi) / 2
    const rMid = ropeResidual(mid, rope, reformer, hand)
    if (rMid === 0) { lo = hi = mid; break }
    if (rMid > 0) hi = mid; else lo = mid
    iter++
  }
  let x = (lo + hi) / 2

  // Two Newton polish steps with a finite-difference derivative.
  for (let k = 0; k < 2; k++) {
    const h = 1e-4
    const rA = ropeResidual(x, rope, reformer, hand)
    if (Math.abs(rA) < TOL) break
    const rB = ropeResidual(x + h, rope, reformer, hand)
    const deriv = (rB - rA) / h
    if (!Number.isFinite(deriv) || Math.abs(deriv) < 1e-9) break
    const xNew = x - rA / deriv
    if (xNew < xMin || xNew > xMax) break
    x = xNew
  }
  return { carriageX: x, slack: false, atLimit: false, converged: true }
}

/**
 * Shared-carriage resolution for v1.
 *
 * Each rope demands a carriageX. Because the carriage is a single rigid body,
 * v1 uses a deterministic rule: take the smallest (most-retracted) demand from
 * the taut ropes, clamp to travel range. Any rope whose demand is greater than
 * the chosen position would have its hand-side go slack at the chosen position;
 * we flag that rope `slack:true` and its tension is zero. This is a documented
 * simplification, NOT a coupled force balance.
 *
 * @param {Rope[]}    ropes
 * @param {Reformer}  reformer
 * @param {Object.<string, Vec2>} handsById
 * @param {number|null} seedX
 * @returns {{
 *   carriageX: number,
 *   perRope: Object.<string, { slack:boolean, demandX:number, atLimit:boolean }>,
 *   atLimit: boolean,
 * }}
 */
export function solveSharedCarriage(ropes, reformer, handsById, seedX = null) {
  const demands = []
  for (const rope of ropes) {
    const hand = handsById[rope.handId]
    if (!hand) continue
    demands.push({ rope, ...solveCarriageForRope(rope, reformer, hand, seedX) })
  }

  const tautDemands = demands.filter((d) => !d.slack)
  let chosenX
  if (tautDemands.length === 0) {
    chosenX = seedX ?? reformer.carriageRestX
  } else {
    chosenX = Math.min(...tautDemands.map((d) => d.carriageX))
  }
  const preClamp = chosenX
  chosenX = Math.max(reformer.carriageMinX, Math.min(reformer.carriageMaxX, chosenX))

  let atLimit = demands.some((d) => d.atLimit) || preClamp !== chosenX

  const perRope = {}
  for (const d of demands) {
    const slack = d.slack || d.carriageX > chosenX + 1e-6
    perRope[d.rope.id] = { slack, demandX: d.carriageX, atLimit: d.atLimit }
  }
  return { carriageX: chosenX, perRope, atLimit }
}

/**
 * Decompose rope tension at the hand into world components and angles.
 *
 * Tension pulls the hand toward the pulley along (pulley - hand). Direction is
 * the unit vector of that difference. Angles are reported both relative to
 * +x (horizontal, atan2(dy, dx)) and relative to +y (vertical, atan2(dx, dy)),
 * both in degrees, both signed.
 *
 * @param {string} ropeId
 * @param {Vec2}   pulley
 * @param {Vec2}   hand
 * @param {number} tensionMag    N
 * @returns {RopeResult}
 */
export function ropeForceVector(ropeId, pulley, hand, tensionMag) {
  const dir = sub(pulley, hand)
  const dirN = norm(dir)
  const force = { x: dirN.x * tensionMag, y: dirN.y * tensionMag }
  return {
    id: ropeId,
    tension: tensionMag,
    angleFromHorizontal: radToDeg(Math.atan2(dir.y, dir.x)),
    angleFromVertical: radToDeg(Math.atan2(dir.x, dir.y)),
    forceVectorAtHand: force,
    fH: force.x,
    fV: force.y,
    slack: tensionMag <= 0,
  }
}
