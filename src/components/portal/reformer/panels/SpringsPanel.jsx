// Springs editor. Each row toggles a spring on/off and lets the user edit
// stiffness (lb/in) and free length (cm). Values are stored in SI.

import PanelShell, { FieldRow, UnitInput } from './PanelShell.jsx'
import { panelInputStyle } from './panelStyles.js'
import { useModel, useDispatch } from '../store/ModelContext.jsx'
import { toggleSpring, setSpringField } from '../store/actions.js'
import {
  cmToM, mToCm,
  lbPerInToNPerM, nPerMToLbPerIn,
} from '../../../../lib/reformer/units.js'

export default function SpringsPanel() {
  const model = useModel()
  const dispatch = useDispatch()
  return (
    <PanelShell title="Springs">
      {model.springs.map((sp) => (
        <div
          key={sp.id}
          style={{
            padding: '0.55rem 0.6rem',
            marginBottom: 6,
            background: 'var(--color-surface-raised)',
            border: '1px solid var(--color-rule)',
            borderLeft: `3px solid ${sp.displayColor}`,
            opacity: sp.attached ? 1 : 0.65,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <label
              style={{
                display: 'inline-flex',
                gap: '0.45rem',
                alignItems: 'center',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.78rem',
                color: 'var(--color-ink)',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={sp.attached}
                onChange={() => dispatch(toggleSpring(sp.id))}
                style={{ accentColor: 'var(--color-accent)' }}
              />
              {sp.color}
            </label>
            <input
              type="text"
              value={sp.id}
              disabled
              style={{
                ...panelInputStyle,
                width: 120,
                color: 'var(--color-ink-dim)',
                background: 'transparent',
                border: 'none',
                textAlign: 'right',
                padding: 0,
              }}
            />
          </div>
          <FieldRow label="stiffness">
            <UnitInput
              valueSI={sp.stiffness}
              suffix="lb/in"
              step={0.01}
              min={0}
              toDisplay={nPerMToLbPerIn}
              fromDisplay={lbPerInToNPerM}
              onChangeSI={(v) => dispatch(setSpringField(sp.id, 'stiffness', v))}
            />
          </FieldRow>
          <FieldRow label="free length">
            <UnitInput
              valueSI={sp.freeLength}
              suffix="cm"
              step={0.5}
              min={0}
              toDisplay={mToCm}
              fromDisplay={cmToM}
              onChangeSI={(v) => dispatch(setSpringField(sp.id, 'freeLength', v))}
            />
          </FieldRow>
        </div>
      ))}
    </PanelShell>
  )
}
