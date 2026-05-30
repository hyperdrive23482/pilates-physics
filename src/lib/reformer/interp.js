// Pure interpolation helpers for the timeline.
//
// Only joint angles + rootPos are interpolated. The machine config (reformer,
// springs, attachments) snaps to the from-keyframe's values across each
// segment of the timeline. solve() is re-run every frame to derive carriage
// position and forces from the interpolated pose, so playback stays
// physically consistent without ever interpolating the carriage directly.

/** @typedef {import('./types.js').Keyframe}    Keyframe */
/** @typedef {import('./types.js').ModelState}  ModelState */

/**
 * Shortest-path angle lerp. Normalizes the delta to [-PI, PI] before scaling.
 */
export function lerpAngles(a, b, t) {
  let delta = b - a
  while (delta > Math.PI) delta -= 2 * Math.PI
  while (delta < -Math.PI) delta += 2 * Math.PI
  return a + delta * t
}

/**
 * Easing on the [0, 1] normalized segment time.
 * 'linear' => identity; 'ease' => smoothstep (3t^2 - 2t^3).
 */
export function easeT(t, ease) {
  const c = Math.max(0, Math.min(1, t))
  if (ease === 'ease') return c * c * (3 - 2 * c)
  return c
}

/**
 * Sum of all segment durations across the keyframe list (the last keyframe's
 * durationToNext is ignored — it's just where playback ends).
 *
 * @param {Keyframe[]} keyframes
 * @returns {number} seconds
 */
export function totalDuration(keyframes) {
  if (keyframes.length < 2) return 0
  let d = 0
  for (let i = 0; i < keyframes.length - 1; i++) {
    d += Math.max(0, keyframes[i].durationToNext)
  }
  return d
}

/**
 * Build the model state at playhead time `tSeconds`. Machine config comes from
 * the from-keyframe (no interpolation), pose is angle-lerped between from and
 * to with the from-keyframe's easing curve.
 *
 * @param {Keyframe[]}  keyframes
 * @param {number}      tSeconds
 * @param {ModelState}  baseModel  used for fields a keyframe does not carry
 * @returns {ModelState}
 */
export function sampleKeyframesAt(keyframes, tSeconds, baseModel) {
  if (keyframes.length === 0) return baseModel
  if (keyframes.length === 1) return applyKeyframeToModel(baseModel, keyframes[0])

  // Find the segment we are in.
  let acc = 0
  let fromIdx = 0
  for (let i = 0; i < keyframes.length - 1; i++) {
    const d = Math.max(0, keyframes[i].durationToNext)
    if (tSeconds <= acc + d || i === keyframes.length - 2) {
      fromIdx = i
      break
    }
    acc += d
  }
  const from = keyframes[fromIdx]
  const to = keyframes[fromIdx + 1] ?? from
  const d = Math.max(1e-9, from.durationToNext)
  const segT = Math.max(0, Math.min(1, (tSeconds - acc) / d))
  const u = easeT(segT, from.ease ?? 'linear')

  // Interpolate angles.
  const angles = {}
  const angleKeys = new Set([
    ...Object.keys(from.angles ?? {}),
    ...Object.keys(to.angles ?? {}),
  ])
  for (const k of angleKeys) {
    const a = from.angles?.[k] ?? 0
    const b = to.angles?.[k] ?? 0
    angles[k] = lerpAngles(a, b, u)
  }

  // Interpolate root.
  const rootPos = {
    x: lerp(from.rootPos.x, to.rootPos.x, u),
    y: lerp(from.rootPos.y, to.rootPos.y, u),
  }

  return {
    ...baseModel,
    reformer: structuredCloneSafe(from.reformer),
    springs: from.springs.map((s) => ({ ...s })),
    attachments: from.attachments.map((a) => ({ ...a })),
    human: { ...baseModel.human, rootPos, angles },
  }
}

function applyKeyframeToModel(baseModel, k) {
  return {
    ...baseModel,
    reformer: structuredCloneSafe(k.reformer),
    springs: k.springs.map((s) => ({ ...s })),
    attachments: k.attachments.map((a) => ({ ...a })),
    human: {
      ...baseModel.human,
      rootPos: { ...k.rootPos },
      angles: { ...k.angles },
    },
  }
}

function lerp(a, b, t) {
  return a + (b - a) * t
}

function structuredCloneSafe(obj) {
  if (typeof structuredClone === 'function') return structuredClone(obj)
  return JSON.parse(JSON.stringify(obj))
}
