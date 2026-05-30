// Reformer geometry editor. All inputs are in display units (cm) but the
// reducer stores SI.

import PanelShell, { FieldRow, UnitInput } from './PanelShell.jsx'
import { useModel, useDispatch } from '../store/ModelContext.jsx'
import { setReformerField, setRouteField, setRopeField } from '../store/actions.js'
import { cmToM, mToCm } from '../../../../lib/reformer/units.js'

export default function MachinePanel() {
  const model = useModel()
  const dispatch = useDispatch()
  const r = model.reformer

  const setField = (field, valueSI) => dispatch(setReformerField(field, valueSI))
  const setVecField = (field, axis, valueSI) =>
    dispatch(setReformerField(field, { ...r[field], [axis]: valueSI }))

  return (
    <PanelShell title="Machine">
      <FieldRow label="frame length">
        <UnitInput valueSI={r.frameLength} suffix="cm" step={1} toDisplay={mToCm} fromDisplay={cmToM}
          onChangeSI={(v) => setField('frameLength', v)} />
      </FieldRow>
      <FieldRow label="rail height">
        <UnitInput valueSI={r.frameHeight} suffix="cm" step={1} toDisplay={mToCm} fromDisplay={cmToM}
          onChangeSI={(v) => setField('frameHeight', v)} />
      </FieldRow>
      <FieldRow label="carriage length">
        <UnitInput valueSI={r.carriageLength} suffix="cm" step={1} toDisplay={mToCm} fromDisplay={cmToM}
          onChangeSI={(v) => setField('carriageLength', v)} />
      </FieldRow>
      <FieldRow label="carriage rest">
        <UnitInput valueSI={r.carriageRestX} suffix="cm" step={1} toDisplay={mToCm} fromDisplay={cmToM}
          onChangeSI={(v) => setField('carriageRestX', v)} />
      </FieldRow>
      <FieldRow label="travel min">
        <UnitInput valueSI={r.carriageMinX} suffix="cm" step={1} toDisplay={mToCm} fromDisplay={cmToM}
          onChangeSI={(v) => setField('carriageMinX', v)} />
      </FieldRow>
      <FieldRow label="travel max">
        <UnitInput valueSI={r.carriageMaxX} suffix="cm" step={1} toDisplay={mToCm} fromDisplay={cmToM}
          onChangeSI={(v) => setField('carriageMaxX', v)} />
      </FieldRow>
      <FieldRow label="footbar x">
        <UnitInput valueSI={r.footbar.x} suffix="cm" step={1} toDisplay={mToCm} fromDisplay={cmToM}
          onChangeSI={(v) => setVecField('footbar', 'x', v)} />
      </FieldRow>
      <FieldRow label="footbar y">
        <UnitInput valueSI={r.footbar.y} suffix="cm" step={1} toDisplay={mToCm} fromDisplay={cmToM}
          onChangeSI={(v) => setVecField('footbar', 'y', v)} />
      </FieldRow>
      <FieldRow label="spring anchor x">
        <UnitInput valueSI={r.springAnchor.x} suffix="cm" step={1} toDisplay={mToCm} fromDisplay={cmToM}
          onChangeSI={(v) => setVecField('springAnchor', 'x', v)} />
      </FieldRow>
      <FieldRow label="spring anchor y">
        <UnitInput valueSI={r.springAnchor.y} suffix="cm" step={1} toDisplay={mToCm} fromDisplay={cmToM}
          onChangeSI={(v) => setVecField('springAnchor', 'y', v)} />
      </FieldRow>

      <div style={{ height: 8 }} />
      <FieldRow label="routes" note="pulleys"><span /></FieldRow>
      {r.routes.map((route) => (
        <div key={route.id} style={{ marginBottom: 6, paddingLeft: 8, borderLeft: '2px solid var(--color-rule)' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--color-ink-muted)', padding: '2px 0' }}>
            {route.id}
          </div>
          <FieldRow label="pulley x">
            <UnitInput valueSI={route.pulley.x} suffix="cm" step={1} toDisplay={mToCm} fromDisplay={cmToM}
              onChangeSI={(v) => dispatch(setRouteField(route.id, 'pulley', { ...route.pulley, x: v }))} />
          </FieldRow>
          <FieldRow label="pulley y">
            <UnitInput valueSI={route.pulley.y} suffix="cm" step={1} toDisplay={mToCm} fromDisplay={cmToM}
              onChangeSI={(v) => dispatch(setRouteField(route.id, 'pulley', { ...route.pulley, y: v }))} />
          </FieldRow>
          <FieldRow label="mech adv">
            <input
              type="number"
              min={1}
              max={3}
              step={1}
              value={route.mechanicalAdvantage}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10)
                if (Number.isFinite(v)) dispatch(setRouteField(route.id, 'mechanicalAdvantage', v))
              }}
              style={{
                width: '100%',
                padding: '0.4rem 0.55rem',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.78rem',
                background: 'var(--color-bg)',
                border: '1px solid var(--color-rule)',
                color: 'var(--color-ink)',
                outline: 'none',
                borderRadius: '2px',
                boxSizing: 'border-box',
              }}
            />
          </FieldRow>
        </div>
      ))}

      <div style={{ height: 8 }} />
      <FieldRow label="ropes" note="length"><span /></FieldRow>
      {model.ropes.map((rope) => (
        <FieldRow key={rope.id} label={rope.id}>
          <UnitInput valueSI={rope.totalLength} suffix="cm" step={1} toDisplay={mToCm} fromDisplay={cmToM}
            onChangeSI={(v) => dispatch(setRopeField(rope.id, 'totalLength', v))} />
        </FieldRow>
      ))}
    </PanelShell>
  )
}
