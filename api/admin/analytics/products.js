import { supabaseAdmin } from '../../_lib/supabase-admin.js'
import { requireAdmin } from '../../_lib/require-admin.js'
import { parseRange, soft, unwrap } from '../../_lib/analytics/shared.js'
import { buildProducts } from '../../_lib/analytics/products.js'

// GET /api/admin/analytics/products?range=30d
//
// One row per workshop or course: enrollments by source, orders and revenue
// in the range, portal and recording reach, certificate downloads, NPS from
// workshop_feedback, open questions, and the content items ranked by distinct
// openers for the expanded row.
//
// Engagement columns come from admin_engagement_by_item (migration 063) and
// are all time. Orders come from the purchases ledger (062). Either missing
// nulls its columns and lands in `errors`.

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
    const [webinars, entitlements, questions, content, purchases, feedback, items, scholarships] = await Promise.all([
      unwrap(
        await supabaseAdmin
          .from('webinars')
          .select('id, title, slug, kind, status, scheduled_at, survey_config')
          .in('kind', ['webinar', 'course']),
      ),
      unwrap(await supabaseAdmin.from('user_entitlements').select('user_id, webinar_id, source')),
      unwrap(await supabaseAdmin.from('webinar_questions').select('webinar_id, is_answered')),
      unwrap(await supabaseAdmin.from('webinar_content').select('id, webinar_id, title, type')),
      soft('purchases', errors, async () =>
        unwrap(
          await supabaseAdmin
            .from('purchases')
            .select(
              'id, webinar_id, purchased_at, settled_usd_cents, presentment_currency, presentment_amount_cents, refund_usd_cents, dispute_status',
            ),
        ),
      ),
      soft('feedback', errors, async () =>
        unwrap(await supabaseAdmin.from('workshop_feedback').select('webinar_id, nps_score, responses')),
      ),
      soft('engagement', errors, async () =>
        unwrap(
          await supabaseAdmin
            .from('admin_engagement_by_item')
            .select('event_type, item_key, label, webinar_id, opens, distinct_users'),
        ),
      ),
      soft('scholarships', errors, async () =>
        unwrap(await supabaseAdmin.from('scholarship_enrollments').select('user_id, webinar_id')),
      ),
    ])

    const { products } = buildProducts({
      webinars,
      entitlements,
      purchases,
      questions,
      feedback,
      items,
      content,
      scholarships,
      range,
    })

    return res.status(200).json({
      range: { range: range.range, from: range.from, to: range.to },
      products,
      errors,
    })
  } catch (err) {
    console.error('analytics/products error:', err)
    return res.status(500).json({ error: err.message ?? 'Internal error' })
  }
}
