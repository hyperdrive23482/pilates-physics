// Anthropometric ratios for the side-view stick figure.
//
// v1 uses Drillis & Contini segment-length-as-fraction-of-total-height ratios.
// PLACEHOLDER table: validate against Winter ("Biomechanics and Motor Control
// of Human Movement", 4th ed.) before publishing.
//
// Mass-fraction and COM-fraction columns are populated here for completeness
// (Winter's Table 4.1) but are NOT used by the v1 solver. They live behind the
// PHASE 2 seam and will drive joint-torque calculations when that work lands.

/** @typedef {import('./types.js').BodySegment} BodySegment */

// segmentId -> fraction of total height
// PLACEHOLDER  approximate values; calibrate against your reference.
const LENGTH_FRACTION = {
  trunk: 0.288,      // pelvis to shoulder, midline
  headNeck: 0.130,   // shoulder to top of head
  upperArm: 0.186,   // shoulder to elbow
  forearm: 0.146,    // elbow to wrist
  hand: 0.108,       // wrist to fingertip
  thigh: 0.245,      // hip to knee
  shank: 0.246,      // knee to ankle
  foot: 0.152,       // ankle to toe (sole length, projected)
}

// PHASE 2: Winter mass fractions (segment mass / total body mass).
export const MASS_FRACTIONS = {
  trunk: 0.497,      // head + neck + thorax + lumbar trunk lumped here for v1
  headNeck: 0.081,
  upperArm: 0.028,
  forearm: 0.016,
  hand: 0.006,
  thigh: 0.100,
  shank: 0.0465,
  foot: 0.0145,
}

// PHASE 2: Winter COM fractions, distance from proximal joint as fraction of segment length.
export const COM_FRACTIONS = {
  trunk: 0.50,
  headNeck: 1.00,    // head COM is near the top; placeholder
  upperArm: 0.436,
  forearm: 0.430,
  hand: 0.506,
  thigh: 0.433,
  shank: 0.433,
  foot: 0.50,
}

// Segment chain in dependency order: each segment's parent appears before it.
// Root segments (parentId === null) are anchored at the human's rootPos.
const CHAIN = [
  { id: 'trunk',    parentId: null },
  { id: 'headNeck', parentId: 'trunk' },
  { id: 'upperArm', parentId: 'trunk' },
  { id: 'forearm',  parentId: 'upperArm' },
  { id: 'hand',     parentId: 'forearm' },
  { id: 'thigh',    parentId: null },
  { id: 'shank',    parentId: 'thigh' },
  { id: 'foot',     parentId: 'shank' },
]

/**
 * Build a default BodySegment[] sized by the given total height. The chain
 * order is the order returned. Mass/COM fractions are populated but unused
 * by v1 force calculations (PHASE 2).
 *
 * @param {number} heightMeters
 * @returns {BodySegment[]}
 */
export function scaleFromHeight(heightMeters) {
  return CHAIN.map(({ id, parentId }) => ({
    id,
    parentId,
    length: heightMeters * LENGTH_FRACTION[id],
    massFraction: MASS_FRACTIONS[id], // PHASE 2
    comFraction: COM_FRACTIONS[id],   // PHASE 2
  }))
}
