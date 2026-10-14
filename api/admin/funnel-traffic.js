import { requireAdmin } from '../_lib/require-admin.js'
import { postHogFromEnv } from '../_lib/posthog.js'
import { parseRange, soft } from '../_lib/analytics/shared.js'
import { fetchPreLead, fetchTraffic } from '../_lib/analytics/funnel-traffic.js'

// GET /api/admin/funnel-traffic?range=30d&claims=12
//
// The PostHog half of the Funnel page: step 1 (web traffic on content pages,
// with channel, referrer, campaign and geography breakdowns) and the lead
// step's "what they looked at before claiming" panel. Separate from
// /api/admin/funnel so PostHog's latency, or its absence, costs only these
// two panels.
//
// `claims` is the lead count the page already has from /api/admin/funnel for
// the same range, so the pre-lead panel can say "measured n of m".
//
// Best effort throughout: when PostHog is not configured or a query fails,
// the block is null and `errors` carries the reason. Nothing here is ever a
// 500 for PostHog's sake.

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const admin = await requireAdmin(req, res)
  if (!admin) return

  const errors = {}
  const range = parseRange(req.query)
  const claimsRaw = Number(req.query?.claims)
  const claimsInDb = Number.isFinite(claimsRaw) && claimsRaw >= 0 ? Math.floor(claimsRaw) : null

  const ph = postHogFromEnv()
  if (ph.error) {
    errors.posthog = ph.error
    return res.status(200).json({ range: { range: range.range, from: range.from, to: range.to }, traffic: null, pre_lead: null, errors })
  }

  const [traffic, preLead] = await Promise.all([
    soft('traffic', errors, () => fetchTraffic(ph.client, ph.prodHost, range.from, range.to)),
    soft('pre_lead', errors, () => fetchPreLead(ph.client, ph.prodHost, range.from, range.to, { claimsInDb })),
  ])

  return res.status(200).json({
    range: { range: range.range, from: range.from, to: range.to },
    host: ph.prodHost,
    traffic,
    pre_lead: preLead,
    errors,
  })
}
