// Shared by /scholarship. The option values here must match
// api/_lib/scholarship-config.js and the validator in api/inquiry.js.

export const SCHOLARSHIP_PATH = '/scholarship'

// Minimum length for each written answer. Matches SCHOLARSHIP_MIN_CHARS in
// api/inquiry.js.
export const MIN_CHARS = 150

// seriesPrefix courses are dated cohorts, and the form shows the next date
// (or TBD). onDemand courses have no date.
export const COURSE_OPTIONS = [
  { value: 'pp101', label: 'Pilates Physics 101', price: '$19', full: '$129', seriesPrefix: 'PP-101' },
  { value: 'pp102', label: 'Pilates Physics 102', price: '$19', full: '$129', seriesPrefix: 'PP-102' },
  { value: 'harw', label: 'How a Reformer Works', price: '$9', full: '$69', onDemand: true },
]

// 'other' requires a short description (pathStageOther).
export const STAGE_OPTIONS = [
  { value: 'fulltime', label: 'Teaching Pilates full time' },
  { value: 'parttime', label: 'Teaching Pilates part-time' },
  { value: 'training', label: 'In teacher training' },
  { value: 'other', label: 'Other' },
]
