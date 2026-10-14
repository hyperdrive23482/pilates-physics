import { supabaseAdmin } from '../_lib/supabase-admin.js'
import { searchConsoleFromEnv } from '../_lib/seo/gsc.js'
import { runInspect, siteOrigin } from '../_lib/seo/jobs.js'

// Vercel Cron: GET /api/cron/seo-index-inspect, Mondays 09:30 UTC, half an
// hour after the weekly crawl so it reads that run's sitemap paths.
//
// Asks Google's URL Inspection API whether each sitemap page is indexed and
// writes not-indexed pages as findings on the latest run.
export default async function handler(req, res) {
  const expected = process.env.CRON_SECRET
  if (expected && req.headers.authorization !== `Bearer ${expected}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  try {
    const sc = await searchConsoleFromEnv()
    if (sc.error) throw new Error(sc.error)
    const result = await runInspect(supabaseAdmin, sc.gsc, siteOrigin())
    console.log('seo-index-inspect:', JSON.stringify({ ...result, failures: result.failures.length }))
    return res.status(200).json(result)
  } catch (err) {
    console.error('seo-index-inspect failed:', err)
    return res.status(500).json({ ok: false, error: err.message ?? String(err) })
  }
}
