import { supabaseAdmin } from '../../_lib/supabase-admin.js'
import { requireAdmin } from '../../_lib/require-admin.js'
import { parseRange, soft, unwrap } from '../../_lib/analytics/shared.js'
import { buildEngagement } from '../../_lib/analytics/engagement.js'

// GET /api/admin/analytics/engagement?range=30d
//
// Active people, logins, portal views and events in the range with a daily
// series for the chart; tools and content ranked by distinct people; sessions
// by weekday and hour of day (Pacific); and buyers who have never signed in,
// split by how long ago they bought.
//
// Rankings and time of day use the 064 functions for the range and fall back
// to the all-time view from 063 when 064 is not applied yet; the response says
// which scope it is reporting so the tab can label it.

const TIME_ZONE = 'America/Los_Angeles'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const admin = await requireAdmin(req, res)
  if (!admin) return

  const errors = {}
  const range = parseRange(req.query)
  const since = range.from ?? null

  try {
    const [dailyRows, rangeItems, hourly, activeUsers, users, entitlements] = await Promise.all([
      soft('engagement_daily', errors, async () =>
        unwrap(
          await supabaseAdmin
            .from('admin_engagement_daily')
            .select('day, event_type, webinar_id, events, distinct_users')
            .limit(20000),
        ),
      ),
      soft('engagement_items', errors, async () =>
        unwrap(await supabaseAdmin.rpc('admin_engagement_items', { p_since: since })),
      ),
      soft('engagement_hourly', errors, async () =>
        unwrap(await supabaseAdmin.rpc('admin_engagement_hourly', { p_since: since, p_tz: TIME_ZONE })),
      ),
      soft('active_users', errors, async () =>
        unwrap(await supabaseAdmin.rpc('count_active_users', { p_since: since ?? '1970-01-01T00:00:00Z' })),
      ),
      soft('users', errors, async () => unwrap(await supabaseAdmin.rpc('admin_auth_users_brief'))),
      unwrap(await supabaseAdmin.from('user_entitlements').select('user_id, source, granted_at')),
    ])

    // 064 not applied: fall back to the all-time ranking view from 063.
    let items = rangeItems
    let itemsScope = 'range'
    if (!items) {
      items = await soft('engagement_by_item', errors, async () =>
        unwrap(
          await supabaseAdmin
            .from('admin_engagement_by_item')
            .select('event_type, item_key, label, webinar_id, opens, distinct_users'),
        ),
      )
      itemsScope = 'all'
    }

    const engagement = buildEngagement({
      dailyRows,
      items,
      itemsScope,
      hourly,
      activeUsers,
      users,
      entitlements,
      fromDay: range.from_day,
    })

    return res.status(200).json({
      range: { range: range.range, from: range.from, to: range.to },
      engagement,
      time_zone: TIME_ZONE,
      errors,
    })
  } catch (err) {
    console.error('analytics/engagement error:', err)
    return res.status(500).json({ error: err.message ?? 'Internal error' })
  }
}
