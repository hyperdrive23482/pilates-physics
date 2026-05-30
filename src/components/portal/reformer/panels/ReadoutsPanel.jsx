// Wraps ReadoutTable in a PanelShell for consistent styling alongside the
// other panels.

import PanelShell from './PanelShell.jsx'
import ReadoutTable from './ReadoutTable.jsx'

/** @typedef {import('../../../../lib/reformer/types.js').DerivedState} DerivedState */
/** @typedef {import('../../../../lib/reformer/types.js').Spring} Spring */

/**
 * @param {{ derived: DerivedState, springs: Spring[] }} props
 */
export default function ReadoutsPanel({ derived, springs }) {
  return (
    <PanelShell title="Readouts">
      <ReadoutTable derived={derived} springs={springs} />
    </PanelShell>
  )
}
