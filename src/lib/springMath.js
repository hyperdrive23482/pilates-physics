// Pure math helpers for the Spring Load Calculator.
// Each spring is modeled as a linear force: F(x) = k * x + b.
// When multiple springs are engaged in parallel (a common Pilates setup),
// their constants sum: k_total = Σ k_i, b_total = Σ b_i.

/**
 * Expand selected spring rows (each with a quantity) into a flat list
 * of individual spring instances. Each instance is a {k, b, ...} object.
 */
export function expandSelections(selections) {
  const out = []
  for (const sel of selections) {
    const qty = Math.max(1, Math.floor(sel.quantity || 1))
    for (let i = 0; i < qty; i++) {
      out.push(sel.spring)
    }
  }
  return out
}

/** Sum of k and b across a flat array of springs. */
export function combinedConstants(springs) {
  let k = 0
  let b = 0
  for (const s of springs) {
    k += s.k
    b += s.b
  }
  return { k, b }
}

/** Force at extension x (inches) for a flat list of springs engaged in parallel. */
export function forceForSprings(springs, x) {
  const { k, b } = combinedConstants(springs)
  return k * x + b
}

/** Force for a single selection row (one color x quantity). */
export function forceForSelection(selection, x) {
  const qty = Math.max(1, Math.floor(selection.quantity || 1))
  return qty * (selection.spring.k * x + selection.spring.b)
}

/**
 * Peak force for a group of springs across the domain [0, maxTravel],
 * used to auto-scale the Y-axis.
 */
export function peakForceForSprings(springs, maxTravel) {
  return forceForSprings(springs, maxTravel)
}

/** Unique id for a selection row (brand + color), used for React keys. */
export function selectionKey(selection) {
  return `${selection.brandId}:${selection.spring.color}`
}
