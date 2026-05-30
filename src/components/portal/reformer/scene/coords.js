// World <-> SVG coordinate mapping for the Reformer Force Modeler scene.
//
// World: meters, +x toward foot/spring end, +y up. SVG: y-down.
// We pick a fixed SVG viewBox and a fixed world-units-per-SVG-unit scale that
// comfortably accommodates a typical reformer (240 cm long, ~95 cm riser).
// Auto-fit can be added later (PLACEHOLDER scaling for now).

export const SCALE = 380          // PLACEHOLDER  SVG units per world meter
export const VB_W = 1200          // viewBox width
export const VB_H = 620           // viewBox height

// World origin in SVG coords. World x=0 sits a little in from the left edge;
// world y=0 sits near the bottom so the reformer rail line draws above it.
const ORIGIN_SVG_X = 120
const ORIGIN_SVG_Y = VB_H - 70

/** @typedef {import('../../../../lib/reformer/types.js').Vec2} Vec2 */

/**
 * Convert a world point to SVG coordinates.
 * @param {Vec2} p world meters
 * @returns {Vec2} SVG units
 */
export function worldToSvg(p) {
  return {
    x: ORIGIN_SVG_X + p.x * SCALE,
    y: ORIGIN_SVG_Y - p.y * SCALE,
  }
}

/**
 * Convert SVG coordinates back to world meters.
 * @param {Vec2} p SVG units
 * @returns {Vec2} world meters
 */
export function svgToWorld(p) {
  return {
    x: (p.x - ORIGIN_SVG_X) / SCALE,
    y: (ORIGIN_SVG_Y - p.y) / SCALE,
  }
}

/**
 * Convert a client-pixel point (from a pointer event) to SVG coords using
 * the <svg>'s on-screen bounding rect. Same technique as
 * SpringLoadCalculator.getNormPos.
 *
 * @param {SVGSVGElement} svg
 * @param {number} clientX
 * @param {number} clientY
 * @returns {Vec2}  SVG-viewBox coords
 */
export function clientToSvg(svg, clientX, clientY) {
  const rect = svg.getBoundingClientRect()
  return {
    x: ((clientX - rect.left) / rect.width) * VB_W,
    y: ((clientY - rect.top) / rect.height) * VB_H,
  }
}

/** Pixel length of a world distance, useful for force-arrow scaling. */
export function worldLengthToSvg(meters) {
  return meters * SCALE
}

// PLACEHOLDER  Force arrows: SVG pixels per newton.
// Tune so a typical reformer pull (e.g. 200 N) draws at ~100 SVG units.
export const FORCE_PX_PER_N = 0.5
// Clamp the visible arrow length so a huge force does not bleed off the canvas.
export const FORCE_MAX_PX = 220
export const FORCE_MIN_VISIBLE_N = 0.5
