// Per-frame export. Walks the timeline at the chosen fps, samples each frame
// purely (sampleKeyframesAt + solve), and returns CSV or JSON. Both formats
// flatten the derived state so each row / array element is fully self-describing.

import { sampleKeyframesAt, totalDuration } from '../../../../lib/reformer/interp.js'
import { solve } from '../../../../lib/reformer/solve.js'
import { mToCm, nToLb } from '../../../../lib/reformer/units.js'

/** @typedef {import('../../../../lib/reformer/types.js').Project} Project */

/**
 * Build the frame stream for an entire timeline.
 *
 * @param {Project} project
 * @returns {Array<{ t:number, derived: import('../../../../lib/reformer/types.js').DerivedState, model: import('../../../../lib/reformer/types.js').ModelState }>}
 */
export function buildFrames(project) {
  const dur = totalDuration(project.keyframes)
  if (dur <= 0 || project.keyframes.length < 2) return []
  const fps = Math.max(1, project.ui.fps || 30)
  const dt = 1 / fps
  const frames = []
  for (let t = 0; t <= dur + 1e-9; t += dt) {
    const tc = Math.min(t, dur)
    const model = sampleKeyframesAt(project.keyframes, tc, project.model)
    const derived = solve(model)
    frames.push({ t: tc, derived, model })
  }
  return frames
}

/**
 * Flatten a frame into a row of named scalar values (display units). Includes
 * per-spring tension and per-rope tension/angle/fH/fV columns by id.
 */
function frameToRow(frame, springIds, ropeIds, jointIds) {
  const d = frame.derived
  const row = {
    t_s: frame.t,
    carriageX_cm: mToCm(d.carriageX),
    carriageDisplacement_cm: mToCm(d.carriageDisplacement),
    totalSpringForce_lb: nToLb(d.totalSpringForce),
    bodyWeight_lb: nToLb(d.bodyWeightN),
    slack: d.flags.slack ? 1 : 0,
    atLimit: d.flags.atLimit ? 1 : 0,
    infeasible: d.flags.infeasible ? 1 : 0,
  }
  for (const sid of springIds) {
    const sr = d.springResults.find((r) => r.id === sid)
    row[`spring_${sid}_stretch_cm`] = sr ? mToCm(sr.stretch) : 0
    row[`spring_${sid}_tension_lb`] = sr ? nToLb(sr.tension) : 0
  }
  for (const rid of ropeIds) {
    const rr = d.ropeResults.find((r) => r.id === rid)
    row[`rope_${rid}_tension_lb`] = rr ? nToLb(rr.tension) : 0
    row[`rope_${rid}_angleH_deg`] = rr ? rr.angleFromHorizontal : 0
    row[`rope_${rid}_angleV_deg`] = rr ? rr.angleFromVertical : 0
    row[`rope_${rid}_fH_lb`] = rr ? nToLb(rr.fH) : 0
    row[`rope_${rid}_fV_lb`] = rr ? nToLb(rr.fV) : 0
    row[`rope_${rid}_slack`] = rr && rr.slack ? 1 : 0
  }
  for (const jid of jointIds) {
    row[`joint_${jid}_deg`] = d.jointAnglesDeg[jid] ?? 0
  }
  return row
}

/** @param {Project} project */
export function framesToCsv(project) {
  const frames = buildFrames(project)
  if (frames.length === 0) return ''
  const springIds = project.model.springs.map((s) => s.id)
  const ropeIds = project.model.ropes.map((r) => r.id)
  const jointIds = Object.keys(frames[0].derived.jointAnglesDeg)
  const rows = frames.map((f) => frameToRow(f, springIds, ropeIds, jointIds))
  const headers = Object.keys(rows[0])
  const escape = (v) => {
    if (typeof v === 'number') return Number.isFinite(v) ? v.toFixed(4) : ''
    const s = String(v)
    return /[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s
  }
  const lines = [headers.join(',')]
  for (const row of rows) lines.push(headers.map((h) => escape(row[h])).join(','))
  return lines.join('\n')
}

/** @param {Project} project */
export function framesToJson(project) {
  const frames = buildFrames(project)
  return JSON.stringify(
    {
      meta: {
        version: 1,
        fps: project.ui.fps,
        keyframeCount: project.keyframes.length,
        duration_s: totalDuration(project.keyframes),
        frameCount: frames.length,
      },
      frames,
    },
    null,
    2,
  )
}
