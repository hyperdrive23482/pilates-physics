import { supabaseAdmin } from '../_lib/supabase-admin.js'
import { requireAdmin } from '../_lib/require-admin.js'
import { listAllSubscribersByTag, listSubscribersCreated } from '../_lib/kit.js'
import { getKitMetrics } from '../_lib/kit-metrics.js'
import { parseRange, soft, unwrap } from '../_lib/analytics/shared.js'
import { ALL_PRODUCTS, buildFunnel } from '../_lib/analytics/funnel.js'

// GET /api/admin/funnel?range=30d&product=all
//
// Steps 2 to 6 of the Funnel page and the sources section, from our own
// tables and Kit. Step 1 (web traffic) and the lead step's PostHog panel come
// from /api/admin/funnel-traffic so a slow PostHog never holds this up.
//
// Each source is soft: a missing table or a Kit failure nulls its block and
// lands in `errors`, and the page renders a dash with the reason. Kit is read
// three ways: the offer-window tag (tagged_at is the window's start), the
// subscribers created in the window (Kit sees everyone who filled a form, we
// only see calculator claims), and the cached kit-metrics build for the
// nurture sequence's per-email rates.

const CART_TAG = 'in-HARW-sequence'
const NURTURE_LABEL = 'Nurture'
const ROW_CAP = 20000

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const admin = await requireAdmin(req, res)
  if (!admin) return

  const errors = {}
  const range = parseRange(req.query)
  const product = typeof req.query?.product === 'string' && req.query.product ? req.query.product.slice(0, 80) : ALL_PRODUCTS
  const kitConfigured = Boolean(process.env.KIT_API_KEY)

  try {
    const [purchases, webinars, offers, entitlements, users, attribution, tagged, newSubscribers, nurture] = await Promise.all([
      soft('purchases', errors, async () =>
        unwrap(
          await supabaseAdmin
            .from('purchases')
            .select('id, user_id, email, webinar_id, webinar_slug, pricing, offer_id, purchased_at')
            .order('purchased_at', { ascending: true })
            .limit(ROW_CAP),
        ),
      ),
      unwrap(await supabaseAdmin.from('webinars').select('id, slug, title, kind')),
      soft('offers', errors, async () =>
        unwrap(
          await supabaseAdmin
            .from('subscriber_offers')
            .select('id, offer_key, email, webinar_id, created_at, expires_at, first_seen_at, redeemed_at, redeemed_email')
            .limit(ROW_CAP),
        ),
      ),
      unwrap(await supabaseAdmin.from('user_entitlements').select('user_id, webinar_id, source, granted_at').limit(ROW_CAP)),
      soft('users', errors, async () => unwrap(await supabaseAdmin.rpc('admin_auth_users_brief'))),
      soft('attribution', errors, async () =>
        unwrap(
          await supabaseAdmin
            .from('touch_attribution')
            .select(
              'user_id, email, first_referrer_host, first_utm_source, first_utm_medium, first_utm_campaign, first_landing_path, first_seen_at, last_referrer_host, last_utm_source, last_utm_medium, last_utm_campaign, last_landing_path, last_seen_at',
            )
            .limit(ROW_CAP),
        ),
      ),
      kitConfigured
        ? soft('kit_tag', errors, async () => {
            const subs = await listAllSubscribersByTag(CART_TAG, { status: 'all' })
            return subs.map((s) => ({ email: s.email_address, tagged_at: s.tagged_at ?? null }))
          })
        : null,
      kitConfigured
        ? soft('kit_subscribers', errors, async () => {
            const subs = await listSubscribersCreated({ after: range.from, before: range.to })
            return subs.map((s) => ({ email: s.email_address, created_at: s.created_at ?? null }))
          })
        : null,
      kitConfigured
        ? soft('kit_nurture', errors, async () => {
            const metrics = await getKitMetrics()
            if (metrics.errors?.sequences) throw new Error(metrics.errors.sequences)
            return metrics.sequences?.funnels?.find((f) => f.label === NURTURE_LABEL && !f.missing) ?? null
          })
        : null,
    ])
    if (!kitConfigured) errors.kit = 'KIT_API_KEY is not set'

    const funnel = buildFunnel({
      purchases,
      webinars,
      offers,
      entitlements,
      users,
      attribution,
      kit: { tagged, new_subscribers: newSubscribers, nurture },
      range,
      product,
    })

    return res.status(200).json({
      range: { range: range.range, from: range.from, to: range.to },
      ...funnel,
      errors,
    })
  } catch (err) {
    console.error('admin/funnel error:', err)
    return res.status(500).json({ error: err.message ?? 'Internal error' })
  }
}
