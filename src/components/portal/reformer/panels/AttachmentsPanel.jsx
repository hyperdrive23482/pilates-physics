// Attachments editor. For each endpoint joint (handTip, toeTip) pick a mode
// and, depending on mode, the rope or frame point it pins to.

import PanelShell, { FieldRow } from './PanelShell.jsx'
import { panelInputStyle } from './panelStyles.js'
import { useModel, useDispatch } from '../store/ModelContext.jsx'
import { setAttachment } from '../store/actions.js'

const ENDPOINTS = ['handTip', 'toeTip']
const FRAME_POINTS = [
  { id: 'footbar', label: 'footbar' },
  { id: 'shoulderRest', label: 'shoulder rest (placeholder)' },
  { id: 'carriageEdge', label: 'carriage edge' },
]

export default function AttachmentsPanel() {
  const model = useModel()
  const dispatch = useDispatch()

  return (
    <PanelShell title="Attachments">
      {ENDPOINTS.map((endId) => {
        const att =
          model.attachments.find((a) => a.endId === endId) ??
          { endId, mode: 'free', ropeId: null, framePoint: null }
        return (
          <div
            key={endId}
            style={{
              padding: '0.55rem 0.6rem',
              marginBottom: 6,
              background: 'var(--color-surface-raised)',
              border: '1px solid var(--color-rule)',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.78rem',
                color: 'var(--color-ink)',
                marginBottom: 6,
              }}
            >
              {endId}
            </div>
            <FieldRow label="mode">
              <select
                value={att.mode}
                onChange={(e) =>
                  dispatch(
                    setAttachment(endId, {
                      mode: e.target.value,
                      ropeId: e.target.value === 'pinnedToRopeEnd' ? att.ropeId ?? model.ropes[0]?.id ?? null : null,
                      framePoint: e.target.value === 'pinnedToFrame' ? att.framePoint ?? FRAME_POINTS[0].id : null,
                    }),
                  )
                }
                style={panelInputStyle}
              >
                <option value="free">free</option>
                <option value="pinnedToRopeEnd">pinned to rope end</option>
                <option value="pinnedToFrame">pinned to frame</option>
              </select>
            </FieldRow>
            {att.mode === 'pinnedToRopeEnd' && (
              <FieldRow label="rope">
                <select
                  value={att.ropeId ?? ''}
                  onChange={(e) => dispatch(setAttachment(endId, { ropeId: e.target.value }))}
                  style={panelInputStyle}
                >
                  {model.ropes.map((r) => (
                    <option key={r.id} value={r.id}>{r.id}</option>
                  ))}
                </select>
              </FieldRow>
            )}
            {att.mode === 'pinnedToFrame' && (
              <FieldRow label="point">
                <select
                  value={att.framePoint ?? ''}
                  onChange={(e) => dispatch(setAttachment(endId, { framePoint: e.target.value }))}
                  style={panelInputStyle}
                >
                  {FRAME_POINTS.map((p) => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
                </select>
              </FieldRow>
            )}
          </div>
        )
      })}
    </PanelShell>
  )
}
