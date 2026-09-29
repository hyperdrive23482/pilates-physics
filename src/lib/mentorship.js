// Shared between the /mentorship landing page and /mentorship/apply.
// Program facts live in docs/mentorship-program-spec.md; change them there
// first. The option values here must match the validators in api/inquiry.js
// and the labels in api/_lib/resend.js.

export const MENTORSHIP_PATH = '/mentorship'
export const APPLY_PATH = '/mentorship/apply'

export const PRICE_FULL = '$399'
export const PRICE_INSTALLMENT = '$229'
export const PRICE_INSTALLMENT_TOTAL = '$458'

export const APPLY_DEADLINE = 'October 8'

export const YEARS_OPTIONS = [
  { value: '<1', label: 'Less than 1 year' },
  { value: '1-2', label: '1 to 2 years' },
  { value: '3-5', label: '3 to 5 years' },
  { value: '5+', label: 'More than 5 years' },
]

export const PLAN_OPTIONS = [
  { value: 'full', label: `${PRICE_FULL} one-time payment` },
  { value: 'two', label: `2 payments of ${PRICE_INSTALLMENT} (${PRICE_INSTALLMENT_TOTAL} total)` },
]

export const EQUIPMENT_OPTIONS = ['Reformer', 'Tower', 'Chair', 'Cadillac', 'Mat only', 'Other']
