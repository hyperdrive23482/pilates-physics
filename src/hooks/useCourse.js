import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { track } from '../lib/track'

/**
 * The curriculum of a course, plus its attachments.
 *
 * Both tables are entitlement-gated by RLS, so a viewer without a live
 * entitlement simply gets empty arrays rather than an error. The caller has
 * already checked access before rendering; this is the second line.
 */
export function useCourseModules(workshopId) {
  const [modules, setModules] = useState([])
  const [attachments, setAttachments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!workshopId) {
      setModules([])
      setAttachments([])
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)

    Promise.all([
      supabase
        .from('course_modules')
        .select('*')
        .eq('webinar_id', workshopId)
        .order('sort_order', { ascending: true }),
      supabase
        .from('webinar_content')
        .select('*')
        .eq('webinar_id', workshopId)
        .order('sort_order', { ascending: true }),
    ]).then(([mods, content]) => {
      if (cancelled) return
      if (!mods.error) setModules(mods.data ?? [])
      if (!content.error) setAttachments(content.data ?? [])
      setLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [workshopId])

  return { modules, attachments, loading }
}

/**
 * How far through a course someone is.
 *
 * These rows are a bookmark, not proof of study. Nothing here gates anything:
 * every module is reachable from the first visit, and marking one done is an
 * explicit "I am finished with this", not a measurement of playback. The
 * record that carries the CEC is the passed quiz attempt.
 */
export function useCourseProgress(userId, moduleIds) {
  const [completed, setCompleted] = useState(() => new Set())
  const [loading, setLoading] = useState(true)

  // moduleIds is a fresh array each render; key the effect on its contents so
  // it refetches when the curriculum changes rather than on every render.
  const idKey = useMemo(() => (moduleIds ?? []).join(','), [moduleIds])

  useEffect(() => {
    const ids = idKey ? idKey.split(',') : []
    if (!userId || ids.length === 0) {
      setCompleted(new Set())
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)

    supabase
      .from('course_progress')
      .select('module_id')
      .eq('user_id', userId)
      .in('module_id', ids)
      .then(({ data, error }) => {
        if (cancelled) return
        if (!error) setCompleted(new Set((data ?? []).map((r) => r.module_id)))
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [userId, idKey])

  // Optimistic: the tick appears immediately and the write follows. A failed
  // write is not worth interrupting someone mid-course over, so it reverts
  // quietly and the next Next click tries again.
  const markComplete = useCallback(
    async (moduleId, { webinarId } = {}) => {
      if (!userId || !moduleId) return
      if (completed.has(moduleId)) return

      setCompleted((prev) => new Set(prev).add(moduleId))

      const { error } = await supabase
        .from('course_progress')
        .upsert(
          { user_id: userId, module_id: moduleId },
          { onConflict: 'user_id,module_id', ignoreDuplicates: true },
        )

      if (error) {
        setCompleted((prev) => {
          const next = new Set(prev)
          next.delete(moduleId)
          return next
        })
        return
      }

      track('module_complete', { webinar_id: webinarId, content_id: moduleId })
    },
    [userId, completed],
  )

  return { completed, markComplete, loading }
}
