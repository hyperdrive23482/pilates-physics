// Timeline panel: keyframe list, scrubber, play/pause, add/delete/reorder.

import PanelShell, { FieldRow } from './PanelShell.jsx'
import { panelInputStyle } from './panelStyles.js'
import { useProject, useDispatch } from '../store/ModelContext.jsx'
import {
  addKeyframe, applyKeyframe, deleteKeyframe, reorderKeyframe, updateKeyframe, setFps,
} from '../store/actions.js'
import { totalDuration } from '../../../../lib/reformer/interp.js'

/** @typedef {{ playing:boolean, t:number, duration:number, play:Function, pause:Function, seek:Function }} PlaybackApi */

/**
 * @param {{ playback: PlaybackApi, onExportCsv: ()=>void, onExportJson: ()=>void, onSaveProject: ()=>void, onLoadProject: ()=>void }} props
 */
export default function TimelinePanel({ playback, onExportCsv, onExportJson, onSaveProject, onLoadProject }) {
  const project = useProject()
  const dispatch = useDispatch()
  const dur = totalDuration(project.keyframes)

  return (
    <PanelShell
      title="Timeline"
      action={
        <button
          type="button"
          onClick={() => dispatch(addKeyframe())}
          style={smallBtn}
          aria-label="Add keyframe at current pose"
        >
          + key
        </button>
      }
    >
      {project.keyframes.length === 0 && (
        <p style={{ fontFamily: 'var(--font-serif)', fontSize: '0.78rem', color: 'var(--color-ink-muted)', margin: '0.25rem 0 0.5rem' }}>
          Pose the figure then press <strong>+ key</strong> to snapshot it as a keyframe.
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: '0.5rem' }}>
        {project.keyframes.map((k, idx) => (
          <div
            key={k.id}
            style={{
              display: 'grid',
              gridTemplateColumns: '24px 1fr 70px 70px auto',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.35rem 0.45rem',
              background: project.ui.activeKeyframeId === k.id ? 'var(--color-surface-raised)' : 'transparent',
              border: '1px solid var(--color-rule)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.72rem',
            }}
          >
            <span style={{ color: 'var(--color-ink-dim)' }}>{idx + 1}</span>
            <button
              type="button"
              onClick={() => dispatch(applyKeyframe(k.id))}
              style={{ ...smallBtn, padding: '0.25rem 0.4rem', justifyContent: 'flex-start', flex: 1 }}
            >
              apply
            </button>
            <input
              type="number"
              value={k.durationToNext}
              step={0.1}
              min={0}
              onChange={(e) => {
                const v = parseFloat(e.target.value)
                if (Number.isFinite(v)) dispatch(updateKeyframe(k.id, { durationToNext: v }))
              }}
              style={{ ...panelInputStyle, padding: '0.25rem 0.4rem' }}
              aria-label={`Duration to next, keyframe ${idx + 1}`}
              title="seconds to next keyframe"
            />
            <select
              value={k.ease}
              onChange={(e) => dispatch(updateKeyframe(k.id, { ease: e.target.value }))}
              style={{ ...panelInputStyle, padding: '0.25rem 0.4rem' }}
            >
              <option value="linear">linear</option>
              <option value="ease">ease</option>
            </select>
            <span style={{ display: 'inline-flex', gap: 2 }}>
              <button type="button" disabled={idx === 0} onClick={() => dispatch(reorderKeyframe(idx, idx - 1))} style={iconBtn} aria-label="Move up">↑</button>
              <button type="button" disabled={idx === project.keyframes.length - 1} onClick={() => dispatch(reorderKeyframe(idx, idx + 1))} style={iconBtn} aria-label="Move down">↓</button>
              <button type="button" onClick={() => dispatch(deleteKeyframe(k.id))} style={iconBtn} aria-label="Delete">×</button>
            </span>
          </div>
        ))}
      </div>

      <FieldRow label="playhead">
        <input
          type="range"
          min={0}
          max={Math.max(0.0001, dur)}
          step={0.01}
          value={playback.t}
          onChange={(e) => playback.seek(parseFloat(e.target.value))}
          disabled={dur <= 0}
          style={{ width: '100%' }}
          aria-label="Playback time"
        />
      </FieldRow>
      <FieldRow label="t / total">
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--color-ink)' }}>
          {playback.t.toFixed(2)} / {dur.toFixed(2)} s
        </span>
      </FieldRow>
      <FieldRow label="fps" note="export">
        <input
          type="number"
          min={1}
          max={120}
          value={project.ui.fps}
          onChange={(e) => {
            const v = parseInt(e.target.value, 10)
            if (Number.isFinite(v)) dispatch(setFps(v))
          }}
          style={panelInputStyle}
        />
      </FieldRow>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: '0.6rem' }}>
        <button type="button" onClick={playback.playing ? playback.pause : playback.play} style={primaryBtn} disabled={dur <= 0}>
          {playback.playing ? 'pause' : 'play'}
        </button>
        <button type="button" onClick={() => playback.seek(0)} style={smallBtn}>reset</button>
        <button type="button" onClick={onExportCsv} style={smallBtn} disabled={project.keyframes.length < 2}>csv</button>
        <button type="button" onClick={onExportJson} style={smallBtn} disabled={project.keyframes.length < 2}>json</button>
        <button type="button" onClick={onSaveProject} style={smallBtn}>save</button>
        <button type="button" onClick={onLoadProject} style={smallBtn}>load</button>
      </div>
    </PanelShell>
  )
}

const smallBtn = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0.35rem 0.6rem',
  fontFamily: 'var(--font-mono)',
  fontSize: '0.7rem',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  background: 'transparent',
  border: '1px solid var(--color-rule)',
  color: 'var(--color-ink)',
  cursor: 'pointer',
}

const iconBtn = {
  ...smallBtn,
  padding: '0.15rem 0.4rem',
  fontSize: '0.85rem',
  letterSpacing: 'normal',
}

const primaryBtn = {
  ...smallBtn,
  background: 'var(--color-accent)',
  borderColor: 'var(--color-accent)',
  color: 'var(--color-accent-ink)',
}
