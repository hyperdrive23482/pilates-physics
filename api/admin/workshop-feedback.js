import { supabaseAdmin } from '../_lib/supabase-admin.js'
import { requireAdmin } from '../_lib/require-admin.js'
import { normalizeRowResponses } from '../_lib/survey-validation.js'

// Returns every workshop_feedback row (admin-gated) plus per-workshop
// aggregates derived from each workshop's survey_config. Workshops with
// an enabled survey but no responses yet are included so the admin
// dropdown shows them before the first submission.
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const admin = await requireAdmin(req, res)
  if (!admin) return

  try {
    const [feedbackRes, webinarsRes] = await Promise.all([
      supabaseAdmin
        .from('workshop_feedback')
        .select('*')
        .order('created_at', { ascending: false }),
      supabaseAdmin
        .from('webinars')
        .select('id, slug, title, scheduled_at, survey_config'),
    ])

    if (feedbackRes.error) throw feedbackRes.error
    if (webinarsRes.error) throw webinarsRes.error

    const rows = feedbackRes.data ?? []
    const webinars = webinarsRes.data ?? []

    const webinarById = new Map(webinars.map((w) => [w.id, w]))
    const webinarByTitleDate = new Map()
    for (const w of webinars) {
      if (!w.scheduled_at) continue
      const date = new Date(w.scheduled_at).toISOString().slice(0, 10)
      webinarByTitleDate.set(`${w.title}|${date}`, w)
    }

    const byWorkshop = {}

    function ensureBucket(key, workshop) {
      if (byWorkshop[key]) return byWorkshop[key]
      const date =
        workshop?.scheduled_at
          ? new Date(workshop.scheduled_at).toISOString().slice(0, 10)
          : null
      byWorkshop[key] = {
        key,
        webinar_id: workshop?.id ?? null,
        slug: workshop?.slug ?? null,
        workshop_title: workshop?.title ?? null,
        workshop_date: date,
        survey_config: workshop?.survey_config ?? null,
        response_count: 0,
        nps: null,
        aggregates: {},
        responses: [],
      }
      return byWorkshop[key]
    }

    // Seed buckets for enabled-survey workshops so they appear in the
    // dropdown before any responses arrive.
    for (const w of webinars) {
      if (!w.survey_config?.enabled) continue
      const key = w.id ? `wid:${w.id}` : null
      if (!key) continue
      const bucket = ensureBucket(key, w)
      bucket.workshop_title = w.title
      bucket.slug = w.slug
    }

    for (const row of rows) {
      const workshop = row.webinar_id
        ? webinarById.get(row.webinar_id)
        : webinarByTitleDate.get(`${row.workshop_title}|${row.workshop_date}`)
      const key = workshop?.id
        ? `wid:${workshop.id}`
        : `td:${row.workshop_title}|${row.workshop_date}`
      const bucket = ensureBucket(key, workshop)

      // Fall back to the row's own title/date if the workshop record is gone.
      if (!bucket.workshop_title) bucket.workshop_title = row.workshop_title
      if (!bucket.workshop_date) bucket.workshop_date = row.workshop_date

      const normalized = normalizeRowResponses(row)
      bucket.responses.push({ ...row, responses_normalized: normalized })
      bucket.response_count += 1

      const questions = bucket.survey_config?.questions
      if (Array.isArray(questions)) {
        for (const q of questions) {
          const value = normalized[q.id]
          if (value == null) continue
          if (q.type === 'nps') {
            if (!bucket.nps) {
              bucket.nps = {
                sum: 0,
                count: 0,
                distribution: Object.fromEntries(
                  Array.from({ length: 10 }, (_, i) => [i + 1, 0])
                ),
              }
            }
            if (Number.isInteger(value) && value >= 1 && value <= 10) {
              bucket.nps.sum += value
              bucket.nps.count += 1
              bucket.nps.distribution[value] += 1
            }
          } else if (q.type === 'single_select') {
            if (!bucket.aggregates[q.id]) bucket.aggregates[q.id] = {}
            bucket.aggregates[q.id][value] = (bucket.aggregates[q.id][value] ?? 0) + 1
          } else if (q.type === 'multi_select' && Array.isArray(value)) {
            if (!bucket.aggregates[q.id]) bucket.aggregates[q.id] = {}
            for (const v of value) {
              bucket.aggregates[q.id][v] = (bucket.aggregates[q.id][v] ?? 0) + 1
            }
          }
        }
      }
    }

    const workshops = []
    for (const bucket of Object.values(byWorkshop)) {
      if (bucket.nps && bucket.nps.count > 0) {
        bucket.nps.avg = Number((bucket.nps.sum / bucket.nps.count).toFixed(2))
        bucket.nps.promoter_count = Object.entries(bucket.nps.distribution)
          .filter(([n]) => Number(n) >= 9)
          .reduce((s, [, c]) => s + c, 0)
        bucket.nps.detractor_count = Object.entries(bucket.nps.distribution)
          .filter(([n]) => Number(n) <= 6)
          .reduce((s, [, c]) => s + c, 0)
        delete bucket.nps.sum
      }
      workshops.push({
        key: bucket.key,
        webinar_id: bucket.webinar_id,
        slug: bucket.slug,
        workshop_title: bucket.workshop_title,
        workshop_date: bucket.workshop_date,
        count: bucket.response_count,
        avg_nps: bucket.nps?.avg ?? null,
      })
    }

    workshops.sort((a, b) => {
      const ad = a.workshop_date ?? ''
      const bd = b.workshop_date ?? ''
      if (ad === bd) return (a.workshop_title ?? '').localeCompare(b.workshop_title ?? '')
      return ad < bd ? 1 : -1
    })

    return res.status(200).json({ workshops, by_workshop: byWorkshop })
  } catch (err) {
    console.error('workshop-feedback admin error:', err)
    return res.status(500).json({ error: err.message ?? 'Internal error' })
  }
}
