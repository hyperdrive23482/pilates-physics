// Spring force model: tension-only, linear-Hookean, parallel sum.
//
// A spring's currentLength is the straight-line distance between its fixed
// anchor on the frame and its attach point on the carriage. When that distance
// exceeds the spring's freeLength the spring is in tension; when it doesn't,
// the spring is slack and contributes zero force. Real Pilates springs only
// pull, never push, so this matches reality.

/** @typedef {import('./types.js').Spring} Spring */
/** @typedef {import('./types.js').SpringResult} SpringResult */

/**
 * Extension of a spring (m). Always non-negative: a "compressed" spring is slack.
 *
 * @param {number} currentLength m
 * @param {number} freeLength    m
 * @returns {number} m
 */
export function springStretch(currentLength, freeLength) {
  return Math.max(0, currentLength - freeLength)
}

/**
 * Tension of a single spring at the given current length.
 *
 * @param {Spring} spring
 * @param {number} currentLength m
 * @returns {number} N, >= 0
 */
export function springForce(spring, currentLength) {
  if (!spring.attached) return 0
  return spring.stiffness * springStretch(currentLength, spring.freeLength)
}

/**
 * Sum of tensions across all attached springs at the given current length.
 * In a real reformer every engaged spring stretches the same amount (they all
 * span the same anchor-to-carriage span), so they add in parallel.
 *
 * @param {Spring[]} springs
 * @param {number}   currentLength m
 * @returns {{ total: number, perSpring: SpringResult[] }}  total N, per-spring detail
 */
export function totalSpringForce(springs, currentLength) {
  let total = 0
  const perSpring = []
  for (const s of springs) {
    const stretch = s.attached ? springStretch(currentLength, s.freeLength) : 0
    const tension = s.attached ? s.stiffness * stretch : 0
    total += tension
    perSpring.push({ id: s.id, stretch, tension })
  }
  return { total, perSpring }
}
