import { useState, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Users } from 'lucide-react'
import StudentSetup from './StudentSetup'
import ExerciseView from './ExerciseView'
import { EXERCISES } from './exercises'

let nextId = 1
function makeStudent(index) {
  return {
    id: `student-${nextId++}`,
    name: `Student ${index + 1}`,
    heightIn: 64,
    weightLb: 135,
    gender: 'woman',
  }
}

export default function ClassSimulator() {
  const [step, setStep] = useState('setup') // 'setup' | 'class'
  const [students, setStudents] = useState(() => [makeStudent(0)])
  const [exerciseIndex, setExerciseIndex] = useState(0)
  // config[exerciseId][studentId] = partial overrides on top of exercise defaults
  const [config, setConfig] = useState({})

  const getStudentConfig = useCallback(
    (exercise, studentId) => {
      const stored = config[exercise.id]?.[studentId] || {}
      return {
        springs: { ...exercise.defaultSprings },
        ...exercise.defaults,
        toggles: {},
        ...stored,
      }
    },
    [config]
  )

  const patchStudentConfig = useCallback((exerciseId, studentId, patch) => {
    setConfig((prev) => ({
      ...prev,
      [exerciseId]: {
        ...prev[exerciseId],
        [studentId]: { ...prev[exerciseId]?.[studentId], ...patch },
      },
    }))
  }, [])

  const exercise = EXERCISES[exerciseIndex]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {step === 'setup' ? (
        <StudentSetup
          students={students}
          onStudentsChange={setStudents}
          onAddStudent={() => setStudents((prev) => [...prev, makeStudent(prev.length)])}
          onStart={() => setStep('class')}
        />
      ) : (
        <>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              flexWrap: 'wrap',
            }}
          >
            <button
              type="button"
              aria-label="Previous exercise"
              disabled={exerciseIndex === 0}
              onClick={() => setExerciseIndex((i) => Math.max(0, i - 1))}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '30px',
                height: '30px',
                border: '1px solid var(--color-rule)',
                borderRadius: '2px',
                background: 'var(--color-bg)',
                color: 'var(--color-ink)',
                cursor: 'pointer',
                opacity: exerciseIndex === 0 ? 0.35 : 1,
                padding: 0,
              }}
            >
              <ChevronLeft size={16} strokeWidth={1.75} />
            </button>
            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', flex: 1 }}>
              {EXERCISES.map((ex, i) => {
                const active = i === exerciseIndex
                return (
                  <button
                    key={ex.id}
                    type="button"
                    aria-pressed={active}
                    title={ex.name}
                    onClick={() => setExerciseIndex(i)}
                    style={{
                      padding: '0.35rem 0.7rem',
                      fontSize: '0.72rem',
                      fontFamily: 'var(--font-serif)',
                      border: '1px solid var(--color-rule)',
                      borderRadius: '999px',
                      background: active ? 'var(--color-accent)' : 'var(--color-bg)',
                      color: active
                        ? 'var(--color-accent-ink)'
                        : ex.placeholder
                          ? 'var(--color-ink-muted)'
                          : 'var(--color-ink)',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {i + 1}. {ex.name}
                  </button>
                )
              })}
            </div>
            <button
              type="button"
              aria-label="Next exercise"
              disabled={exerciseIndex === EXERCISES.length - 1}
              onClick={() => setExerciseIndex((i) => Math.min(EXERCISES.length - 1, i + 1))}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '30px',
                height: '30px',
                border: '1px solid var(--color-rule)',
                borderRadius: '2px',
                background: 'var(--color-bg)',
                color: 'var(--color-ink)',
                cursor: 'pointer',
                opacity: exerciseIndex === EXERCISES.length - 1 ? 0.35 : 1,
                padding: 0,
              }}
            >
              <ChevronRight size={16} strokeWidth={1.75} />
            </button>
            <button
              type="button"
              onClick={() => setStep('setup')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.35rem 0.7rem',
                fontSize: '0.75rem',
                fontFamily: 'var(--font-serif)',
                border: '1px solid var(--color-rule)',
                borderRadius: '2px',
                background: 'transparent',
                color: 'var(--color-ink-muted)',
                cursor: 'pointer',
              }}
            >
              <Users size={13} strokeWidth={1.75} /> Edit students
            </button>
          </div>

          <ExerciseView
            exercise={exercise}
            students={students}
            getStudentConfig={getStudentConfig}
            onPatchStudent={patchStudentConfig}
          />
        </>
      )}
    </div>
  )
}
