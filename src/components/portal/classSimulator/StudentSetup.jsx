import { Plus, X } from 'lucide-react'
import { SegmentedToggle, FieldLabel } from './ui'

const MAX_STUDENTS = 4

const GENDER_OPTIONS = [
  { value: 'woman', label: 'Woman' },
  { value: 'man', label: 'Man' },
]

const inputStyle = {
  width: '100%',
  padding: '0.5rem 0.65rem',
  fontSize: '0.85rem',
  fontFamily: 'var(--font-serif)',
  border: '1px solid var(--color-rule)',
  background: 'var(--color-bg)',
  color: 'var(--color-ink)',
  outline: 'none',
  borderRadius: '2px',
  boxSizing: 'border-box',
}

function StudentCard({ student, index, onChange, onRemove, canRemove }) {
  const num = (v, fallback) => {
    const n = parseFloat(v)
    return Number.isFinite(n) && n > 0 ? n : fallback
  }
  return (
    <div
      style={{
        position: 'relative',
        padding: '1rem',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-rule)',
        borderRadius: '2px',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
      }}
    >
      {canRemove && (
        <button
          type="button"
          aria-label={`Remove student ${index + 1}`}
          onClick={onRemove}
          style={{
            position: 'absolute',
            top: '0.5rem',
            right: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '24px',
            height: '24px',
            border: 'none',
            background: 'transparent',
            color: 'var(--color-ink-muted)',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          <X size={15} strokeWidth={1.75} />
        </button>
      )}
      <div>
        <FieldLabel>Name</FieldLabel>
        <input
          type="text"
          aria-label="Student name"
          value={student.name}
          placeholder={`Student ${index + 1}`}
          onChange={(e) => onChange({ ...student, name: e.target.value })}
          style={inputStyle}
        />
      </div>
      <div style={{ display: 'flex', gap: '0.6rem' }}>
        <div style={{ flex: 1 }}>
          <FieldLabel>Height (in)</FieldLabel>
          <input
            type="number"
            aria-label="Height in inches"
            min={36}
            max={90}
            value={student.heightIn}
            onChange={(e) => onChange({ ...student, heightIn: num(e.target.value, student.heightIn) })}
            style={inputStyle}
          />
        </div>
        <div style={{ flex: 1 }}>
          <FieldLabel>Weight (lbs)</FieldLabel>
          <input
            type="number"
            aria-label="Weight in pounds"
            min={50}
            max={500}
            value={student.weightLb}
            onChange={(e) => onChange({ ...student, weightLb: num(e.target.value, student.weightLb) })}
            style={inputStyle}
          />
        </div>
      </div>
      <div>
        <FieldLabel>Body type</FieldLabel>
        <SegmentedToggle
          ariaLabel="Body type"
          value={student.gender}
          onChange={(gender) => onChange({ ...student, gender })}
          options={GENDER_OPTIONS}
        />
      </div>
    </div>
  )
}

export default function StudentSetup({ students, onStudentsChange, onStart, onAddStudent }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <p style={{ fontSize: '0.9rem', color: 'var(--color-ink-muted)', margin: 0 }}>
        Set up your class of up to {MAX_STUDENTS} students, then walk through each exercise to see
        how the same setup loads each body differently.
      </p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '0.85rem',
        }}
      >
        {students.map((student, i) => (
          <StudentCard
            key={student.id}
            student={student}
            index={i}
            canRemove={students.length > 1}
            onChange={(next) =>
              onStudentsChange(students.map((s) => (s.id === student.id ? next : s)))
            }
            onRemove={() => onStudentsChange(students.filter((s) => s.id !== student.id))}
          />
        ))}
        {students.length < MAX_STUDENTS && (
          <button
            type="button"
            onClick={onAddStudent}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              minHeight: '120px',
              border: '1px dashed var(--color-rule)',
              borderRadius: '2px',
              background: 'transparent',
              color: 'var(--color-ink-muted)',
              fontFamily: 'var(--font-serif)',
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            <Plus size={15} strokeWidth={1.75} /> Add student
          </button>
        )}
      </div>
      <div>
        <button
          type="button"
          onClick={onStart}
          style={{
            padding: '0.65rem 1.5rem',
            fontSize: '0.9rem',
            fontFamily: 'var(--font-serif)',
            fontWeight: 600,
            letterSpacing: '0.02em',
            background: 'var(--color-accent)',
            color: 'var(--color-accent-ink)',
            border: 'none',
            borderRadius: '2px',
            cursor: 'pointer',
          }}
        >
          Start class
        </button>
      </div>
    </div>
  )
}
