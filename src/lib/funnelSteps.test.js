import { test } from 'node:test'
import assert from 'node:assert/strict'
import { STEP_KEYS, funnelSteps, standaloneText } from './funnelSteps.js'

const FUNNEL = {
  range: { range: '30d' },
  leads: { count: 40 },
  nurture: { count: 25 },
  offer: { count: 6, expired: { n: 6, m: 30 } },
  core: { count: 9, was_lead: { n: 7, m: 9 } },
  repeat: { count: 2, prior_buyers: 120 },
}
const TRAFFIC = { traffic: { visitors: 1600 } }

test('six steps in order, steps 2 and 3 divide by the step above', () => {
  const steps = funnelSteps(FUNNEL, TRAFFIC)
  assert.deepEqual(
    steps.map((s) => s.key),
    STEP_KEYS,
  )
  assert.deepEqual(steps.map((s) => s.index), [1, 2, 3, 4, 5, 6])
  assert.deepEqual(steps[0].comparison, { kind: 'top' })
  assert.deepEqual(steps[1].comparison, { kind: 'step', previous: 1600, previousIndex: 1 })
  assert.deepEqual(steps[2].comparison, { kind: 'step', previous: 40, previousIndex: 2 })
})

test('steps 4 to 6 are standalone whatever the data, and never reference the step above', () => {
  const cases = [
    [FUNNEL, TRAFFIC],
    [null, null],
    [{ ...FUNNEL, offer: { count: 0, expired: { n: 0, m: 0 } }, core: { count: 0 }, repeat: { count: 0, prior_buyers: 0 } }, TRAFFIC],
    [{ ...FUNNEL, range: { range: 'all' } }, { traffic: null }],
  ]
  for (const [funnel, traffic] of cases) {
    const steps = funnelSteps(funnel, traffic)
    for (const step of steps.slice(3)) {
      assert.equal(step.comparison.kind, 'standalone', `${step.key} must be standalone`)
      assert.equal(typeof step.comparison.text, 'string')
      assert.ok(!('previous' in step.comparison), `${step.key} must not carry a previous count`)
      assert.ok(!/of step \d/.test(step.comparison.text), `${step.key} text must not cite a step`)
    }
  }
})

test('standalone texts speak in their own denominators', () => {
  const steps = funnelSteps(FUNNEL, TRAFFIC)
  assert.equal(steps[3].comparison.text, '6 of 30 offers that expired in this window were redeemed · 20%')
  assert.equal(steps[4].comparison.text, '7 of 9 buyers were a lead first · 78%')
  assert.equal(steps[5].comparison.text, 'of 120 buyers who had bought before this window')

  const allTime = funnelSteps({ ...FUNNEL, range: { range: 'all' } }, TRAFFIC)
  assert.equal(allTime[5].comparison.text, 'of 120 buyers all time')

  const one = funnelSteps({ ...FUNNEL, core: { count: 1, was_lead: { n: 1, m: 1 } }, repeat: { count: 0, prior_buyers: 1 } }, TRAFFIC)
  assert.equal(one[4].comparison.text, '1 of 1 buyer was a lead first · 100%')
  assert.equal(one[5].comparison.text, 'of 1 buyer who had bought before this window')
})

test('missing blocks render as null values, never zero', () => {
  const steps = funnelSteps(null, null)
  for (const s of steps) assert.equal(s.value, null)
  assert.equal(steps[3].comparison.text, 'No offer windows closed in this window')
  assert.equal(steps[5].comparison.text, 'Purchases ledger not loaded')
  assert.equal(standaloneText(null, { noun: 'x', verb: 'y', none: 'none' }), 'none')
  assert.equal(standaloneText({ n: 0, m: 0 }, { noun: 'x', verb: 'y', none: 'none' }), 'none')
})
