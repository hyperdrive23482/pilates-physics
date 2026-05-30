// requestAnimationFrame playback loop. Owns the playhead time in a ref so the
// loop never re-subscribes; each frame samples the keyframes and dispatches
// SET_MODEL_FROM_FRAME. solve() then re-runs via useMemo in the parent.

import { useCallback, useEffect, useRef, useState } from 'react'
import { useProject, useDispatch } from './store/ModelContext.jsx'
import { setModelFromFrame } from './store/actions.js'
import { sampleKeyframesAt, totalDuration } from '../../../lib/reformer/interp.js'

export function usePlayback() {
  const project = useProject()
  const dispatch = useDispatch()
  const tRef = useRef(0)
  const lastTsRef = useRef(null)
  const rafRef = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [tDisplay, setTDisplay] = useState(0)

  const duration = totalDuration(project.keyframes)
  const keyframesRef = useRef(project.keyframes)
  const baseModelRef = useRef(project.model)
  keyframesRef.current = project.keyframes
  baseModelRef.current = project.model

  const step = useCallback(
    (ts) => {
      if (lastTsRef.current === null) lastTsRef.current = ts
      const dt = (ts - lastTsRef.current) / 1000
      lastTsRef.current = ts
      tRef.current += dt
      const dur = totalDuration(keyframesRef.current)
      if (tRef.current >= dur) {
        tRef.current = dur
        setTDisplay(dur)
        const m = sampleKeyframesAt(keyframesRef.current, dur, baseModelRef.current)
        dispatch(setModelFromFrame(m))
        setPlaying(false)
        rafRef.current = null
        lastTsRef.current = null
        return
      }
      const m = sampleKeyframesAt(keyframesRef.current, tRef.current, baseModelRef.current)
      dispatch(setModelFromFrame(m))
      setTDisplay(tRef.current)
      rafRef.current = requestAnimationFrame(step)
    },
    [dispatch],
  )

  const play = useCallback(() => {
    if (rafRef.current !== null) return
    if (project.keyframes.length < 2) return
    if (tRef.current >= duration) tRef.current = 0
    lastTsRef.current = null
    setPlaying(true)
    rafRef.current = requestAnimationFrame(step)
  }, [duration, project.keyframes.length, step])

  const pause = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    lastTsRef.current = null
    setPlaying(false)
  }, [])

  const seek = useCallback(
    (t) => {
      tRef.current = Math.max(0, Math.min(duration, t))
      setTDisplay(tRef.current)
      const m = sampleKeyframesAt(keyframesRef.current, tRef.current, baseModelRef.current)
      dispatch(setModelFromFrame(m))
    },
    [dispatch, duration],
  )

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return { playing, t: tDisplay, duration, play, pause, seek }
}
