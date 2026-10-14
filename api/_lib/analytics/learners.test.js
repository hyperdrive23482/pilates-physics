import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildCourse, questionMissRates } from './learners.js'

const NOW = new Date('2026-10-14T12:00:00Z')

const COURSE = { id: 'c', title: 'How a Reformer Works', slug: 'harw', quiz_pass_pct: 80 }
const MODULES = [
  { id: 'm2', sort_order: 1, title: 'Springs' },
  { id: 'm1', sort_order: 0, title: 'Carriage' },
  { id: 'm3', sort_order: 2, title: 'Straps' },
]
const QUESTIONS = [
  { id: 'q1', sort_order: 0, prompt: 'One', correct_index: 0 },
  { id: 'q2', sort_order: 1, prompt: 'Two', correct_index: 2 },
]
const ENTS = [
  { user_id: 'u1', granted_at: '2026-09-01T00:00:00Z', source: 'stripe' },
  { user_id: 'u2', granted_at: '2026-09-10T00:00:00Z', source: 'stripe' },
  { user_id: 'u3', granted_at: '2026-09-20T00:00:00Z', source: 'manual' },
  { user_id: 'u4', granted_at: '2026-10-12T00:00:00Z', source: 'stripe' },
]
const PROGRESS = [
  { user_id: 'u1', module_id: 'm1', completed_at: '2026-09-03T00:00:00Z' },
  { user_id: 'u1', module_id: 'm2', completed_at: '2026-09-04T00:00:00Z' },
  { user_id: 'u1', module_id: 'm3', completed_at: '2026-09-05T00:00:00Z' },
  { user_id: 'u2', module_id: 'm1', completed_at: '2026-09-15T00:00:00Z' },
  { user_id: 'u5', module_id: 'm1', completed_at: '2026-09-15T00:00:00Z' },
  { user_id: 'u2', module_id: 'zzz', completed_at: '2026-09-15T00:00:00Z' },
]
const ATTEMPTS = [
  { user_id: 'u1', answers: [0, 1], score: 1, total: 2, passed: false, created_at: '2026-09-06T00:00:00Z' },
  { user_id: 'u1', answers: [0, 2], score: 2, total: 2, passed: true, created_at: '2026-09-07T00:00:00Z' },
  { user_id: 'u2', answers: [0, 2], score: 2, total: 2, passed: true, created_at: '2026-09-16T00:00:00Z' },
  { user_id: 'u2', answers: [0], score: 1, total: 1, passed: true, created_at: '2026-08-01T00:00:00Z' },
]
const USERS = new Map([
  ['u3', { email: 'three@example.com', last_sign_in_at: null }],
  ['u4', { email: 'four@example.com', last_sign_in_at: '2026-10-12T01:00:00Z' }],
])

test('questionMissRates skips attempts whose answer count no longer matches', () => {
  const r = questionMissRates(QUESTIONS, ATTEMPTS)
  assert.equal(r.graded_attempts, 3)
  assert.equal(r.unmatched_attempts, 1)
  assert.deepEqual(
    r.questions.map((q) => [q.position, q.misses, q.miss_rate]),
    [
      [1, 0, 0],
      [2, 1, 1 / 3],
    ],
  )
})

test('funnel counts distinct learners per step out of enrolled', () => {
  const course = buildCourse({
    course: COURSE,
    modules: MODULES,
    entitlements: ENTS,
    progress: PROGRESS,
    attempts: ATTEMPTS,
    questions: QUESTIONS,
    certificateUsers: ['u1', 'u9'],
    users: USERS,
    now: NOW,
  })
  assert.equal(course.enrolled, 4)
  assert.equal(course.unenrolled_active, 1)
  assert.equal(course.module_count, 3)
  assert.deepEqual(
    course.funnel.map((s) => [s.label, s.count, s.of]),
    [
      ['Enrolled', 4, 4],
      ['Started', 3, 4],
      ['Module 1: Carriage', 3, 4],
      ['Module 2: Springs', 1, 4],
      ['Module 3: Straps', 1, 4],
      ['Attempted the quiz', 2, 4],
      ['Passed the quiz', 2, 4],
      ['Downloaded the certificate', 1, 4],
    ],
  )
})

test('timing medians run from access granted', () => {
  const course = buildCourse({
    course: COURSE,
    modules: MODULES,
    entitlements: ENTS,
    progress: PROGRESS,
    attempts: ATTEMPTS,
    questions: QUESTIONS,
    certificateUsers: null,
    users: USERS,
    now: NOW,
  })
  // u1: 2 days to first module, u2: 5 days. Median 3.5.
  assert.equal(course.timing.to_first_module_days, 3.5)
  assert.equal(course.timing.to_first_module_n, 2)
  // u1 passed 6 days in, u2's earliest pass predates the grant and is dropped.
  assert.equal(course.timing.to_completion_days, 6)
  assert.equal(course.timing.to_completion_n, 1)
  assert.equal(course.funnel.at(-1).count, null)
})

test('quiz stats and stalled learners', () => {
  const course = buildCourse({
    course: COURSE,
    modules: MODULES,
    entitlements: ENTS,
    progress: PROGRESS,
    attempts: ATTEMPTS,
    questions: QUESTIONS,
    certificateUsers: [],
    users: USERS,
    now: NOW,
  })
  assert.equal(course.quiz.attempts, 4)
  assert.deepEqual(course.quiz.pass_rate, { n: 2, m: 2 })
  // u1's first attempt failed; u2's first (August) attempt passed.
  assert.deepEqual(course.quiz.first_attempt_pass_rate, { n: 1, m: 2 })
  assert.equal(course.quiz.attempts_per_passer, 2)
  // u3: granted 24 days ago, nothing done. u4 is too recent. u2 passed.
  assert.deepEqual(
    course.stalled.map((s) => [s.user_id, s.email, s.days_since_purchase, s.modules_done]),
    [['u3', 'three@example.com', 24, 0]],
  )
})

test('a course with no modules or attempts still builds', () => {
  const course = buildCourse({
    course: COURSE,
    modules: [],
    entitlements: [],
    progress: [],
    attempts: [],
    questions: [],
    certificateUsers: [],
    users: new Map(),
    now: NOW,
  })
  assert.equal(course.enrolled, 0)
  assert.equal(course.timing.to_first_module_days, null)
  assert.equal(course.quiz.attempts_per_passer, null)
  assert.deepEqual(course.stalled, [])
})
