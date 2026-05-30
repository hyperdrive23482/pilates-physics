// Default model state for the Reformer Force Modeler.
//
// Everything below is a PLACEHOLDER. The user must calibrate against their own
// measured reformer and spring data before any number here should be taken
// seriously. The README enumerates every value that needs replacing.
//
// Values are AUTHORED in display units (cm, lb/in, lb) and STORED in SI
// (m, N/m, N) so the rest of the codebase only ever sees SI.

import { cmToM, lbPerInToNPerM, G } from './units.js'
import { scaleFromHeight } from './anthropometry.js'

// ---------- Reformer ----------
// World origin: head end of the frame at floor level. +x toward the foot /
// spring end. +y up. See types.js for the convention block.
export const DEFAULT_REFORMER = {
  frameLength: cmToM(240),         // PLACEHOLDER  typical reformer ~240 cm
  frameHeight: cmToM(40),          // PLACEHOLDER  rail height above floor
  carriageLength: cmToM(75),       // PLACEHOLDER
  carriageRestX: cmToM(210),       // PLACEHOLDER  spring-end of carriage at rest
  carriageMinX: cmToM(155),        // PLACEHOLDER  most-stretched travel limit
  carriageMaxX: cmToM(235),        // PLACEHOLDER  slack-side travel limit
  footbar: { x: cmToM(240), y: cmToM(65) },         // PLACEHOLDER  vertical bar at the foot end
  springAnchor: { x: cmToM(240), y: cmToM(40) },    // PLACEHOLDER  fixed spring end
  carriageSpringY: cmToM(40),      // PLACEHOLDER  y of the spring attach point on the carriage
  routes: [
    // PLACEHOLDER pulleys at the head end of the frame (risers).
    // In 2D side view both ropes superimpose; the second is offset visually only.
    { id: 'rope-L', pulley: { x: cmToM(0), y: cmToM(95) }, mechanicalAdvantage: 1 },
    { id: 'rope-R', pulley: { x: cmToM(0), y: cmToM(95) }, mechanicalAdvantage: 1 },
  ],
}

// ---------- Springs ----------
// Balanced Body color set. Stiffness values are derived from the linear
// F(x) = k*x + b model used elsewhere in this app (springSpecs.json:
// yellow 0.333 lb/in, blue 0.667, red 1.000, green 1.167), converted with
// 1 lb/in = 175.1268 N/m. freeLength is a PLACEHOLDER; the calculator's "b"
// preload depends on operating geometry that this modeler does not yet pin
// down, so calibrate freeLength against your own measured spring set.
export const DEFAULT_SPRINGS = [
  {
    id: 'spring-yellow-1',
    color: 'yellow',
    displayColor: '#E8C547',
    stiffness: lbPerInToNPerM(0.33333), // PLACEHOLDER
    freeLength: cmToM(20),              // PLACEHOLDER
    attached: false,
  },
  {
    id: 'spring-blue-1',
    color: 'blue',
    displayColor: '#3E7BC7',
    stiffness: lbPerInToNPerM(0.66667), // PLACEHOLDER
    freeLength: cmToM(20),              // PLACEHOLDER
    attached: true,
  },
  {
    id: 'spring-red-1',
    color: 'red',
    displayColor: '#C73E3E',
    stiffness: lbPerInToNPerM(1.0),     // PLACEHOLDER
    freeLength: cmToM(20),              // PLACEHOLDER
    attached: true,
  },
  {
    id: 'spring-green-1',
    color: 'green',
    displayColor: '#5FA85E',
    stiffness: lbPerInToNPerM(1.16667), // PLACEHOLDER
    freeLength: cmToM(20),              // PLACEHOLDER
    attached: false,
  },
]

// ---------- Body ----------
export const DEFAULT_BODY_HEIGHT_M = cmToM(165)  // PLACEHOLDER
export const DEFAULT_BODY_MASS_KG = 65           // PLACEHOLDER  PHASE 2

/**
 * Default human pose: lying supine on the carriage with thighs vertical
 * (a starting-feet-in-straps tabletop-ish pose). World angles are measured
 * from the +x axis (toward the foot / spring end). PI = -x = head end.
 */
function makeDefaultHuman(carriageX) {
  const segments = scaleFromHeight(DEFAULT_BODY_HEIGHT_M)
  // Pelvis sits on the carriage top, near the spring-end of the carriage so
  // the legs reach the head-end pulleys naturally. PLACEHOLDER offsets.
  const pelvisOnCarriage = {
    x: carriageX - DEFAULT_REFORMER.carriageLength * 0.35,
    y: DEFAULT_REFORMER.frameHeight + cmToM(8), // carriage thickness ~8 cm
  }
  const ANG = {
    trunk: Math.PI,        // toward head end (-x)
    headNeck: Math.PI,
    upperArm: Math.PI,     // arms along body toward head
    forearm: Math.PI,
    hand: Math.PI,
    thigh: Math.PI / 2,    // vertical (up)
    shank: Math.PI / 2,    // also up, knees extended overhead (placeholder pose)
    foot: Math.PI / 2,
  }
  return {
    heightM: DEFAULT_BODY_HEIGHT_M,
    bodyMass: DEFAULT_BODY_MASS_KG,
    rootPos: pelvisOnCarriage,
    segments,
    angles: ANG,
    loads: [], // PLACEHOLDER  populate to decompose external hand-held loads
  }
}

// ---------- Ropes & attachments ----------
const DEFAULT_ROPES = [
  // PLACEHOLDER  typical reformer rope ~150 cm long
  { id: 'rope-L', totalLength: cmToM(150), carriageEnd: 'carriage', handId: 'toeTip' },
  { id: 'rope-R', totalLength: cmToM(150), carriageEnd: 'carriage', handId: 'toeTip' },
]

const DEFAULT_ATTACHMENTS = [
  { endId: 'toeTip',  mode: 'pinnedToRopeEnd', ropeId: 'rope-L', framePoint: null },
  { endId: 'handTip', mode: 'free',            ropeId: null,     framePoint: null },
]

// ---------- Top-level factories ----------
/**
 * Build a fresh ModelState from the placeholder defaults above.
 * @returns {import('./types.js').ModelState}
 */
export function makeInitialModel() {
  const reformer = structuredCloneSafe(DEFAULT_REFORMER)
  const springs = DEFAULT_SPRINGS.map((s) => ({ ...s }))
  const human = makeDefaultHuman(reformer.carriageRestX)
  const ropes = DEFAULT_ROPES.map((r) => ({ ...r }))
  const attachments = DEFAULT_ATTACHMENTS.map((a) => ({ ...a }))
  return {
    reformer,
    springs,
    human,
    ropes,
    attachments,
    carriageSeedX: reformer.carriageRestX,
  }
}

// structuredClone is widely available but we keep a fallback for older runtimes.
function structuredCloneSafe(obj) {
  if (typeof structuredClone === 'function') return structuredClone(obj)
  return JSON.parse(JSON.stringify(obj))
}

// Display-only body weight in newtons (PHASE 2 readout).
export function bodyWeightN(bodyMass) {
  return bodyMass * G
}
