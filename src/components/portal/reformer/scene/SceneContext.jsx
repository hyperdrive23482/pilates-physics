// Shared context for the scene: the <svg> ref so DragHandles can convert
// client pixels to SVG coordinates, plus a flag that disables dragging during
// playback.

import { createContext, useContext } from 'react'

export const SceneContext = createContext({
  svgRef: { current: null },
  interactive: true,
})

export function useSceneContext() {
  return useContext(SceneContext)
}
