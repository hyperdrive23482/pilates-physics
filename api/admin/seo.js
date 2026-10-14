import { requireAdmin } from '../_lib/require-admin.js'
import { supabaseAdmin } from '../_lib/supabase-admin.js'
import { parseRange } from '../_lib/analytics/shared.js'
import { searchConsoleFromEnv } from '../_lib/seo/gsc.js'
import {
  findings,
  overview,
  pages,
  recommend,
  runCrawl,
  runInspect,
  runPsi,
  runSync,
  search,
  setDismissal,
  siteOrigin,
} from '../_lib/seo/jobs.js'

// Everything /admin/seo reads and does, behind requireAdmin.
// Plan: docs/admin-analytics-engine-plan.md, section 7, part 3b.
//
// Reads are GET ?action=…:
//   overview                     latest run header, Search Console cache state, which keys are set
//   findings   &run_id=          a run's findings, dismissals, index verdicts, 30-day visitors per path
//   pages      &range=30d        per-page PostHog traffic and leads joined to Search Console totals
//   search     &range=90d        Search Console queries, per-page totals, daily series
//
// Actions are POST { action, ... }:
//   dismiss { rule_id, path, reason } / undismiss { rule_id, path }
//   run-audit                    crawl the production site now
//   run-psi { path }             PageSpeed for one page (can take over a minute)
//   run-sync { days?, backfill? } pull Search Console rows
//   run-inspect                  URL Inspection for every sitemap path
//   recommend                    the written recommendations (Opus, metered)
//
// The seo_* tables have RLS on and no policies; this route and the crons are
// the only way in. PostHog is best effort, as on the Funnel page.

const READS = new Set(['overview', 'findings', 'pages', 'search'])

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST')
    return res.status(405).json({ ok: false, error: 'Method not allowed' })
  }
  const admin = await requireAdmin(req, res)
  if (!admin) return

  const body = req.method === 'POST' ? (req.body ?? {}) : {}
  const action = req.method === 'GET' ? req.query?.action : body.action
  if (req.method === 'GET' && !READS.has(action)) {
    return res.status(400).json({ ok: false, error: `Unknown read "${String(action)}"` })
  }

  const origin = siteOrigin()
  try {
    switch (action) {
      case 'overview':
        return res.status(200).json(await overview(supabaseAdmin))
      case 'findings': {
        const runId = Number(req.query?.run_id)
        return res.status(200).json(await findings(supabaseAdmin, Number.isInteger(runId) && runId > 0 ? runId : null))
      }
      case 'pages':
        return res.status(200).json(await pages(supabaseAdmin, parseRange(req.query)))
      case 'search':
        return res.status(200).json(await search(supabaseAdmin, parseRange(req.query)))
      case 'dismiss':
        return res.status(200).json(await setDismissal(supabaseAdmin, body, admin.user.id, true))
      case 'undismiss':
        return res.status(200).json(await setDismissal(supabaseAdmin, body, admin.user.id, false))
      case 'run-audit':
        return res.status(200).json(await runCrawl(supabaseAdmin, origin, 'manual'))
      case 'run-psi':
        return res.status(200).json(await runPsi(supabaseAdmin, origin, body.path))
      case 'run-sync':
      case 'run-inspect': {
        const sc = await searchConsoleFromEnv()
        if (sc.error) return res.status(400).json({ ok: false, error: sc.error })
        const result =
          action === 'run-sync'
            ? await runSync(supabaseAdmin, sc.gsc, { days: body.days, backfill: body.backfill === true })
            : await runInspect(supabaseAdmin, sc.gsc, origin)
        return res.status(200).json(result)
      }
      case 'recommend':
        return res.status(200).json(await recommend(supabaseAdmin, origin, admin.user.id))
      default:
        return res.status(400).json({ ok: false, error: `Unknown action "${String(action)}"` })
    }
  } catch (err) {
    console.error(`admin/seo ${action}:`, err)
    return res.status(500).json({ ok: false, error: err.message ?? String(err) })
  }
}
