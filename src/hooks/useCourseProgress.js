import { useState, useEffect } from 'react'
import { modules } from '../utils/courseData'

function storageKey(userId) {
  return userId ? `pp_progress_${userId}` : 'pp_progress'
}

function loadProgress(userId) {
  try {
    return JSON.parse(localStorage.getItem(storageKey(userId))) || {}
  } catch {
    return {}
  }
}

export function useCourseProgress(userId) {
  const [progress, setProgress] = useState(() => loadProgress(userId))

  // Reload progress when the user changes (e.g. after sign-in)
  useEffect(() => {
    setProgress(loadProgress(userId))
  }, [userId])

  function markComplete(lessonId) {
    const mod = modules.find((m) => m.lessons.some((l) => l.id === lessonId))
    if (!mod) return

    setProgress((prev) => {
      const completed = prev[mod.id] || []
      if (completed.includes(lessonId)) return prev
      const next = { ...prev, [mod.id]: [...completed, lessonId] }
      localStorage.setItem(storageKey(userId), JSON.stringify(next))
      return next
    })
  }

  function isLessonComplete(lessonId) {
    const mod = modules.find((m) => m.lessons.some((l) => l.id === lessonId))
    if (!mod) return false
    return (progress[mod.id] || []).includes(lessonId)
  }

  function isModuleUnlocked(moduleId) {
    const mod = modules.find((m) => m.id === moduleId)
    if (!mod) return false
    if (mod.alwaysOpen || !mod.requiredModule) return true

    const required = modules.find((m) => m.id === mod.requiredModule)
    if (!required) return true

    const completedInRequired = progress[required.id] || []
    return required.lessons.every((l) => completedInRequired.includes(l.id))
  }

  function moduleCompletionCount(moduleId) {
    const mod = modules.find((m) => m.id === moduleId)
    if (!mod) return { completed: 0, total: 0 }
    return {
      completed: (progress[moduleId] || []).length,
      total: mod.lessons.length,
    }
  }

  const totalLessons = modules.reduce((sum, m) => sum + m.lessons.length, 0)
  const completedLessons = modules.reduce(
    (sum, m) => sum + (progress[m.id] || []).length,
    0
  )
  const overallPercent =
    totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0

  return {
    progress,
    markComplete,
    isLessonComplete,
    isModuleUnlocked,
    moduleCompletionCount,
    overallPercent,
  }
}
