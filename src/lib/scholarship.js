// Shared by /scholarship. The option values here must match
// api/_lib/scholarship-config.js and the validator in api/inquiry.js.

export const SCHOLARSHIP_PATH = '/scholarship'

// Minimum length for each written answer. Matches SCHOLARSHIP_MIN_CHARS in
// api/inquiry.js.
export const MIN_CHARS = 150

export const COURSE_OPTIONS = [
  { value: 'pp101', label: 'Pilates Physics 101', price: '$19', full: '$129' },
  { value: 'pp102', label: 'Pilates Physics 102', price: '$19', full: '$129' },
  { value: 'harw', label: 'How a Reformer Works', price: '$9', full: '$69' },
]

export const STAGE_OPTIONS = [
  { value: 'teaching', label: 'Teaching Pilates now' },
  { value: 'training', label: 'In a Pilates teacher training' },
  { value: 'planning', label: 'Planning to train as a Pilates teacher' },
  { value: 'movement', label: 'Another movement or fitness professional' },
  { value: 'other', label: 'Something else' },
]
