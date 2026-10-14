import { fraction, inRange, netCents } from './shared.js'

/**
 * Products tab aggregation: one row per workshop or course.
 *
 * Enrollment counts are all time (an entitlement is a fact about the product,
 * not about a month). Orders and revenue respect the range, and the columns
 * say so. Engagement comes from admin_engagement_by_item (migration 063),
 * which is all time; when that view is missing those columns are null.
 *
 * Pure. Tested in products.test.js.
 */

export const GRANT_SOURCES = ['manual', 'admin', 'kit_tag', 'bonus', 'bundle', 'lead_magnet']
export const GRANT_LABELS = {
  manual: 'Manual',
  admin: 'Admin',
  kit_tag: 'Kit tag',
  bonus: 'Bonus',
  bundle: 'Bundle',
  lead_magnet: 'Calculator lead',
}

/** The NPS answer on one workshop_feedback row, 1 to 10, or null. */
export function npsOf(row, surveyConfig) {
  if (Number.isInteger(row?.nps_score)) return row.nps_score
  const questions = surveyConfig?.questions
  if (!Array.isArray(questions) || !row?.responses || typeof row.responses !== 'object') return null
  for (const q of questions) {
    if (q?.type !== 'nps') continue
    const v = row.responses[q.id]
    const n = typeof v === 'number' ? v : Number(v)
    if (Number.isInteger(n) && n >= 1 && n <= 10) return n
  }
  return null
}

export function npsSummary(scores) {
  const xs = scores.filter((s) => Number.isInteger(s))
  if (xs.length === 0) return null
  const promoters = xs.filter((s) => s >= 9).length
  const detractors = xs.filter((s) => s <= 6).length
  return {
    count: xs.length,
    avg: Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10,
    promoters,
    detractors,
    // Classic NPS: promoters less detractors as a share of responses, -100 to 100.
    score: Math.round(((promoters - detractors) / xs.length) * 100),
  }
}

/**
 * Sum opens and take the larger distinct count across event types of the
 * same item. Distinct people cannot be added across types exactly; the max is
 * the honest lower bound.
 */
function mergeItems(rows) {
  let opens = 0
  let distinct = 0
  for (const r of rows) {
    opens += r.opens ?? 0
    distinct = Math.max(distinct, r.distinct_users ?? 0)
  }
  return { opens, distinct_users: distinct }
}

/**
 * @param webinars       id, title, slug, kind, status, scheduled_at, survey_config
 * @param entitlements   user_id, webinar_id, source
 * @param purchases      ledger rows, or null when the ledger is missing
 * @param questions      webinar_questions: webinar_id, is_answered
 * @param feedback       workshop_feedback: webinar_id, nps_score, responses, user_id
 * @param items          admin_engagement_by_item rows, or null when the view is missing
 * @param content        webinar_content: id, webinar_id, title, type
 * @param scholarships   scholarship_enrollments: user_id, webinar_id, or null
 * @param range          from parseRange()
 */
export function buildProducts({ webinars, entitlements, purchases, questions, feedback, items, content, scholarships, range }) {
  const products = (webinars ?? [])
    .filter((w) => w.kind === 'webinar' || w.kind === 'course')
    .map((w) => {
      const ents = (entitlements ?? []).filter((e) => e.webinar_id === w.id)
      const entitledUsers = new Set(ents.map((e) => e.user_id))
      const paid = ents.filter((e) => e.source === 'stripe').length
      const granted = {}
      for (const src of GRANT_SOURCES) granted[src] = 0
      for (const e of ents) {
        if (e.source === 'stripe') continue
        granted[e.source] = (granted[e.source] ?? 0) + 1
      }
      const grantedTotal = Object.values(granted).reduce((a, b) => a + b, 0)
      const scholarship = scholarships ? scholarships.filter((s) => s.webinar_id === w.id).length : null

      const orders = purchases ? purchases.filter((p) => p.webinar_id === w.id && inRange(p.purchased_at, range)) : null
      const ordersAll = purchases ? purchases.filter((p) => p.webinar_id === w.id) : null

      const wQuestions = (questions ?? []).filter((q) => q.webinar_id === w.id)
      const scores = (feedback ?? []).filter((f) => f.webinar_id === w.id).map((f) => npsOf(f, w.survey_config))

      const wItems = items ? items.filter((it) => it.webinar_id === w.id) : null
      const portalViewers = wItems ? mergeItems(wItems.filter((it) => it.event_type === 'portal_view')).distinct_users : null
      const certificates = wItems ? mergeItems(wItems.filter((it) => it.event_type === 'certificate_download')) : null

      const wContent = (content ?? []).filter((c) => c.webinar_id === w.id)
      const contentIds = new Set(wContent.map((c) => c.id))
      const openItems = wItems ? wItems.filter((it) => it.event_type === 'content_click' || it.event_type === 'download') : []
      const contentRows = wContent.map((c) => ({
        id: c.id,
        title: c.title,
        type: c.type,
        ...mergeItems(openItems.filter((it) => it.item_key === c.id)),
      }))
      // Opens recorded against content that has since been deleted and
      // re-created keep their label from the event metadata.
      const orphanKeys = new Set(openItems.map((it) => it.item_key).filter((k) => !contentIds.has(k)))
      for (const key of orphanKeys) {
        const rows = openItems.filter((it) => it.item_key === key)
        contentRows.push({ id: key, title: rows[0]?.label ?? 'Removed item', type: null, removed: true, ...mergeItems(rows) })
      }
      contentRows.sort((a, b) => b.distinct_users - a.distinct_users || b.opens - a.opens)

      const recordingIds = new Set(wContent.filter((c) => c.type === 'recording').map((c) => c.id))
      const recordingWatchers = wItems
        ? mergeItems(openItems.filter((it) => recordingIds.has(it.item_key))).distinct_users
        : null

      return {
        id: w.id,
        title: w.title,
        slug: w.slug,
        kind: w.kind,
        status: w.status,
        scheduled_at: w.scheduled_at ?? null,
        enrolled: entitledUsers.size,
        paid,
        scholarship,
        granted,
        granted_total: grantedTotal,
        orders_in_range: orders ? orders.length : null,
        net_cents_in_range: orders ? orders.reduce((acc, p) => acc + netCents(p), 0) : null,
        orders_all_time: ordersAll ? ordersAll.length : null,
        net_cents_all_time: ordersAll ? ordersAll.reduce((acc, p) => acc + netCents(p), 0) : null,
        portal_viewers: portalViewers === null ? null : fraction(portalViewers, entitledUsers.size),
        recording_watchers:
          recordingWatchers === null || recordingIds.size === 0 ? null : fraction(recordingWatchers, entitledUsers.size),
        certificates: certificates
          ? { downloads: certificates.opens, people: fraction(certificates.distinct_users, entitledUsers.size) }
          : null,
        nps: npsSummary(scores),
        questions: wQuestions.length,
        unanswered_questions: wQuestions.filter((q) => !q.is_answered).length,
        content: contentRows,
      }
    })

  // Most recently scheduled first; courses (no date) after dated workshops,
  // then by enrollment.
  products.sort((a, b) => {
    if (a.scheduled_at && b.scheduled_at) return b.scheduled_at.localeCompare(a.scheduled_at)
    if (a.scheduled_at) return -1
    if (b.scheduled_at) return 1
    return b.enrolled - a.enrolled
  })

  return { products }
}
