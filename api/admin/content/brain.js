import { supabaseAdmin } from '../../_lib/supabase-admin.js'
import { requireAdmin } from '../../_lib/require-admin.js'

const VALID_TYPE = new Set(['blog_post', 'transcript', 'style_guide'])

// Rough token estimate (chars / 4). Used to warn about brain size.
function estimateTokens(content) {
  if (!content) return 0
  return Math.ceil(content.length / 4)
}

export default async function handler(req, res) {
  const admin = await requireAdmin(req, res)
  if (!admin) return

  try {
    if (req.method === 'GET') {
      const id = req.query.id
      if (id) {
        const { data, error } = await supabaseAdmin
          .from('brain_entries')
          .select('*')
          .eq('id', id)
          .maybeSingle()
        if (error) throw error
        if (!data) return res.status(404).json({ error: 'Not found' })
        return res.status(200).json({ entry: data })
      }
      const { data, error } = await supabaseAdmin
        .from('brain_entries')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      const totalActiveTokens = (data ?? [])
        .filter((e) => e.is_active)
        .reduce((sum, e) => sum + (e.token_estimate ?? 0), 0)
      return res.status(200).json({ entries: data ?? [], total_active_tokens: totalActiveTokens })
    }

    if (req.method === 'POST') {
      const { type, title, content, source_url, is_active } = req.body ?? {}
      if (!type || !VALID_TYPE.has(type)) return res.status(400).json({ error: 'invalid type' })
      if (!title?.trim()) return res.status(400).json({ error: 'title required' })
      if (!content?.trim()) return res.status(400).json({ error: 'content required' })
      const { data, error } = await supabaseAdmin
        .from('brain_entries')
        .insert({
          type,
          title: title.trim(),
          content,
          source_url: source_url ?? null,
          is_active: is_active ?? true,
          token_estimate: estimateTokens(content),
        })
        .select()
        .single()
      if (error) throw error
      return res.status(201).json({ entry: data })
    }

    if (req.method === 'PATCH') {
      const id = req.query.id
      if (!id) {
        const ids = Array.isArray(req.body?.ids) ? req.body.ids : null
        if (!ids || ids.length === 0) {
          return res.status(400).json({ error: 'id or ids[] required' })
        }
        if (typeof req.body?.is_active !== 'boolean') {
          return res.status(400).json({ error: 'is_active boolean required for bulk update' })
        }
        const { data, error } = await supabaseAdmin
          .from('brain_entries')
          .update({ is_active: req.body.is_active })
          .in('id', ids)
          .select('id, is_active')
        if (error) throw error
        return res.status(200).json({ updated: data ?? [] })
      }
      const body = req.body ?? {}
      const updates = {}
      if (body.type !== undefined) {
        if (!VALID_TYPE.has(body.type)) return res.status(400).json({ error: 'invalid type' })
        updates.type = body.type
      }
      if (body.title !== undefined) updates.title = body.title
      if (body.content !== undefined) {
        updates.content = body.content
        updates.token_estimate = estimateTokens(body.content)
      }
      if (body.source_url !== undefined) updates.source_url = body.source_url
      if (body.is_active !== undefined) updates.is_active = !!body.is_active
      const { data, error } = await supabaseAdmin
        .from('brain_entries')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return res.status(200).json({ entry: data })
    }

    if (req.method === 'DELETE') {
      const id = req.query.id
      if (!id) return res.status(400).json({ error: 'id required' })
      const { error } = await supabaseAdmin.from('brain_entries').delete().eq('id', id)
      if (error) throw error
      return res.status(204).end()
    }

    res.setHeader('Allow', 'GET, POST, PATCH, DELETE')
    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    console.error('content/brain error:', err)
    return res.status(500).json({ error: err.message ?? 'Internal error' })
  }
}
