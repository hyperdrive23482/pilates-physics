import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'

/**
 * Progress across every course a user owns, for the dashboard card.
 *
 * Two queries for all courses rather than two per course: the module list is
 * fetched in one go and progress is filtered to those module ids, so adding a
 * second course does not add round trips.
 *
 * Returns, keyed by webinar id: how many modules exist, how many are done, and
 * the index to resume at, which is the first unfinished module. That index is
 * what the card links to, so "Continue" lands where they stopped instead of
 * back at module one.
 */
export function useCourseSummaries(userId, courseIds) {
  const [summaries, setSummaries] = useState({})

  const idKey = useMemo(() => (courseIds ?? []).join(','), [courseIds])

  useEffect(() => {
    const ids = idKey ? idKey.split(',') : []
    if (!userId || ids.length === 0) {
      setSummaries({})
      return
    }
    let cancelled = false

    async function load() {
      const { data: modules, error } = await supabase
        .from('course_modules')
        .select('id, webinar_id, sort_order')
        .in('webinar_id', ids)
        .order('sort_order', { ascending: true })
      if (cancelled || error || !modules?.length) return

      const { data: progress } = await supabase
        .from('course_progress')
        .select('module_id')
        .eq('user_id', userId)
        .in(
          'module_id',
          modules.map((m) => m.id),
        )
      if (cancelled) return

      const done = new Set((progress ?? []).map((p) => p.module_id))
      const out = {}
      for (const id of ids) {
        const mine = modules.filter((m) => m.webinar_id === id)
        if (!mine.length) continue
        const doneCount = mine.filter((m) => done.has(m.id)).length
        const firstIncomplete = mine.findIndex((m) => !done.has(m.id))
        out[id] = {
          total: mine.length,
          done: doneCount,
          // Everything finished sends them to the quiz rather than to a module
          // they have already watched.
          resumeKey: firstIncomplete === -1 ? 'quiz' : String(firstIncomplete),
        }
      }
      setSummaries(out)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [userId, idKey])

  return summaries
}
