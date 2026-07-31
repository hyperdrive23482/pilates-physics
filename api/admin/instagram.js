import { supabaseAdmin } from '../_lib/supabase-admin.js'
import { requireAdmin } from '../_lib/require-admin.js'

const VALID_CATEGORY = new Set([
  'spring_school',
  'brand_files',
  'same_spring_different_body',
  'pop_quiz',
  'weight_stack',
  'misc',
  'uncategorized',
])
const VALID_STATUS = new Set(['idea', 'in_progress', 'published'])
const VALID_FORMAT = new Set(['reel', 'carousel', 'static'])
const METRICS = ['views', 'comments', 'shares', 'saves']

// Metrics arrive from number inputs, so '' means "cleared" and must
// become null rather than 0 — a post with no data is not a post with
// zero views.
function parseMetric(v) {
  if (v === null || v === undefined || v === '') return null
  const n = Number(v)
  if (!Number.isFinite(n) || n < 0) return undefined // signals invalid
  return Math.round(n)
}

function todayISODate() {
  return new Date().toISOString().slice(0, 10)
}

export default async function handler(req, res) {
  const admin = await requireAdmin(req, res)
  if (!admin) return

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabaseAdmin
        .from('instagram_posts')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return res.status(200).json({ posts: data ?? [] })
    }

    if (req.method === 'POST') {
      const { category, title, description, hook, format } = req.body ?? {}
      if (!title?.trim()) return res.status(400).json({ error: 'title required' })
      if (!category || !VALID_CATEGORY.has(category)) {
        return res.status(400).json({ error: 'valid category required' })
      }
      if (format && !VALID_FORMAT.has(format)) {
        return res.status(400).json({ error: 'invalid format' })
      }

      const { data, error } = await supabaseAdmin
        .from('instagram_posts')
        .insert({
          category,
          title: title.trim(),
          description: description?.trim() || null,
          hook: hook?.trim() || null,
          format: format || null,
        })
        .select()
        .single()
      if (error) throw error
      return res.status(201).json({ post: data })
    }

    if (req.method === 'PATCH') {
      const id = req.query.id
      if (!id) return res.status(400).json({ error: 'id required' })

      const body = req.body ?? {}
      const updates = {}

      if (body.title !== undefined) {
        if (!body.title?.trim()) return res.status(400).json({ error: 'title cannot be empty' })
        updates.title = body.title.trim()
      }
      if (body.category !== undefined) {
        if (!VALID_CATEGORY.has(body.category)) {
          return res.status(400).json({ error: 'invalid category' })
        }
        updates.category = body.category
      }
      if (body.status !== undefined) {
        if (!VALID_STATUS.has(body.status)) {
          return res.status(400).json({ error: 'invalid status' })
        }
        updates.status = body.status
      }
      if (body.format !== undefined) {
        if (body.format && !VALID_FORMAT.has(body.format)) {
          return res.status(400).json({ error: 'invalid format' })
        }
        updates.format = body.format || null
      }
      for (const field of ['description', 'hook', 'post_url']) {
        if (body[field] !== undefined) updates[field] = body[field]?.trim() || null
      }
      if (body.posted_at !== undefined) updates.posted_at = body.posted_at || null
      for (const m of METRICS) {
        if (body[m] === undefined) continue
        const parsed = parseMetric(body[m])
        if (parsed === undefined) return res.status(400).json({ error: `invalid ${m}` })
        updates[m] = parsed
      }

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'no fields to update' })
      }

      // Marking something published without saying when is the common
      // case (you post, then tick it off). Default the date so the
      // archive stays sortable instead of collecting null dates.
      if (updates.status === 'published' && body.posted_at === undefined) {
        const { data: current } = await supabaseAdmin
          .from('instagram_posts')
          .select('posted_at')
          .eq('id', id)
          .maybeSingle()
        if (current && !current.posted_at) updates.posted_at = todayISODate()
      }

      const { data, error } = await supabaseAdmin
        .from('instagram_posts')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return res.status(200).json({ post: data })
    }

    if (req.method === 'DELETE') {
      const id = req.query.id
      if (!id) return res.status(400).json({ error: 'id required' })
      const { error } = await supabaseAdmin.from('instagram_posts').delete().eq('id', id)
      if (error) throw error
      return res.status(204).end()
    }

    res.setHeader('Allow', 'GET, POST, PATCH, DELETE')
    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    console.error('admin/instagram error:', err)
    return res.status(500).json({ error: err.message ?? 'Internal error' })
  }
}
