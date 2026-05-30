// Top-level component for the Reformer Force Modeler portal tool. This is the
// component registered in ToolHost's REGISTRY under slug 'reformer-force-modeler'.
//
// Architecture:
//   ModelProvider wraps the entire tool with a typed-reducer store.
//   solve(model) is called via useMemo so derived state recomputes only when
//   model identity changes. The scene + readouts consume `derived`.
//   The timeline owns a rAF loop (usePlayback) that dispatches per-frame
//   interpolated poses; solve() re-runs each frame, keeping carriage motion
//   physically consistent without ever interpolating it directly.

import { useCallback, useMemo, useRef } from 'react'
import { ModelProvider, useModel, useProject, useDispatch } from './store/ModelContext.jsx'
import { SceneContext } from './scene/SceneContext.jsx'
import SceneCanvas from './scene/SceneCanvas.jsx'
import ReformerLayer from './scene/ReformerLayer.jsx'
import SpringLayer from './scene/SpringLayer.jsx'
import RopeLayer from './scene/RopeLayer.jsx'
import BodyLayer from './scene/BodyLayer.jsx'
import ForceVectorLayer from './scene/ForceVectorLayer.jsx'
import MachinePanel from './panels/MachinePanel.jsx'
import SpringsPanel from './panels/SpringsPanel.jsx'
import BodyPanel from './panels/BodyPanel.jsx'
import AttachmentsPanel from './panels/AttachmentsPanel.jsx'
import ReadoutsPanel from './panels/ReadoutsPanel.jsx'
import TimelinePanel from './panels/TimelinePanel.jsx'
import { usePlayback } from './usePlayback.js'
import { loadProject } from './store/actions.js'
import { framesToCsv, framesToJson } from './io/exportFrames.js'
import { serializeProject, deserializeProject } from './io/projectIo.js'
import { downloadBlob, pickJsonFile } from './io/download.js'
import { solve } from '../../../lib/reformer/solve.js'

export default function ReformerForceModeler() {
  return (
    <ModelProvider>
      <Inner />
    </ModelProvider>
  )
}

function Inner() {
  const model = useModel()
  const project = useProject()
  const dispatch = useDispatch()
  const svgRef = useRef(null)
  const playback = usePlayback()

  const derived = useMemo(() => solve(model), [model])

  // Dragging is disabled during playback to avoid dispatch contention.
  const sceneCtx = useMemo(
    () => ({ svgRef, interactive: !playback.playing }),
    [svgRef, playback.playing],
  )

  const handleExportCsv = useCallback(() => {
    const csv = framesToCsv(project)
    if (!csv) return
    downloadBlob('reformer-frames.csv', 'text/csv;charset=utf-8', csv)
  }, [project])

  const handleExportJson = useCallback(() => {
    const json = framesToJson(project)
    if (!json) return
    downloadBlob('reformer-frames.json', 'application/json', json)
  }, [project])

  const handleSaveProject = useCallback(() => {
    const json = serializeProject(project)
    downloadBlob(`${(project.name || 'reformer-project').replace(/\s+/g, '-')}.json`, 'application/json', json)
  }, [project])

  const handleLoadProject = useCallback(async () => {
    try {
      const text = await pickJsonFile()
      const loaded = deserializeProject(text)
      dispatch(loadProject(loaded))
    } catch (err) {
      alert(`Load failed: ${err instanceof Error ? err.message : String(err)}`)
    }
  }, [dispatch])

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) minmax(300px, 380px)',
        gap: '1rem',
        alignItems: 'start',
      }}
      className="pp-reformer-modeler"
    >
      <div style={{ minWidth: 0 }}>
        <SceneContext.Provider value={sceneCtx}>
          <SceneCanvas ref={svgRef}>
            <ReformerLayer reformer={model.reformer} carriageX={derived.carriageX} />
            <SpringLayer
              reformer={model.reformer}
              springs={model.springs}
              springResults={derived.springResults}
              carriageX={derived.carriageX}
            />
            <RopeLayer
              reformer={model.reformer}
              ropes={model.ropes}
              ropeResults={derived.ropeResults}
              attachments={model.attachments}
              jointPositions={derived.jointPositions}
              carriageX={derived.carriageX}
            />
            <BodyLayer human={model.human} jointPositions={derived.jointPositions} />
            <ForceVectorLayer
              reformer={model.reformer}
              ropes={model.ropes}
              ropeResults={derived.ropeResults}
              totalSpringForce={derived.totalSpringForce}
              jointPositions={derived.jointPositions}
              carriageX={derived.carriageX}
            />
          </SceneCanvas>
        </SceneContext.Provider>
        <p
          style={{
            margin: '0.5rem 0 0',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.7rem',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--color-ink-dim)',
          }}
        >
          Reformer Force Modeler · v1
        </p>
      </div>

      <aside
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-rule)',
          padding: '0 1rem',
          minHeight: '200px',
        }}
      >
        <ReadoutsPanel derived={derived} springs={model.springs} />
        <TimelinePanel
          playback={playback}
          onExportCsv={handleExportCsv}
          onExportJson={handleExportJson}
          onSaveProject={handleSaveProject}
          onLoadProject={handleLoadProject}
        />
        <MachinePanel />
        <SpringsPanel />
        <BodyPanel />
        <AttachmentsPanel />
      </aside>

      <style>{`
        @media (max-width: 900px) {
          .pp-reformer-modeler { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
