import { supabaseAdmin } from '../_lib/supabase-admin.js'
import { runCrawl, siteOrigin } from '../_lib/seo/jobs.js'

// Vercel Cron: GET /api/cron/seo-audit, Mondays 09:00 UTC.
//
// Crawls the production site and stores a run with its findings (see
// api/_lib/seo/). The site changes on deploy, not on a clock: weekly is a
// backstop so a regression is never more than a week old, and the Run audit
// button on /admin/seo is for the day something ships.
export default async function handler(req, res) {
  const expected = process.env.CRON_SECRET
  if (expected && req.headers.authorization !== `Bearer ${expected}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  try {
    const result = await runCrawl(supabaseAdmin, siteOrigin(), 'cron')
    console.log('seo-audit:', JSON.stringify(result))
    return res.status(200).json(result)
  } catch (err) {
    console.error('seo-audit failed:', err)
    return res.status(500).json({ ok: false, error: err.message ?? String(err) })
  }
}
