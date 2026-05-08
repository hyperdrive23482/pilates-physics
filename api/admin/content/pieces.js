import { supabaseAdmin } from '../../_lib/supabase-admin.js'
import { requireAdmin } from '../../_lib/require-admin.js'
import { updateBroadcast } from '../../_lib/kit.js'
import { buildEmailHtml } from '../../_lib/content-email.js'

const VALID_STATUS = new Set([
  'drafting',
  'in_review',
  'approved',
  'scheduled',
  'published',
  'archived',
])

const EDITABLE_CONTENT_KEYS = ['blog_markdown', 'email_subject', 'email_preview_text', 'email_markdown']

function slugify(s) {
  return (s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

async function nextVersion(pieceId) {
  const { data, error } = await supabaseAdmin
    .from('content_drafts')
    .select('version')
    .eq('piece_id', pieceId)
    .order('version', { ascending: false })
    .limit(1)
  if (error) throw error
  return ((data?.[0]?.version) ?? 0) + 1
}

export default async function handler(req, res) {
  const admin = await requireAdmin(req, res)
  if (!admin) return

  try {
    if (req.method === 'GET') {
      const id = req.query.id
      if (id) {
        const [pieceRes, draftsRes] = await Promise.all([
          supabaseAdmin.from('content_pieces').select('*').eq('id', id).maybeSingle(),
          supabaseAdmin
            .from('content_drafts')
            .select('*')
            .eq('piece_id', id)
            .order('version', { ascending: false }),
        ])
        if (pieceRes.error) throw pieceRes.error
        if (!pieceRes.data) return res.status(404).json({ error: 'Not found' })
        if (draftsRes.error) throw draftsRes.error
        return res.status(200).json({ piece: pieceRes.data, drafts: draftsRes.data ?? [] })
      }
      const status = req.query.status
      let q = supabaseAdmin
        .from('content_pieces')
        .select('id, idea_id, title, slug, status, scheduled_for, published_at, updated_at, created_at')
        .order('updated_at', { ascending: false })
      if (status && VALID_STATUS.has(status)) q = q.eq('status', status)
      const { data, error } = await q
      if (error) throw error
      return res.status(200).json({ pieces: data ?? [] })
    }

    if (req.method === 'POST') {
      // Start a new piece from an idea (or freeform).
      const { idea_id, title } = req.body ?? {}
      let resolvedTitle = title
      if (idea_id) {
        const { data: idea, error: ideaErr } = await supabaseAdmin
          .from('content_ideas')
          .select('id, title, status')
          .eq('id', idea_id)
          .maybeSingle()
        if (ideaErr) throw ideaErr
        if (!idea) return res.status(404).json({ error: 'idea not found' })
        resolvedTitle = resolvedTitle ?? idea.title
        // Mark idea selected
        await supabaseAdmin
          .from('content_ideas')
          .update({ status: 'selected' })
          .eq('id', idea_id)
      }
      if (!resolvedTitle?.trim()) return res.status(400).json({ error: 'title required' })

      const baseSlug = slugify(resolvedTitle) || 'untitled'
      // Ensure slug uniqueness for the piece (loose; final blog slug is set at approval).
      let slug = baseSlug
      let n = 2
      while (true) {
        const { data: existing } = await supabaseAdmin
          .from('content_pieces')
          .select('id')
          .eq('slug', slug)
          .maybeSingle()
        if (!existing) break
        slug = `${baseSlug}-${n++}`
        if (n > 100) break
      }

      const { data, error } = await supabaseAdmin
        .from('content_pieces')
        .insert({
          idea_id: idea_id ?? null,
          title: resolvedTitle.trim(),
          slug,
          status: 'drafting',
        })
        .select()
        .single()
      if (error) throw error
      return res.status(201).json({ piece: data })
    }

    if (req.method === 'PATCH') {
      const id = req.query.id
      if (!id) return res.status(400).json({ error: 'id required' })

      const body = req.body ?? {}
      const updates = {}
      if (body.title !== undefined) updates.title = body.title
      if (body.slug !== undefined) updates.slug = slugify(body.slug) || null
      if (body.status !== undefined) {
        if (!VALID_STATUS.has(body.status)) return res.status(400).json({ error: 'invalid status' })
        updates.status = body.status
      }
      let editedContent = false
      for (const key of EDITABLE_CONTENT_KEYS) {
        if (body[key] !== undefined) {
          updates[key] = body[key]
          editedContent = true
        }
      }

      // If saving content edits, snapshot a kaleen_edit draft row first
      if (editedContent && body.save_as_edit !== false) {
        const version = await nextVersion(id)
        // Read current to fill omitted fields
        const { data: current } = await supabaseAdmin
          .from('content_pieces')
          .select('blog_markdown, email_subject, email_preview_text, email_markdown')
          .eq('id', id)
          .maybeSingle()
        await supabaseAdmin.from('content_drafts').insert({
          piece_id: id,
          version,
          source: 'kaleen_edit',
          blog_markdown: updates.blog_markdown ?? current?.blog_markdown ?? null,
          email_subject: updates.email_subject ?? current?.email_subject ?? null,
          email_preview_text: updates.email_preview_text ?? current?.email_preview_text ?? null,
          email_markdown: updates.email_markdown ?? current?.email_markdown ?? null,
          created_by: admin.user.id,
        })
      }

      const { data, error } = await supabaseAdmin
        .from('content_pieces')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error

      // Best-effort: sync the latest content to the Kit broadcast if one
      // already exists for this piece. Failures are logged but don't fail
      // the save — the user can re-sync via the "Draft in Kit" button.
      let kitSync = null
      if (
        editedContent &&
        data.kit_broadcast_id &&
        data.status !== 'published'
      ) {
        try {
          await updateBroadcast(data.kit_broadcast_id, {
            subject: data.email_subject,
            previewText: data.email_preview_text ?? null,
            contentHtml: buildEmailHtml({
              emailMarkdown: data.email_markdown,
              slug: data.slug,
            }),
          })
          kitSync = 'updated'
        } catch (kitErr) {
          console.warn('Kit auto-sync on edit failed:', kitErr.message)
          kitSync = `failed: ${kitErr.message}`
        }
      }

      return res.status(200).json({ piece: data, kit_sync: kitSync })
    }

    if (req.method === 'DELETE') {
      const id = req.query.id
      if (!id) return res.status(400).json({ error: 'id required' })
      const { error } = await supabaseAdmin.from('content_pieces').delete().eq('id', id)
      if (error) throw error
      return res.status(204).end()
    }

    res.setHeader('Allow', 'GET, POST, PATCH, DELETE')
    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    console.error('content/pieces error:', err)
    return res.status(500).json({ error: err.message ?? 'Internal error' })
  }
}
