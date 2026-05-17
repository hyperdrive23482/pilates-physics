import { supabaseAdmin } from '../_lib/supabase-admin.js'
import { requireAdmin } from '../_lib/require-admin.js'

// Returns every workshop_feedback row (admin-gated) plus per-workshop
// aggregates (NPS distribution + multi-choice tallies). The dataset is
// small — one row per attendee per workshop — so we send it all and let
// the client filter by selected workshop.
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const admin = await requireAdmin(req, res)
  if (!admin) return

  try {
    const { data: rows, error } = await supabaseAdmin
      .from('workshop_feedback')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    const byWorkshop = {}
    for (const row of rows ?? []) {
      const key = `${row.workshop_title}|${row.workshop_date}`
      if (!byWorkshop[key]) {
        byWorkshop[key] = {
          workshop_title: row.workshop_title,
          workshop_date: row.workshop_date,
          response_count: 0,
          nps_sum: 0,
          nps_distribution: Object.fromEntries(
            Array.from({ length: 10 }, (_, i) => [i + 1, 0])
          ),
          years_teaching_counts: {},
          valuable_sections_counts: {},
          rushed_section_counts: {},
          length_feedback_counts: {},
          share_permission_counts: {},
          responses: [],
        }
      }
      const bucket = byWorkshop[key]
      bucket.response_count += 1
      bucket.nps_sum += row.nps_score
      bucket.nps_distribution[row.nps_score] =
        (bucket.nps_distribution[row.nps_score] ?? 0) + 1
      bucket.years_teaching_counts[row.years_teaching] =
        (bucket.years_teaching_counts[row.years_teaching] ?? 0) + 1
      for (const v of row.valuable_sections ?? []) {
        bucket.valuable_sections_counts[v] =
          (bucket.valuable_sections_counts[v] ?? 0) + 1
      }
      bucket.rushed_section_counts[row.rushed_section] =
        (bucket.rushed_section_counts[row.rushed_section] ?? 0) + 1
      bucket.length_feedback_counts[row.length_feedback] =
        (bucket.length_feedback_counts[row.length_feedback] ?? 0) + 1
      bucket.share_permission_counts[row.share_permission] =
        (bucket.share_permission_counts[row.share_permission] ?? 0) + 1
      bucket.responses.push(row)
    }

    const workshops = []
    for (const [key, b] of Object.entries(byWorkshop)) {
      b.avg_nps = b.response_count
        ? Number((b.nps_sum / b.response_count).toFixed(2))
        : null
      b.promoter_count = Object.entries(b.nps_distribution)
        .filter(([n]) => Number(n) >= 9)
        .reduce((s, [, c]) => s + c, 0)
      b.detractor_count = Object.entries(b.nps_distribution)
        .filter(([n]) => Number(n) <= 6)
        .reduce((s, [, c]) => s + c, 0)
      delete b.nps_sum

      workshops.push({
        key,
        workshop_title: b.workshop_title,
        workshop_date: b.workshop_date,
        count: b.response_count,
        avg_nps: b.avg_nps,
      })
    }

    workshops.sort((a, b) => (a.workshop_date < b.workshop_date ? 1 : -1))

    return res.status(200).json({ workshops, by_workshop: byWorkshop })
  } catch (err) {
    console.error('workshop-feedback admin error:', err)
    return res.status(500).json({ error: err.message ?? 'Internal error' })
  }
}
