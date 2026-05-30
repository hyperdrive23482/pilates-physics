// Action types and typed action creators for the Reformer Force Modeler.
//
// The reducer is pure and small; all derived state (carriage position, forces,
// joint angles in degrees) is computed downstream by solve(model) via useMemo,
// never stored here.

export const ActionTypes = Object.freeze({
  LOAD_PROJECT:      'LOAD_PROJECT',
  RESET:             'RESET',

  SET_REFORMER_FIELD:'SET_REFORMER_FIELD',
  SET_ROUTE_FIELD:   'SET_ROUTE_FIELD',

  TOGGLE_SPRING:     'TOGGLE_SPRING',
  SET_SPRING_FIELD:  'SET_SPRING_FIELD',

  SET_BODY_HEIGHT:   'SET_BODY_HEIGHT',
  SET_BODY_MASS:     'SET_BODY_MASS',
  SET_ROOT_POS:      'SET_ROOT_POS',
  SET_SEGMENT_ANGLE: 'SET_SEGMENT_ANGLE',
  ROTATE_SUBTREE:    'ROTATE_SUBTREE',

  SET_ROPE_FIELD:    'SET_ROPE_FIELD',
  SET_ATTACHMENT:    'SET_ATTACHMENT',

  SET_CARRIAGE_SEED: 'SET_CARRIAGE_SEED',

  ADD_KEYFRAME:      'ADD_KEYFRAME',
  UPDATE_KEYFRAME:   'UPDATE_KEYFRAME',
  DELETE_KEYFRAME:   'DELETE_KEYFRAME',
  REORDER_KEYFRAME:  'REORDER_KEYFRAME',
  APPLY_KEYFRAME:    'APPLY_KEYFRAME',
  SET_ACTIVE_KEYFRAME:'SET_ACTIVE_KEYFRAME',
  SET_MODEL_FROM_FRAME:'SET_MODEL_FROM_FRAME',
  SET_FPS:           'SET_FPS',
})

export const loadProject       = (project)                    => ({ type: ActionTypes.LOAD_PROJECT, payload: { project } })
export const resetProject      = ()                           => ({ type: ActionTypes.RESET })

export const setReformerField  = (field, value)              => ({ type: ActionTypes.SET_REFORMER_FIELD,  payload: { field, value } })
export const setRouteField     = (id, field, value)          => ({ type: ActionTypes.SET_ROUTE_FIELD,     payload: { id, field, value } })

export const toggleSpring      = (id)                         => ({ type: ActionTypes.TOGGLE_SPRING,      payload: { id } })
export const setSpringField    = (id, field, value)          => ({ type: ActionTypes.SET_SPRING_FIELD,   payload: { id, field, value } })

export const setBodyHeight     = (heightM)                    => ({ type: ActionTypes.SET_BODY_HEIGHT,    payload: { heightM } })
export const setBodyMass       = (bodyMass)                   => ({ type: ActionTypes.SET_BODY_MASS,      payload: { bodyMass } })
export const setRootPos        = (pos)                        => ({ type: ActionTypes.SET_ROOT_POS,       payload: { pos } })
export const setSegmentAngle   = (segmentId, angleRad)        => ({ type: ActionTypes.SET_SEGMENT_ANGLE,  payload: { segmentId, angleRad } })
export const rotateSubtree     = (rootSegmentId, deltaRad)    => ({ type: ActionTypes.ROTATE_SUBTREE,     payload: { rootSegmentId, deltaRad } })

export const setRopeField      = (id, field, value)           => ({ type: ActionTypes.SET_ROPE_FIELD,     payload: { id, field, value } })
export const setAttachment     = (endId, patch)               => ({ type: ActionTypes.SET_ATTACHMENT,     payload: { endId, patch } })

export const setCarriageSeed   = (x)                          => ({ type: ActionTypes.SET_CARRIAGE_SEED,  payload: { x } })

export const addKeyframe       = ()                           => ({ type: ActionTypes.ADD_KEYFRAME })
export const updateKeyframe    = (id, patch)                  => ({ type: ActionTypes.UPDATE_KEYFRAME,    payload: { id, patch } })
export const deleteKeyframe    = (id)                         => ({ type: ActionTypes.DELETE_KEYFRAME,    payload: { id } })
export const reorderKeyframe   = (from, to)                   => ({ type: ActionTypes.REORDER_KEYFRAME,   payload: { from, to } })
export const applyKeyframe     = (id)                         => ({ type: ActionTypes.APPLY_KEYFRAME,     payload: { id } })
export const setActiveKeyframe = (id)                         => ({ type: ActionTypes.SET_ACTIVE_KEYFRAME,payload: { id } })
export const setModelFromFrame = (model)                      => ({ type: ActionTypes.SET_MODEL_FROM_FRAME, payload: { model } })
export const setFps            = (fps)                        => ({ type: ActionTypes.SET_FPS,            payload: { fps } })
