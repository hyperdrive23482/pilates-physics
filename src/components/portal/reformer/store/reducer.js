// Pure reducer for the Reformer Force Modeler.
//
// Reducer never calls solve(). All derived state is computed by ReformerForceModeler
// via useMemo(() => solve(model), [model]).

import { ActionTypes } from './actions.js'
import { getSubtreeSegmentIds } from './selectors.js'
import { makeInitialModel } from '../../../../lib/reformer/defaults.js'
import { scaleFromHeight } from '../../../../lib/reformer/anthropometry.js'

const PROJECT_VERSION = 1

/** @returns {import('../../../../lib/reformer/types.js').Project} */
export function makeInitialProject() {
  return {
    version: PROJECT_VERSION,
    name: 'Untitled reformer pose',
    model: makeInitialModel(),
    keyframes: [],
    ui: { activeKeyframeId: null, fps: 30 },
  }
}

export const initialState = makeInitialProject()

export function reducer(state, action) {
  switch (action.type) {

    case ActionTypes.LOAD_PROJECT: {
      const p = action.payload.project
      if (!p || typeof p !== 'object') return state
      return { ...p }
    }

    case ActionTypes.RESET:
      return makeInitialProject()

    case ActionTypes.SET_REFORMER_FIELD: {
      const { field, value } = action.payload
      return {
        ...state,
        model: { ...state.model, reformer: { ...state.model.reformer, [field]: value } },
      }
    }

    case ActionTypes.SET_ROUTE_FIELD: {
      const { id, field, value } = action.payload
      const routes = state.model.reformer.routes.map((r) =>
        r.id === id ? { ...r, [field]: value } : r,
      )
      return {
        ...state,
        model: { ...state.model, reformer: { ...state.model.reformer, routes } },
      }
    }

    case ActionTypes.TOGGLE_SPRING: {
      const { id } = action.payload
      const springs = state.model.springs.map((s) =>
        s.id === id ? { ...s, attached: !s.attached } : s,
      )
      return { ...state, model: { ...state.model, springs } }
    }

    case ActionTypes.SET_SPRING_FIELD: {
      const { id, field, value } = action.payload
      const springs = state.model.springs.map((s) =>
        s.id === id ? { ...s, [field]: value } : s,
      )
      return { ...state, model: { ...state.model, springs } }
    }

    case ActionTypes.SET_BODY_HEIGHT: {
      const heightM = action.payload.heightM
      const segments = scaleFromHeight(heightM)
      return {
        ...state,
        model: {
          ...state.model,
          human: { ...state.model.human, heightM, segments },
        },
      }
    }

    case ActionTypes.SET_BODY_MASS: {
      const bodyMass = action.payload.bodyMass
      return {
        ...state,
        model: { ...state.model, human: { ...state.model.human, bodyMass } },
      }
    }

    case ActionTypes.SET_ROOT_POS: {
      const pos = action.payload.pos
      return {
        ...state,
        model: { ...state.model, human: { ...state.model.human, rootPos: { ...pos } } },
      }
    }

    case ActionTypes.SET_SEGMENT_ANGLE: {
      const { segmentId, angleRad } = action.payload
      const angles = { ...state.model.human.angles, [segmentId]: angleRad }
      return {
        ...state,
        model: { ...state.model, human: { ...state.model.human, angles } },
      }
    }

    case ActionTypes.ROTATE_SUBTREE: {
      const { rootSegmentId, deltaRad } = action.payload
      if (!Number.isFinite(deltaRad) || deltaRad === 0) return state
      const subtreeIds = getSubtreeSegmentIds(state.model.human.segments, rootSegmentId)
      const angles = { ...state.model.human.angles }
      for (const id of subtreeIds) angles[id] = (angles[id] ?? 0) + deltaRad
      return {
        ...state,
        model: { ...state.model, human: { ...state.model.human, angles } },
      }
    }

    case ActionTypes.SET_ROPE_FIELD: {
      const { id, field, value } = action.payload
      const ropes = state.model.ropes.map((r) =>
        r.id === id ? { ...r, [field]: value } : r,
      )
      return { ...state, model: { ...state.model, ropes } }
    }

    case ActionTypes.SET_ATTACHMENT: {
      const { endId, patch } = action.payload
      const attachments = state.model.attachments.map((a) =>
        a.endId === endId ? { ...a, ...patch } : a,
      )
      return { ...state, model: { ...state.model, attachments } }
    }

    case ActionTypes.SET_CARRIAGE_SEED: {
      const { x } = action.payload
      return { ...state, model: { ...state.model, carriageSeedX: x } }
    }

    case ActionTypes.ADD_KEYFRAME: {
      const snap = snapshotKeyframe(state.model)
      return { ...state, keyframes: [...state.keyframes, snap], ui: { ...state.ui, activeKeyframeId: snap.id } }
    }

    case ActionTypes.UPDATE_KEYFRAME: {
      const { id, patch } = action.payload
      return {
        ...state,
        keyframes: state.keyframes.map((k) => (k.id === id ? { ...k, ...patch } : k)),
      }
    }

    case ActionTypes.DELETE_KEYFRAME: {
      const { id } = action.payload
      const next = state.keyframes.filter((k) => k.id !== id)
      const wasActive = state.ui.activeKeyframeId === id
      return {
        ...state,
        keyframes: next,
        ui: { ...state.ui, activeKeyframeId: wasActive ? null : state.ui.activeKeyframeId },
      }
    }

    case ActionTypes.REORDER_KEYFRAME: {
      const { from, to } = action.payload
      if (from === to) return state
      const next = state.keyframes.slice()
      const [moved] = next.splice(from, 1)
      if (!moved) return state
      next.splice(to, 0, moved)
      return { ...state, keyframes: next }
    }

    case ActionTypes.APPLY_KEYFRAME: {
      const { id } = action.payload
      const k = state.keyframes.find((kf) => kf.id === id)
      if (!k) return state
      return {
        ...state,
        model: {
          ...state.model,
          reformer: structuredCloneSafe(k.reformer),
          springs: k.springs.map((s) => ({ ...s })),
          attachments: k.attachments.map((a) => ({ ...a })),
          human: {
            ...state.model.human,
            rootPos: { ...k.rootPos },
            angles: { ...k.angles },
          },
        },
        ui: { ...state.ui, activeKeyframeId: id },
      }
    }

    case ActionTypes.SET_ACTIVE_KEYFRAME:
      return { ...state, ui: { ...state.ui, activeKeyframeId: action.payload.id } }

    case ActionTypes.SET_MODEL_FROM_FRAME: {
      const m = action.payload.model
      return { ...state, model: m }
    }

    case ActionTypes.SET_FPS:
      return { ...state, ui: { ...state.ui, fps: action.payload.fps } }

    default:
      return state
  }
}

/** Build a Keyframe snapshot from the current model. */
function snapshotKeyframe(model) {
  return {
    id: cryptoRandomId(),
    durationToNext: 1.0,
    ease: 'linear',
    angles: { ...model.human.angles },
    rootPos: { ...model.human.rootPos },
    reformer: structuredCloneSafe(model.reformer),
    springs: model.springs.map((s) => ({ ...s })),
    attachments: model.attachments.map((a) => ({ ...a })),
  }
}

function cryptoRandomId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `kf-${Math.random().toString(36).slice(2, 10)}`
}

function structuredCloneSafe(obj) {
  if (typeof structuredClone === 'function') return structuredClone(obj)
  return JSON.parse(JSON.stringify(obj))
}
