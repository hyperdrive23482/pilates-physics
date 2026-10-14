/**
 * The six funnel steps as FunnelStep props, built from the two API responses.
 *
 * Kept out of the page so the one rule that matters can be unit-tested
 * without a DOM: steps 4 to 6 are STANDALONE and carry their own denominator
 * in words. The UI never divides them by the step above, because a workshop
 * buyer this month was usually a lead months ago, and dividing this month's
 * buyers by this month's leads is arithmetic on two unrelated populations.
 * (Ported from remo's FunnelOverview.test.tsx assertion.)
 *
 * `funnel` is the /api/admin/funnel body (or null while loading); `traffic`
 * is the /api/admin/funnel-traffic body (or null). A missing block renders a
 * dash, never a zero.
 */

export const STEP_KEYS = ['traffic', 'leads', 'nurture', 'offer', 'core', 'repeat']

const count = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null)

function plural(n, noun) {
  return `${n.toLocaleString('en-US')} ${noun}${n === 1 ? '' : 's'}`
}

/** "n of m" in words for a standalone step's own denominator. */
export function standaloneText(fractionValue, { noun, verb, none }) {
  if (!fractionValue || typeof fractionValue.m !== 'number') return none
  if (fractionValue.m === 0) return none
  const pct = Math.round((fractionValue.n / fractionValue.m) * 100)
  return `${fractionValue.n} of ${plural(fractionValue.m, noun)} ${verb} · ${pct}%`
}

export function funnelSteps(funnel, traffic, { productLabel = 'any product' } = {}) {
  const visitors = count(traffic?.traffic?.visitors)
  const leads = count(funnel?.leads?.count)
  const nurture = count(funnel?.nurture?.count)
  const offer = count(funnel?.offer?.count)
  const core = count(funnel?.core?.count)
  const repeat = count(funnel?.repeat?.count)

  const priorBuyers = count(funnel?.repeat?.prior_buyers)
  const allTime = funnel?.range?.range === 'all'

  return [
    {
      index: 1,
      key: 'traffic',
      label: 'Web traffic',
      value: visitors,
      comparison: { kind: 'top' },
      caption: 'Unique visitors on public content pages, from PostHog. Below Web Analytics on purpose: admin, portal and stage traffic are left out.',
    },
    {
      index: 2,
      key: 'leads',
      label: 'Calculator leads',
      value: leads,
      comparison: { kind: 'step', previous: visitors, previousIndex: 1 },
      caption: 'People who claimed the free Spring Load Calculator in this window. Kit form subscribers are reported inside, not added.',
    },
    {
      index: 3,
      key: 'nurture',
      label: 'Entered the offer window',
      value: nurture,
      comparison: { kind: 'step', previous: leads, previousIndex: 2 },
      caption: 'Finished nurture and were minted a $39 offer, or picked up the in-HARW-sequence tag, in this window.',
    },
    {
      index: 4,
      key: 'offer',
      label: 'Bought the $39 course',
      value: offer,
      comparison: {
        kind: 'standalone',
        text: standaloneText(funnel?.offer?.expired, {
          noun: 'offer',
          verb: 'that expired in this window were redeemed',
          none: 'No offer windows closed in this window',
        }),
      },
      caption: 'Orders at the offer price. Its own denominator: the offers whose four day window closed inside this range.',
    },
    {
      index: 5,
      key: 'core',
      label: 'Bought a core workshop',
      value: core,
      comparison: {
        kind: 'standalone',
        text: standaloneText(funnel?.core?.was_lead, {
          noun: 'buyer',
          verb: `${funnel?.core?.was_lead?.n === 1 ? 'was' : 'were'} a lead first`,
          none: 'No core orders in this window',
        }),
      },
      caption: `Full price, early bird and bundle orders for ${productLabel}. Not divided by step 3: most buyers were leads long before this window.`,
    },
    {
      index: 6,
      key: 'repeat',
      label: 'Bought again',
      value: repeat,
      comparison: {
        kind: 'standalone',
        text:
          priorBuyers === null
            ? 'Purchases ledger not loaded'
            : allTime
            ? `of ${plural(priorBuyers, 'buyer')} all time`
            : `of ${plural(priorBuyers, 'buyer')} who had bought before this window`,
      },
      caption: 'Buyers whose second or later order fell in this window.',
    },
  ]
}
