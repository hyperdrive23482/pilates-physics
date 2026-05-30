// Top-level pure entry point for the Reformer Force Modeler.
//
// solve(modelState) -> derivedState.
// No React, no DOM. Safe to call from useMemo every render and from the
// per-frame playback loop. Allocation-light, deterministic, warm-started by
// model.carriageSeedX.

import { forwardKinematics, jointAnglesDeg } from './kinematics.js'
import { totalSpringForce } from './springs.js'
import { solveSharedCarriage, ropeForceVector } from './rope.js'
import { dist } from './vec.js'
import { G } from './units.js'

/** @typedef {import('./types.js').ModelState}   ModelState */
/** @typedef {import('./types.js').DerivedState} DerivedState */

/**
 * @param {ModelState} model
 * @returns {DerivedState}
 */
export function solve(model) {
  const flags = { slack: false, atLimit: false, infeasible: false, messages: [] }

  // 1. Forward kinematics. World positions of every named joint.
  const jointPositions = forwardKinematics(model.human)

  // 2. Active ropes: ropes whose handId endpoint is pinnedToRopeEnd to that rope.
  const activeRopes = model.ropes.filter((rope) => {
    const att = model.attachments.find((a) => a.endId === rope.handId)
    return !!att && att.mode === 'pinnedToRopeEnd' && att.ropeId === rope.id
  })

  // 3. handsById table for the shared-carriage solve.
  const handsById = {}
  for (const rope of activeRopes) {
    const hand = jointPositions[rope.handId]
    if (hand) handsById[rope.handId] = hand
    else {
      flags.infeasible = true
      flags.messages.push(`Rope "${rope.id}" hand "${rope.handId}" missing from FK output`)
    }
  }

  // 4. Shared-carriage solve (or rest carriage when no ropes are engaged).
  let carriageX = model.reformer.carriageRestX
  let perRopeFlags = {}
  let atLimit = false
  if (activeRopes.length > 0 && Object.keys(handsById).length > 0) {
    const r = solveSharedCarriage(
      activeRopes,
      model.reformer,
      handsById,
      model.carriageSeedX,
    )
    carriageX = r.carriageX
    perRopeFlags = r.perRope
    atLimit = r.atLimit
  }

  // 5. Spring geometry and total spring force.
  const carriageSpringPoint = { x: carriageX, y: model.reformer.carriageSpringY }
  const currentSpringLength = dist(model.reformer.springAnchor, carriageSpringPoint)
  const { total: totalSpringForceN, perSpring: springResults } = totalSpringForce(
    model.springs,
    currentSpringLength,
  )

  // 6. Distribute spring force equally across taut ropes (documented v1 rule).
  const tautRopeIds = activeRopes
    .filter((r) => !perRopeFlags[r.id]?.slack)
    .map((r) => r.id)
  const tensionPerTautRope =
    tautRopeIds.length > 0 ? totalSpringForceN / tautRopeIds.length : 0

  // 7. Force vector at each rope's hand.
  const ropeResults = activeRopes.map((rope) => {
    const route = model.reformer.routes.find((r) => r.id === rope.id)
    const pulley = route?.pulley ?? { x: 0, y: 0 }
    const hand = handsById[rope.handId] ?? { x: 0, y: 0 }
    const isSlack = !!perRopeFlags[rope.id]?.slack
    const tension = isSlack ? 0 : tensionPerTautRope
    return ropeForceVector(rope.id, pulley, hand, tension)
  })

  // 8. Joint angles in degrees.
  const jointAnglesDegMap = jointAnglesDeg(model.human)

  // 9. Body weight (PHASE 2 display-only).
  const bodyWeightNValue = model.human.bodyMass * G

  // 10. Flag aggregation + messages.
  if (Object.values(perRopeFlags).some((p) => p.slack)) {
    flags.slack = true
    flags.messages.push('At least one rope is slack')
  }
  if (atLimit) {
    flags.atLimit = true
    flags.messages.push('Carriage at travel limit')
  }
  if (model.reformer.carriageMinX >= model.reformer.carriageMaxX) {
    flags.infeasible = true
    flags.messages.push('Carriage travel range is empty')
  }
  const restGap = dist(
    model.reformer.springAnchor,
    { x: model.reformer.carriageRestX, y: model.reformer.carriageSpringY },
  )
  if (restGap < 1e-6) {
    flags.infeasible = true
    flags.messages.push('Spring anchor coincides with carriage rest position')
  }

  return {
    jointPositions,
    jointAnglesDeg: jointAnglesDegMap,
    carriageX,
    carriageDisplacement: carriageX - model.reformer.carriageRestX,
    springResults,
    totalSpringForce: totalSpringForceN,
    ropeResults,
    bodyWeightN: bodyWeightNValue,
    flags,
  }
}
