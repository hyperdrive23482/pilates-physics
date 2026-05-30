// Body editor. Height drives segment lengths via scaleFromHeight. Mass is
// kept as a typed field but not used by v1 force calculations (PHASE 2).

import PanelShell, { FieldRow, UnitInput } from './PanelShell.jsx'
import { useModel, useDispatch } from '../store/ModelContext.jsx'
import { setBodyHeight, setBodyMass } from '../store/actions.js'
import { cmToM, mToCm } from '../../../../lib/reformer/units.js'

const identity = (x) => x

export default function BodyPanel() {
  const model = useModel()
  const dispatch = useDispatch()
  const human = model.human

  return (
    <PanelShell title="Body">
      <FieldRow label="height">
        <UnitInput
          valueSI={human.heightM}
          suffix="cm"
          step={1}
          min={80}
          max={250}
          toDisplay={mToCm}
          fromDisplay={cmToM}
          onChangeSI={(v) => dispatch(setBodyHeight(v))}
        />
      </FieldRow>
      <FieldRow label="mass" note="phase 2">
        <UnitInput
          valueSI={human.bodyMass}
          suffix="kg"
          step={1}
          min={20}
          max={200}
          toDisplay={identity}
          fromDisplay={identity}
          onChangeSI={(v) => dispatch(setBodyMass(v))}
        />
      </FieldRow>
      <p
        style={{
          margin: '0.5rem 0 0',
          fontFamily: 'var(--font-serif)',
          fontSize: '0.78rem',
          color: 'var(--color-ink-muted)',
          lineHeight: 1.5,
        }}
      >
        Drag the pelvis (orange dot) to translate. Drag any joint to rotate that limb
        rigidly about its proximal anchor.
      </p>
    </PanelShell>
  )
}
