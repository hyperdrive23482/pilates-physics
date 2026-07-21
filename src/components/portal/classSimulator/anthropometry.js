// Anthropometric tables for the Class Simulator.
// Segment weights are fractions of total body weight (Winter-style tables,
// values supplied by Kaleen). Lengths scale linearly with the student's
// height relative to the gender average.

export const ANTHRO = {
  woman: {
    label: 'Woman',
    avgHeightIn: 64,
    avgArmIn: 27, // functional grip reach
    elbowToFistFrac: 0.48, // fraction of arm length
    avgLegIn: 33, // buttock height
    headNeckLenFrac: 0.18, // fraction of height
    sternumLenFrac: 0.1, // fraction of height
    seg: {
      headNeck: 0.082,
      arm: 0.0497, // single arm
      trunk: 0.532,
      thorax: 0.1702,
      abdomen: 0.1224,
      pelvis: 0.1596,
      leg: 0.1843, // single leg
      thigh: 0.1175,
      lowerLeg: 0.0535,
      foot: 0.0133,
    },
  },
  man: {
    label: 'Man',
    avgHeightIn: 69,
    avgArmIn: 30,
    elbowToFistFrac: 0.47,
    avgLegIn: 35,
    headNeckLenFrac: 0.18,
    sternumLenFrac: 0.11,
    seg: {
      headNeck: 0.0826,
      arm: 0.0577,
      trunk: 0.4682,
      thorax: 0.201,
      abdomen: 0.1306,
      pelvis: 0.1366,
      leg: 0.1668,
      thigh: 0.105,
      lowerLeg: 0.0475,
      foot: 0.0143,
    },
  },
}

/**
 * Combined weight (lbs) of the named segments for a student.
 * Repeat a key to count it twice (e.g. both thighs: ['thigh', 'thigh']).
 */
export function segmentWeight(student, keys) {
  const table = ANTHRO[student.gender]
  const frac = keys.reduce((sum, key) => sum + table.seg[key], 0)
  return frac * student.weightLb
}

/** Arm length (functional grip reach, inches), scaled with height. */
export function armLength(student) {
  const table = ANTHRO[student.gender]
  return student.heightIn * (table.avgArmIn / table.avgHeightIn)
}

/** Leg length (buttock height, inches), scaled with height. */
export function legLength(student) {
  const table = ANTHRO[student.gender]
  return student.heightIn * (table.avgLegIn / table.avgHeightIn)
}
