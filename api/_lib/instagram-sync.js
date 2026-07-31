import { supabaseAdmin } from './supabase-admin.js'
import { saveConnection, igGet } from './instagram.js'

// Shared by the admin sync route (browser-driven, one page at a time) and
// the nightly cron (refreshes metrics on recent posts).
export const PAGE_SIZE = 25
const INSIGHT_CONCURRENCY = 5

const MEDIA_FIELDS = [
  'id',
  'caption',
  'media_type',
  'media_product_type',
  'permalink',
  'timestamp',
  'like_count',
  'comments_count',
].join(',')

// likes and comments come from the media object itself (always present);
// only these three need the insights edge.
const INSIGHT_METRICS = 'views,shares,saved'

function formatFor(media) {
  if (media.media_product_type === 'REELS') return 'reel'
  if (media.media_type === 'CAROUSEL_ALBUM') return 'carousel'
  return 'static'
}

// Instagram has no title, so the first meaningful line of the caption
// stands in for one. The full caption goes to description.
function titleFrom(caption) {
  if (!caption?.trim()) return 'Untitled post'
  const firstLine = caption
    .split('\n')
    .map((l) => l.trim())
    .find((l) => l.length > 0)
  if (!firstLine) return 'Untitled post'
  return firstLine.length > 120 ? `${firstLine.slice(0, 117)}…` : firstLine
}

async function mapWithConcurrency(items, limit, fn) {
  const results = new Array(items.length)
  let cursor = 0
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const i = cursor++
      results[i] = await fn(items[i], i)
    }
  })
  await Promise.all(workers)
  return results
}

// An individual media object can refuse insights (very old posts, or a
// metric that does not apply to its type). That should cost us that one
// post's metrics, not the whole sync.
async function fetchInsights(mediaId, token) {
  try {
    const json = await igGet(`${mediaId}/insights`, { metric: INSIGHT_METRICS }, token)
    const out = {}
    for (const row of json.data ?? []) {
      const value = row.values?.[0]?.value
      if (typeof value === 'number') out[row.name] = value
    }
    return out
  } catch (e) {
    console.warn(`instagram-sync: insights unavailable for ${mediaId}: ${e.message}`)
    return null
  }
}

// Pulls one page of media and reconciles it into instagram_posts.
// Returns { created, updated, nextCursor, hasNext }.
export async function syncMediaPage({ token, after = null, limit = PAGE_SIZE }) {
  const page = await igGet(
    'me/media',
    { fields: MEDIA_FIELDS, limit: String(limit), ...(after ? { after } : {}) },
    token
  )
  const media = page.data ?? []
  const nextCursor = media.length ? page.paging?.cursors?.after ?? null : null
  const hasNext = Boolean(page.paging?.next && nextCursor)

  if (media.length === 0) {
    return { created: 0, updated: 0, nextCursor: null, hasNext: false }
  }

  const insights = await mapWithConcurrency(media, INSIGHT_CONCURRENCY, (m) =>
    fetchInsights(m.id, token)
  )

  // Split into inserts and updates so an existing row keeps the category,
  // title, description and hook Kaleen wrote. Sync owns metrics only.
  const ids = media.map((m) => m.id)
  const { data: existingRows, error: existingErr } = await supabaseAdmin
    .from('instagram_posts')
    .select('id, ig_media_id')
    .in('ig_media_id', ids)
  if (existingErr) throw existingErr
  const existing = new Map((existingRows ?? []).map((r) => [r.ig_media_id, r.id]))

  const syncedAt = new Date().toISOString()
  const toInsert = []
  let updated = 0

  for (let i = 0; i < media.length; i++) {
    const m = media[i]
    const ins = insights[i] ?? {}
    const metrics = {
      views: ins.views ?? null,
      shares: ins.shares ?? null,
      saves: ins.saved ?? null,
      comments: m.comments_count ?? null,
      post_url: m.permalink ?? null,
      posted_at: m.timestamp ? m.timestamp.slice(0, 10) : null,
      metrics_synced_at: syncedAt,
    }

    const existingId = existing.get(m.id)
    if (existingId) {
      const { error } = await supabaseAdmin
        .from('instagram_posts')
        .update(metrics)
        .eq('id', existingId)
      if (error) throw error
      updated++
    } else {
      toInsert.push({
        ...metrics,
        ig_media_id: m.id,
        category: 'uncategorized',
        status: 'published',
        title: titleFrom(m.caption),
        description: m.caption?.trim() || null,
        format: formatFor(m),
      })
    }
  }

  if (toInsert.length) {
    const { error } = await supabaseAdmin.from('instagram_posts').insert(toInsert)
    if (error) throw error
  }

  return { created: toInsert.length, updated, nextCursor: hasNext ? nextCursor : null, hasNext }
}

// Records a successful sync against the connection row, including a fresh
// count of how many posts came from Instagram.
export async function recordSyncSuccess() {
  const { count } = await supabaseAdmin
    .from('instagram_posts')
    .select('id', { count: 'exact', head: true })
    .not('ig_media_id', 'is', null)

  await saveConnection({
    last_synced_at: new Date().toISOString(),
    last_sync_error: null,
    synced_media_count: count ?? 0,
  })
  return count ?? 0
}
