import { Lock, CheckCircle, Circle } from 'lucide-react'
import ProgressBar from '../ui/ProgressBar'
import { modules } from '../../utils/courseData'

export default function CourseSidebar({
  currentLessonId,
  isLessonComplete,
  isModuleUnlocked,
  moduleCompletionCount,
  overallPercent,
  onSelectLesson,
}) {
  return (
    <aside
      style={{
        width: '280px',
        flexShrink: 0,
        borderRight: '1px solid var(--color-rule)',
        background: 'var(--color-surface)',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Overall progress header */}
      <div
        style={{
          padding: '1.25rem 1.25rem 1rem',
          borderBottom: '1px solid var(--color-rule)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginBottom: '0.5rem',
          }}
        >
          <span
            style={{
              fontSize: '0.7rem',
              fontWeight: '600',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--color-ink-muted)',
            }}
          >
            Your progress
          </span>
          <span
            style={{
              fontSize: '0.8rem',
              fontWeight: '600',
              color: 'var(--color-ink)',
            }}
          >
            {overallPercent}%
          </span>
        </div>
        <ProgressBar percent={overallPercent} height={3} />
      </div>

      {/* Module list */}
      <nav style={{ padding: '0.5rem 0', flex: 1 }}>
        {modules.map((mod) => {
          const unlocked = isModuleUnlocked(mod.id)
          const { completed, total } = moduleCompletionCount(mod.id)
          const modPercent = total > 0 ? Math.round((completed / total) * 100) : 0

          return (
            <div key={mod.id} style={{ borderBottom: '1px solid var(--color-rule)' }}>
              {/* Module heading */}
              <div
                style={{
                  padding: '0.875rem 1.25rem 0.625rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.4rem',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.5rem',
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.65rem',
                      fontWeight: '600',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: unlocked ? mod.color : 'var(--color-ink-muted)',
                    }}
                  >
                    Module {mod.number}
                  </span>
                  {!unlocked && (
                    <Lock size={11} color="var(--color-ink-muted)" strokeWidth={2} />
                  )}
                  {unlocked && (
                    <span
                      style={{ fontSize: '0.7rem', color: 'var(--color-ink-muted)' }}
                    >
                      {completed}/{total}
                    </span>
                  )}
                </div>

                <span
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: '500',
                    color: unlocked ? 'var(--color-ink)' : 'var(--color-ink-muted)',
                    lineHeight: '1.3',
                  }}
                >
                  {mod.title}
                </span>

                {unlocked && (
                  <ProgressBar
                    percent={modPercent}
                    color={mod.color}
                    height={2}
                  />
                )}
              </div>

              {/* Lesson list — only show for unlocked modules */}
              {unlocked && (
                <ul style={{ listStyle: 'none', margin: 0, padding: '0 0 0.5rem' }}>
                  {mod.lessons.map((lesson) => {
                    const done = isLessonComplete(lesson.id)
                    const active = lesson.id === currentLessonId

                    return (
                      <li key={lesson.id}>
                        <button
                          onClick={() => onSelectLesson(mod.id, lesson.id)}
                          style={{
                            width: '100%',
                            textAlign: 'left',
                            padding: '0.45rem 1.25rem 0.45rem 1.5rem',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '0.6rem',
                            background: active
                              ? 'var(--color-accent-light)'
                              : 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            borderLeft: active
                              ? `2px solid ${mod.color}`
                              : '2px solid transparent',
                          }}
                        >
                          <span style={{ marginTop: '2px', flexShrink: 0 }}>
                            {done ? (
                              <CheckCircle
                                size={13}
                                color={mod.color}
                                strokeWidth={2}
                              />
                            ) : (
                              <Circle
                                size={13}
                                color={
                                  active
                                    ? mod.color
                                    : 'var(--color-ink-muted)'
                                }
                                strokeWidth={1.5}
                              />
                            )}
                          </span>
                          <span
                            style={{
                              fontSize: '0.8rem',
                              lineHeight: '1.45',
                              color: active
                                ? 'var(--color-ink)'
                                : done
                                ? 'var(--color-ink-muted)'
                                : 'var(--color-ink)',
                              fontWeight: active ? '500' : '400',
                            }}
                          >
                            {lesson.title}
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}

              {/* Locked state hint */}
              {!unlocked && (
                <p
                  style={{
                    padding: '0 1.25rem 0.875rem',
                    fontSize: '0.73rem',
                    color: 'var(--color-ink-muted)',
                    margin: 0,
                    lineHeight: '1.5',
                  }}
                >
                  {mod.comingSoon ? 'Coming Soon' : `Complete Module ${mod.number - 1} to unlock.`}
                </p>
              )}
            </div>
          )
        })}
      </nav>
    </aside>
  )
}
