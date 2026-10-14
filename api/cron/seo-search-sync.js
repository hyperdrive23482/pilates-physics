import { supabaseAdmin } from '../_lib/supabase-admin.js'
import { searchConsoleFromEnv } from '../_lib/seo/gsc.js'
import { runSync } from '../_lib/seo/jobs.js'

// Vercel Cron: GET /api/cron/seo-search-sync, daily 06:30 UTC.
//
// Pulls the last three days of Search Console rows into seo_search_daily
// (Google restates recent days as its data settles). The 16 month backfill is
// a button on /admin/seo, run once after the first deploy.
//
// Fails loudly when GSC_SERVICE_ACCOUNT_JSON or GSC_PROPERTY is missing: a
// sync that silently did nothing would be worse.
export default async function handler(req, res) {
  const expected = process.env.CRON_SECRET
  if (expected && req.headers.authorization !== `Bearer ${expected}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  try {
    const sc = await searchConsoleFromEnv()
    if (sc.error) throw new Error(sc.error)
    const result = await runSync(supabaseAdmin, sc.gsc)
    console.log('seo-search-sync:', JSON.stringify(result))
    return res.status(200).json(result)
  } catch (err) {
    console.error('seo-search-sync failed:', err)
    return res.status(500).json({ ok: false, error: err.message ?? String(err) })
  }
}
