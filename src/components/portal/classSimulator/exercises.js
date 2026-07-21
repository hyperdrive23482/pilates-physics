// Exercise definitions for the Class Simulator.
// Each definition is self-contained: metadata for the header, defaults for
// per-student config, and a compute() that turns (student, cfg) into load
// readouts. Adding a new exercise = adding a definition object here.
//
// Equipment baseline assumed throughout: footbar middle height, gear 1,
// long loops. Variations adjust spring stretch relative to that baseline.

import springSpecs from '../../../data/springSpecs.json'
import { forceForSprings } from '../../../lib/springMath'
import { ANTHRO, segmentWeight, armLength } from './anthropometry'

const reformer = springSpecs.apparatuses.find((a) => a.id === 'reformer')
export const BB_SPRINGS = reformer.brands.find((b) => b.id === 'balanced-body').springs

/** Expand {red: 2, green: 1} counts into a flat spring list for springMath. */
export function expandCounts(counts) {
  const out = []
  for (const spring of BB_SPRINGS) {
    const n = counts?.[spring.color] || 0
    for (let i = 0; i < n; i++) out.push(spring)
  }
  return out
}

/** Short summary like "2 Red + 1 Green" for display. */
export function springSummary(counts) {
  const parts = BB_SPRINGS.filter((s) => (counts?.[s.color] || 0) > 0).map(
    (s) => `${counts[s.color]} ${s.label}`
  )
  return parts.length ? parts.join(' + ') : 'No springs'
}

// Stretch deltas (inches) for equipment variations.
export const FOOTBAR_DELTA = { low: -3, middle: 0, high: 3 }
export const GEAR_DELTA = { 1: 0, 2: -3, 3: -6 }
export const GRIP_OFFSET = { long: 0, short: 4, choked: 11 }

// When an exercise pulls the straps while riding the carriage, the carriage
// travels toward the pulleys as the ropes pay out, so the springs stretch
// half the distance the hands or feet move.
export const STRAP_CARRIAGE_FACTOR = 0.5

export const FOOTBAR_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'middle', label: 'Middle' },
  { value: 'high', label: 'High' },
]
export const GEAR_OPTIONS = [
  { value: 1, label: 'Gear 1' },
  { value: 2, label: 'Gear 2' },
  { value: 3, label: 'Gear 3' },
]
export const GRIP_OPTIONS = [
  { value: 'long', label: 'Long loops' },
  { value: 'short', label: 'Short loops' },
  { value: 'choked', label: 'Choked up' },
]

const round1 = (n) => Math.round(n * 10) / 10

export const EXERCISES = [
  {
    id: 'footwork',
    name: 'Footwork',
    behavior: 'Resistive',
    resistanceType: 'Springs only',
    controls: ['footbar', 'gear'],
    defaultSprings: { red: 2, green: 1 },
    defaults: { footbar: 'middle', gear: 1 },
    toggles: [],
    copy: 'Full press-out distance depends on leg length, so taller students stretch the springs farther and meet a heavier peak load on the same setting. Each gear beyond 1 removes 3 inches of stretch.',
    compute(student, cfg) {
      const springs = expandCounts(cfg.springs)
      const delta = (FOOTBAR_DELTA[cfg.footbar] ?? 0) + (GEAR_DELTA[cfg.gear] ?? 0)
      const xMax = Math.max(0, 0.82 * student.heightIn - 40 + delta)
      return {
        rows: [
          { label: 'Min load', lbs: round1(forceForSprings(springs, 0)), sub: 'carriage home' },
          {
            label: 'Max load',
            lbs: round1(forceForSprings(springs, xMax)),
            sub: `at ${round1(xMax)}" press-out`,
          },
        ],
        bodyRows: [],
        extras: [],
      }
    },
  },
  {
    id: 'bridging',
    name: 'Bridging',
    behavior: 'Supportive',
    resistanceType: 'Springs + body weight',
    controls: [],
    defaultSprings: { red: 2, blue: 1 },
    defaults: {},
    toggles: [],
    copy: 'Springs support the pelvis here, so heavier springs make the lift easier. The work is lifting the thighs, abdomen, and pelvis against gravity.',
    compute(student, cfg) {
      const springs = expandCounts(cfg.springs)
      const bodyLbs = segmentWeight(student, ['thigh', 'thigh', 'abdomen', 'pelvis'])
      return {
        rows: [
          { label: 'Min support', lbs: round1(forceForSprings(springs, 0)), sub: 'carriage home' },
          {
            label: 'Max support',
            lbs: round1(forceForSprings(springs, 3)),
            sub: 'at 3" of stretch',
          },
        ],
        bodyRows: [{ label: 'Lifting', lbs: round1(bodyLbs), sub: 'of body weight' }],
        extras: [],
      }
    },
  },
  {
    id: 'supine-arms-in-straps',
    name: 'Supine Arms in Straps',
    behavior: 'Resistive',
    resistanceType: 'Springs + body weight',
    controls: ['grip'],
    defaultSprings: { red: 1, yellow: 1 },
    defaults: { grip: 'short' },
    toggles: [
      { id: 'abCurl', label: 'Add ab curl' },
      { id: 'legExtension', label: 'Extend legs 30°' },
    ],
    copy: 'Arm length sets the stroke, so longer arms travel farther into the springs, though the carriage rides toward the pulleys as the ropes pay out, so the springs only stretch half the distance the hands move. The leg center of mass sits about 34% down from the hip, so extending the legs lengthens that moment arm and adds work the springs never see.',
    compute(student, cfg) {
      const springs = expandCounts(cfg.springs)
      const offset = GRIP_OFFSET[cfg.grip] ?? 0
      const xMin = offset * STRAP_CARRIAGE_FACTOR
      const xMax = (offset + armLength(student)) * STRAP_CARRIAGE_FACTOR
      const bodyRows = []
      if (cfg.toggles?.abCurl) {
        const seg = ANTHRO[student.gender].seg
        // Ab curl lifts head/neck plus roughly the top third of the ribcage.
        const lbs = student.weightLb * (seg.headNeck + seg.thorax / 3)
        bodyRows.push({ label: 'Holding', lbs: round1(lbs), sub: 'of head, neck and chest' })
      }
      if (cfg.toggles?.legExtension) {
        const lbs = segmentWeight(student, ['leg', 'leg'])
        bodyRows.push({ label: 'Holding', lbs: round1(lbs), sub: 'of legs in the air' })
      }
      return {
        rows: [
          {
            label: 'Min load',
            lbs: round1(forceForSprings(springs, xMin)),
            sub: `arms up, ${round1(xMin)}" pre-stretch`,
          },
          {
            label: 'Max load',
            lbs: round1(forceForSprings(springs, xMax)),
            sub: `full press, ${round1(xMax)}" stretch`,
          },
        ],
        bodyRows,
        extras: [],
      }
    },
  },
  { id: 'serve-a-tray', name: 'Serve a Tray - Seated on Box', placeholder: true },
  { id: 'prone-pulling-straps', name: 'Prone Pulling Straps - Tricep Press', placeholder: true },
  { id: 'reverse-plank', name: 'Reverse Plank - Long Stretch Variation', placeholder: true },
  { id: 'feet-in-straps', name: 'Feet in Straps', placeholder: true },
]
