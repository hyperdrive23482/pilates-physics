// React context + provider for the Reformer Force Modeler store.
// This is the only file under store/ that imports React.

import { createContext, useContext, useReducer, useMemo } from 'react'
import { reducer, initialState } from './reducer.js'

const ProjectStateContext = createContext(null)
const ProjectDispatchContext = createContext(null)

export function ModelProvider({ children }) {
  const [project, dispatch] = useReducer(reducer, initialState)
  // Memoize dispatch wrapper just to keep the reference stable (it already is
  // from useReducer, but this future-proofs against batching wrappers).
  const dispatchMemo = useMemo(() => dispatch, [])
  return (
    <ProjectStateContext.Provider value={project}>
      <ProjectDispatchContext.Provider value={dispatchMemo}>
        {children}
      </ProjectDispatchContext.Provider>
    </ProjectStateContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useProject() {
  const v = useContext(ProjectStateContext)
  if (!v) throw new Error('useProject called outside of <ModelProvider>')
  return v
}

// eslint-disable-next-line react-refresh/only-export-components
export function useModel() {
  return useProject().model
}

// eslint-disable-next-line react-refresh/only-export-components
export function useDispatch() {
  const v = useContext(ProjectDispatchContext)
  if (!v) throw new Error('useDispatch called outside of <ModelProvider>')
  return v
}
