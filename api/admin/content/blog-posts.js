import { supabaseAdmin } from '../../_lib/supabase-admin.js'
import { requireAdmin } from '../../_lib/require-admin.js'
import { renderMarkdown } from '../../_lib/markdown.js'

const VALID_STATUS = new Set(['draft', 'scheduled', 'published'])

function slugify(s) {
  return (s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

export default async function handler(req, res) {
  const admin = await requireAdmin(req, res)
  if (!admin) return

  try {
    if (req.method === 'GET') {
      const id = req.query.id
      if (id) {
        const { data, error } = await supabaseAdmin
          .from('blog_posts')
          .select('*')
          .eq('id', id)
          .maybeSingle()
        if (error) throw error
        if (!data) return res.status(404).json({ error: 'Not found' })
        const { data: linkedPieces } = await supabaseAdmin
          .from('content_pieces')
          .select('id, title, status')
          .eq('blog_post_id', id)
        return res.status(200).json({ post: data, linked_pieces: linkedPieces ?? [] })
      }
      const { data, error } = await supabaseAdmin
        .from('blog_posts')
        .select('id, slug, title, excerpt, status, published_at, scheduled_for, updated_at, featured_image_url, canonical_url')
        .order('published_at', { ascending: false, nullsFirst: false })
        .order('updated_at', { ascending: false })
      if (error) throw error
      return res.status(200).json({ posts: data ?? [] })
    }

    if (req.method === 'PATCH') {
      const id = req.query.id
      if (!id) return res.status(400).json({ error: 'id required' })

      const body = req.body ?? {}
      const updates = {}

      if (body.status !== undefined) {
        if (!VALID_STATUS.has(body.status)) {
          return res.status(400).json({ error: 'invalid status' })
        }
        updates.status = body.status
      }
      if (body.title !== undefined) {
        const t = String(body.title).trim()
        if (!t) return res.status(400).json({ error: 'title required' })
        updates.title = t
      }
      if (body.slug !== undefined) {
        const cleaned = slugify(body.slug)
        if (!cleaned) return res.status(400).json({ error: 'slug required' })
        updates.slug = cleaned
      }
      if (body.excerpt !== undefined) updates.excerpt = body.excerpt || null
      if (body.body_markdown !== undefined) {
        if (!body.body_markdown || !String(body.body_markdown).trim()) {
          return res.status(400).json({ error: 'body_markdown required' })
        }
        updates.body_markdown = body.body_markdown
        updates.body_html = renderMarkdown(body.body_markdown)
      }
      if (body.featured_image_url !== undefined) {
        updates.featured_image_url = body.featured_image_url || null
      }
      if (body.featured_image_alt !== undefined) {
        updates.featured_image_alt = body.featured_image_alt || null
      }
      if (body.scheduled_for !== undefined) {
        updates.scheduled_for = body.scheduled_for || null
      }
      if (body.published_at !== undefined) {
        updates.published_at = body.published_at || null
      }

      // Auto-handle published_at on status transitions when caller didn't set it.
      if (body.status === 'published' && body.published_at === undefined) {
        const { data: current } = await supabaseAdmin
          .from('blog_posts')
          .select('published_at')
          .eq('id', id)
          .maybeSingle()
        if (current && !current.published_at) {
          updates.published_at = new Date().toISOString()
        }
      }
      if (body.status === 'draft' && body.published_at === undefined) {
        updates.published_at = null
      }

      const { data, error } = await supabaseAdmin
        .from('blog_posts')
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
      // FK on content_pieces.blog_post_id is "on delete set null" — safe.
      const { error } = await supabaseAdmin.from('blog_posts').delete().eq('id', id)
      if (error) throw error
      return res.status(204).end()
    }

    res.setHeader('Allow', 'GET, PATCH, DELETE')
    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    console.error('content/blog-posts error:', err)
    return res.status(500).json({ error: err.message ?? 'Internal error' })
  }
}
