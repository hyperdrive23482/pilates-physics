// 2D vector helpers. All values are plain { x, y } objects in world meters
// (or in SVG pixels at the rendering boundary).

/** @typedef {import('./types.js').Vec2} Vec2 */

export function v(x, y) {
  return { x, y }
}

export function add(a, b) {
  return { x: a.x + b.x, y: a.y + b.y }
}

export function sub(a, b) {
  return { x: a.x - b.x, y: a.y - b.y }
}

export function scale(a, s) {
  return { x: a.x * s, y: a.y * s }
}

export function dot(a, b) {
  return a.x * b.x + a.y * b.y
}

export function length(a) {
  return Math.hypot(a.x, a.y)
}

export function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

export function norm(a) {
  const len = length(a)
  if (len < 1e-12) return { x: 0, y: 0 }
  return { x: a.x / len, y: a.y / len }
}

export function angleOf(a) {
  return Math.atan2(a.y, a.x)
}

// Endpoint of a segment of given length anchored at origin and pointing along angle rad.
export function fromAngle(angleRad, len) {
  return { x: Math.cos(angleRad) * len, y: Math.sin(angleRad) * len }
}

// Clamp the components of a vector to a box.
export function clampV(p, minX, maxX, minY, maxY) {
  return {
    x: Math.min(maxX, Math.max(minX, p.x)),
    y: Math.min(maxY, Math.max(minY, p.y)),
  }
}
