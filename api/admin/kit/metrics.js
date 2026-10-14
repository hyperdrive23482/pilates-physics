import { requireAdmin } from '../../_lib/require-admin.js'
import { getKitMetrics } from '../../_lib/kit-metrics.js'

// GET /api/admin/kit/metrics[?refresh=1]
//
// Everything the admin Kit tab shows, in one response. The computation lives
// in api/_lib/kit-metrics.js so the daily snapshot cron and the Funnel page
// count the Kit funnel exactly the way this tab does.
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const admin = await requireAdmin(req, res)
  if (!admin) return

  if (!process.env.KIT_API_KEY) {
    return res.status(500).json({ error: 'KIT_API_KEY is not set in this environment' })
  }

  try {
    const data = await getKitMetrics({ refresh: req.query?.refresh === '1' })
    return res.status(200).json(data)
  } catch (err) {
    console.error('admin/kit/metrics error:', err)
    return res.status(500).json({ error: err.message ?? 'Failed to load Kit metrics' })
  }
}
