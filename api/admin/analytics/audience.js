import { supabaseAdmin } from '../../_lib/supabase-admin.js'
import { requireAdmin } from '../../_lib/require-admin.js'
import { getGrowthStats } from '../../_lib/kit.js'
import { parseRange, soft, unwrap } from '../../_lib/analytics/shared.js'
import { buildAudience } from '../../_lib/analytics/audience.js'

// GET /api/admin/analytics/audience?range=30d
//
// Who the accounts are and where they came from: Kit subscribers over time
// (daily_snapshots, 063), new accounts in the range by how they became known
// to us, leads who went on to buy, first and last touch breakdowns from
// touch_attribution (061), and the most recent accounts for a row-expand
// timeline.
//
// PostHog geography is Phase 2 and is not read here.
//
// Each source is soft: a missing table nulls its block and lands in `errors`.
// Kit is read live for the headline subscriber count (one call, cached by
// Kit's own limits) and falls back to the latest snapshot.

const isoDate = (d) => d.toISOString().slice(0, 10)

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const admin = await requireAdmin(req, res)
  if (!admin) return

  const errors = {}
  const range = parseRange(req.query)

  try {
    const [users, entitlements, webinars, attribution, snapshots, kitLive] = await Promise.all([
      soft('users', errors, async () => unwrap(await supabaseAdmin.rpc('admin_auth_users_brief'))),
      unwrap(await supabaseAdmin.from('user_entitlements').select('user_id, webinar_id, source, granted_at')),
      unwrap(await supabaseAdmin.from('webinars').select('id, title, kind')),
      soft('attribution', errors, async () =>
        unwrap(
          await supabaseAdmin
            .from('touch_attribution')
            .select(
              'user_id, created_at, recorded_via, first_referrer_host, first_utm_source, first_utm_medium, first_utm_campaign, first_landing_path, first_seen_at, last_referrer_host, last_utm_source, last_utm_medium, last_utm_campaign, last_landing_path, last_seen_at',
            ),
        ),
      ),
      soft('snapshots', errors, async () =>
        unwrap(
          await supabaseAdmin
            .from('daily_snapshots')
            .select('snapshot_date, kit, users')
            .order('snapshot_date', { ascending: true })
            .limit(800),
        ),
      ),
      process.env.KIT_API_KEY
        ? soft('kit', errors, async () => {
            const now = new Date()
            const weekAgo = new Date(now.getTime() - 7 * 86400000)
            const growth = await getGrowthStats({ starting: isoDate(weekAgo), ending: isoDate(now) })
            return growth?.subscribers != null ? { subscribers: growth.subscribers } : null
          })
        : null,
    ])
    if (!process.env.KIT_API_KEY) errors.kit = 'KIT_API_KEY is not set'

    const audience = users
      ? buildAudience({ users, entitlements, attribution, snapshots, webinars, kitLive, range })
      : null

    return res.status(200).json({
      range: { range: range.range, from: range.from, to: range.to },
      audience,
      errors,
    })
  } catch (err) {
    console.error('analytics/audience error:', err)
    return res.status(500).json({ error: err.message ?? 'Internal error' })
  }
}
