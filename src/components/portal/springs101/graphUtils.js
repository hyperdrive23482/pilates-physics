// Shared graph helpers for the Springs 101 lineup charts. Mirrors the
// conventions in SpringLoadCalculator.jsx: all spring data is stored in
// lb and lb/in, and units are a display-only concern.

export const LB_TO_KG = 0.45359237
export const IN_TO_CM = 2.54

export const UNITS = {
  imperial: { force: 'lbs', length: 'inches', perLength: 'lb per inch' },
  metric: { force: 'kg', length: 'cm', perLength: 'kg per cm' },
}

export const UNIT_OPTIONS = [
  { value: 'imperial', label: 'lbs · in' },
  { value: 'metric', label: 'kg · cm' },
]

/** Convert a force in lbs to the active unit's number. */
export function forceValue(lbs, unit) {
  return unit === 'metric' ? lbs * LB_TO_KG : lbs
}

/** Convert an extension in inches to the active unit's number. */
export function lengthValue(inches, unit) {
  return unit === 'metric' ? inches * IN_TO_CM : inches
}

/** Convert a rate in lb/in to the active unit's number (kg/cm when metric). */
export function rateValue(lbPerIn, unit) {
  return unit === 'metric' ? (lbPerIn * LB_TO_KG) / IN_TO_CM : lbPerIn
}

/** Round a peak force in lbs up to a clean axis maximum. */
export function niceMaxForce(peak) {
  if (peak <= 0) return 20
  const steps = [10, 20, 40, 60, 80, 100, 120, 160, 200, 260, 320, 400, 500]
  for (const s of steps) if (peak * 1.1 <= s) return s
  return Math.ceil((peak * 1.1) / 100) * 100
}

/** Relative luminance (0-255 scale) of a #rrggbb color. */
export function luminance(hex) {
  const n = parseInt(hex.slice(1), 16)
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const b = n & 255
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** Evenly spaced y-axis tick values (in lbs) for a given axis maximum. */
export function ticksForMax(maxForce) {
  const count = 5
  const step = maxForce / count
  const out = []
  for (let i = 0; i <= count; i++) out.push(Math.round(i * step))
  return out
}
