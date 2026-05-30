// Unit conversions for the Reformer Force Modeler.
// Internally everything is SI. These helpers exist only for the UI boundary
// (panels accept display units, readouts emit display units).

export const LB_PER_IN_TO_N_PER_M = 175.1268
export const N_PER_LB = 4.4482216152605
export const M_PER_IN = 0.0254
export const G = 9.80665

export function mToCm(m) {
  return m * 100
}

export function cmToM(cm) {
  return cm / 100
}

export function mToIn(m) {
  return m / M_PER_IN
}

export function inToM(inches) {
  return inches * M_PER_IN
}

export function nToLb(n) {
  return n / N_PER_LB
}

export function lbToN(lb) {
  return lb * N_PER_LB
}

export function nPerMToLbPerIn(k) {
  return k / LB_PER_IN_TO_N_PER_M
}

export function lbPerInToNPerM(k) {
  return k * LB_PER_IN_TO_N_PER_M
}

export function radToDeg(rad) {
  return (rad * 180) / Math.PI
}

export function degToRad(deg) {
  return (deg * Math.PI) / 180
}

// Normalize an angle to [-PI, PI].
export function normalizeAngle(rad) {
  let a = rad
  while (a > Math.PI) a -= 2 * Math.PI
  while (a < -Math.PI) a += 2 * Math.PI
  return a
}
