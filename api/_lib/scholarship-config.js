// Scholarship constants, kept free of Stripe and Supabase imports so
// resend.js and inquiry.js can use them without pulling either client in.
// Keep the course keys and stage options in step with src/lib/scholarship.js.

export const COUPON_PREFIX = 'scholarship-'
export const CODE_LIFETIME_DAYS = 30

export const SCHOLARSHIP_COURSES = {
  pp101: {
    label: 'Pilates Physics 101',
    codeTag: '101',
    seriesPrefix: 'PP-101',
    path: '/pilates-physics-101',
    targetCents: 1900,
  },
  pp102: {
    label: 'Pilates Physics 102',
    codeTag: '102',
    seriesPrefix: 'PP-102',
    path: '/pilates-physics-102',
    targetCents: 1900,
  },
  harw: {
    label: 'How a Reformer Works',
    codeTag: 'HARW',
    slug: 'how-a-reformer-works',
    path: '/how-a-reformer-works',
    targetCents: 900,
  },
}

export const PATH_STAGE_LABEL = {
  teaching: 'Teaching Pilates now',
  training: 'In a Pilates teacher training',
  planning: 'Planning to train as a Pilates teacher',
  movement: 'Another movement or fitness professional',
  other: 'Something else',
}
