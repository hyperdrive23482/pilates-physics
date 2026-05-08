import { supabaseAdmin } from '../../_lib/supabase-admin.js'
import { requireAdmin } from '../../_lib/require-admin.js'

const VALID_STATUS = new Set(['open', 'selected', 'archived'])

export default async function handler(req, res) {
  const admin = await requireAdmin(req, res)
  if (!admin) return

  try {
    if (req.method === 'GET') {
      const id = req.query.id
      if (id) {
        const { data, error } = await supabaseAdmin
          .from('content_ideas')
          .select('*')
          .eq('id', id)
          .maybeSingle()
        if (error) throw error
        if (!data) return res.status(404).json({ error: 'Not found' })
        return res.status(200).json({ idea: data })
      }
      const status = req.query.status
      let q = supabaseAdmin.from('content_ideas').select('*').order('created_at', { ascending: false })
      if (status && VALID_STATUS.has(status)) q = q.eq('status', status)
      const { data, error } = await q
      if (error) throw error
      return res.status(200).json({ ideas: data ?? [] })
    }

    if (req.method === 'POST') {
      const { title, notes } = req.body ?? {}
      if (!title?.trim()) return res.status(400).json({ error: 'title required' })
      const { data, error } = await supabaseAdmin
        .from('content_ideas')
        .insert({ title: title.trim(), notes: notes ?? null })
        .select()
        .single()
      if (error) throw error
      return res.status(201).json({ idea: data })
    }

    if (req.method === 'PATCH') {
      const id = req.query.id
      if (!id) return res.status(400).json({ error: 'id required' })
      const updates = {}
      const { title, notes, status } = req.body ?? {}
      if (title !== undefined) updates.title = title
      if (notes !== undefined) updates.notes = notes
      if (status !== undefined) {
        if (!VALID_STATUS.has(status)) return res.status(400).json({ error: 'invalid status' })
        updates.status = status
      }
      const { data, error } = await supabaseAdmin
        .from('content_ideas')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return res.status(200).json({ idea: data })
    }

    if (req.method === 'DELETE') {
      const id = req.query.id
      if (!id) return res.status(400).json({ error: 'id required' })
      const { error } = await supabaseAdmin.from('content_ideas').delete().eq('id', id)
      if (error) throw error
      return res.status(204).end()
    }

    res.setHeader('Allow', 'GET, POST, PATCH, DELETE')
    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    console.error('content/ideas error:', err)
    return res.status(500).json({ error: err.message ?? 'Internal error' })
  }
}
