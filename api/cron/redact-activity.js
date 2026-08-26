import { supabaseAdmin } from '../_lib/supabase-admin.js'

// Vercel Cron: GET /api/cron/redact-activity
//
// Retention sweep for activity_events. After 26 months the IP address and
// user agent are nulled; the rest of the record is kept, so historical
// engagement stays countable without holding personal data longer than the
// stated purpose (fraud prevention and payment-dispute defence) requires.
//
// Rows are never deleted here. Migration 043's trigger permits exactly this
// redaction on past-horizon rows and nothing else.
const RETENTION_MONTHS = 26

// The trigger recomputes `now() - interval '26 months'` at statement time,
// which is marginally later than this value, so anything selected here is
// safely past its horizon. The extra two days cover the one case where JS and
// Postgres month arithmetic disagree: setUTCMonth overflows short months
// (Mar 31 minus 1 month gives Mar 3) where Postgres clamps to Feb 28.
function retentionHorizon() {
  const d = new Date()
  d.setUTCMonth(d.getUTCMonth() - RETENTION_MONTHS)
  d.setUTCDate(d.getUTCDate() - 2)
  return d.toISOString()
}

export default async function handler(req, res) {
  // Verify the cron secret. Vercel sends this header when CRON_SECRET is set.
  const auth = req.headers.authorization
  const expected = process.env.CRON_SECRET
  if (expected && auth !== `Bearer ${expected}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const horizon = retentionHorizon()

  try {
    const { count, error } = await supabaseAdmin
      .from('activity_events')
      .update({ ip_address: null, user_agent: null }, { count: 'exact' })
      .lte('created_at', horizon)
      .or('ip_address.not.is.null,user_agent.not.is.null')
    if (error) throw error

    if (count) console.log(`redact-activity: redacted ${count} rows older than ${horizon}`)
    return res.status(200).json({ ok: true, horizon, redacted: count ?? 0 })
  } catch (err) {
    console.error('redact-activity error:', err)
    return res.status(500).json({ error: err.message ?? 'Internal error' })
  }
}
