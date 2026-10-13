import { timingSafeEqual } from 'node:crypto'
import { supabaseAdmin } from '../../_lib/supabase-admin.js'

// Machine access to brain_entries for the local reel-brain skill
// (.claude/skills/reel-brain). Authorized by a shared secret instead of an
// admin JWT, because it runs from a scheduled task with no browser session.
//
//   GET  -> every entry, for refreshing the local mirror in docs/brain/
//   POST -> upsert one entry on (type, title), so a re-run updates the same
//           row instead of duplicating it. New entries default to inactive,
//           matching the transcript seeds, so nothing reaches the drafting
//           prompt until it is switched on in /admin/content/brain.

const VALID_TYPE = new Set(['blog_post', 'transcript', 'style_guide', 'persona'])

function estimateTokens(content) {
  if (!content) return 0
  return Math.ceil(content.length / 4)
}

function authorized(req) {
  const expected = process.env.BRAIN_INGEST_SECRET
  if (!expected) return false
  const auth = req.headers.authorization ?? ''
  const a = Buffer.from(auth)
  const b = Buffer.from(`Bearer ${expected}`)
  return a.length === b.length && timingSafeEqual(a, b)
}

export default async function handler(req, res) {
  if (!authorized(req)) return res.status(401).json({ error: 'Unauthorized' })

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabaseAdmin
        .from('brain_entries')
        .select('id, type, title, content, source_url, is_active, token_estimate, created_at')
        .order('created_at', { ascending: true })
      if (error) throw error
      return res.status(200).json({ entries: data ?? [] })
    }

    if (req.method === 'POST') {
      const { type, title, content, source_url, is_active } = req.body ?? {}
      if (!type || !VALID_TYPE.has(type)) return res.status(400).json({ error: 'invalid type' })
      if (!title?.trim()) return res.status(400).json({ error: 'title required' })
      if (!content?.trim()) return res.status(400).json({ error: 'content required' })

      const row = {
        type,
        title: title.trim(),
        content,
        source_url: source_url ?? null,
        token_estimate: estimateTokens(content),
      }
      // Only set is_active when the caller says so, so re-ingesting an entry
      // that was switched on in the admin does not switch it back off.
      const { data: existing, error: findErr } = await supabaseAdmin
        .from('brain_entries')
        .select('id')
        .eq('type', row.type)
        .eq('title', row.title)
        .maybeSingle()
      if (findErr) throw findErr

      if (existing) {
        if (typeof is_active === 'boolean') row.is_active = is_active
        const { data, error } = await supabaseAdmin
          .from('brain_entries')
          .update(row)
          .eq('id', existing.id)
          .select()
          .single()
        if (error) throw error
        return res.status(200).json({ entry: data, created: false })
      }

      row.is_active = typeof is_active === 'boolean' ? is_active : false
      const { data, error } = await supabaseAdmin
        .from('brain_entries')
        .insert(row)
        .select()
        .single()
      if (error) throw error
      return res.status(201).json({ entry: data, created: true })
    }

    res.setHeader('Allow', 'GET, POST')
    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    console.error('content/brain-ingest error:', err)
    return res.status(500).json({ error: err.message ?? 'Internal error' })
  }
}
