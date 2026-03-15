import { useState } from 'react'
import { modules } from '../utils/courseData'

const STORAGE_KEY = 'pp_progress'

function loadProgress() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}
  } catch {
    return {}
  }
}

export function useCourseProgress() {
  const [progress, setProgress] = useState(loadProgress)

  function markComplete(lessonId) {
    const mod = modules.find((m) => m.lessons.some((l) => l.id === lessonId))
    if (!mod) return

    setProgress((prev) => {
      const completed = prev[mod.id] || []
      if (completed.includes(lessonId)) return prev
      const next = { ...prev, [mod.id]: [...completed, lessonId] }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
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
