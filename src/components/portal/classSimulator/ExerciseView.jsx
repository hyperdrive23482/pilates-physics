import StudentColumn from './StudentColumn'

// Header + side-by-side student columns for the current exercise.
export default function ExerciseView({ exercise, students, getStudentConfig, onPatchStudent }) {
  if (exercise.placeholder) {
    return (
      <div
        style={{
          padding: '3rem 1.5rem',
          textAlign: 'center',
          border: '1px dashed var(--color-rule)',
          borderRadius: '2px',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '1.3rem',
            color: 'var(--color-ink)',
            marginBottom: '0.4rem',
          }}
        >
          {exercise.name}
        </div>
        <div style={{ fontSize: '0.85rem', color: 'var(--color-ink-muted)' }}>
          Coming soon. The load model for this exercise is still being specified.
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.7rem', flexWrap: 'wrap' }}>
          <h2
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '1.5rem',
              fontWeight: 600,
              color: 'var(--color-ink)',
              margin: 0,
            }}
          >
            {exercise.name}
          </h2>
          <span
            style={{
              padding: '0.15rem 0.55rem',
              fontSize: '0.65rem',
              fontFamily: 'var(--font-mono, monospace)',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              borderRadius: '999px',
              border: '1px solid var(--color-rule)',
              color:
                exercise.behavior === 'Supportive' ? 'var(--color-accent)' : 'var(--color-ink)',
            }}
          >
            {exercise.behavior}
          </span>
          <span
            style={{
              fontSize: '0.72rem',
              fontFamily: 'var(--font-mono, monospace)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--color-ink-muted)',
            }}
          >
            {exercise.resistanceType}
          </span>
        </div>
        {exercise.copy && (
          <p
            style={{
              fontSize: '0.85rem',
              color: 'var(--color-ink-muted)',
              margin: '0.4rem 0 0',
              maxWidth: '60ch',
            }}
          >
            {exercise.copy}
          </p>
        )}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))',
          gap: '0.85rem',
          alignItems: 'start',
        }}
      >
        {students.map((student) => (
          <StudentColumn
            key={student.id}
            student={student}
            exercise={exercise}
            cfg={getStudentConfig(exercise, student.id)}
            onPatch={(patch) => onPatchStudent(exercise.id, student.id, patch)}
          />
        ))}
      </div>
    </div>
  )
}
