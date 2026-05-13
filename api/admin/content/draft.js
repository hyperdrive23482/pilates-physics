import { supabaseAdmin } from '../../_lib/supabase-admin.js'
import { requireAdmin } from '../../_lib/require-admin.js'
import { generateContentDraft } from '../../_lib/anthropic.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const admin = await requireAdmin(req, res)
  if (!admin) return

  const { piece_id, notes, feedback } = req.body ?? {}
  if (!piece_id) return res.status(400).json({ error: 'piece_id required' })

  try {
    // Load piece + idea + active brain entries + previous draft (for revisions).
    const [pieceRes, brainRes, lastDraftRes] = await Promise.all([
      supabaseAdmin
        .from('content_pieces')
        .select('id, idea_id, title, status')
        .eq('id', piece_id)
        .maybeSingle(),
      supabaseAdmin
        .from('brain_entries')
        .select('type, title, content, source_url')
        .eq('is_active', true)
        .order('created_at', { ascending: true }),
      supabaseAdmin
        .from('content_drafts')
        .select('version, blog_markdown, email_subject, email_preview_text, email_markdown')
        .eq('piece_id', piece_id)
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ])

    if (pieceRes.error) throw pieceRes.error
    if (!pieceRes.data) return res.status(404).json({ error: 'piece not found' })
    if (brainRes.error) throw brainRes.error
    if (lastDraftRes.error) throw lastDraftRes.error

    const piece = pieceRes.data
    let idea = { title: piece.title, notes: null }
    if (piece.idea_id) {
      const { data: ideaRow } = await supabaseAdmin
        .from('content_ideas')
        .select('title, notes')
        .eq('id', piece.idea_id)
        .maybeSingle()
      if (ideaRow) idea = { title: ideaRow.title, notes: ideaRow.notes }
    }

    const isRevision = !!feedback && !!lastDraftRes.data
    const previousDraft = isRevision
      ? {
          blog_title: piece.title,
          blog_markdown: lastDraftRes.data.blog_markdown,
          email_subject: lastDraftRes.data.email_subject,
          email_preview_text: lastDraftRes.data.email_preview_text,
          email_markdown: lastDraftRes.data.email_markdown,
        }
      : undefined

    const { data: generated, usage } = await generateContentDraft({
      idea,
      notes,
      feedback: isRevision ? feedback : undefined,
      brainEntries: brainRes.data ?? [],
      previousDraft,
    })

    const version = ((lastDraftRes.data?.version) ?? 0) + 1
    const source = isRevision ? 'claude_revision' : 'claude_initial'

    // Persist draft row
    const { data: draftRow, error: insertErr } = await supabaseAdmin
      .from('content_drafts')
      .insert({
        piece_id,
        version,
        source,
        feedback: isRevision ? feedback : null,
        excerpt: generated.blog_excerpt,
        blog_markdown: generated.blog_markdown,
        email_subject: generated.email_subject,
        email_preview_text: generated.email_preview_text,
        email_markdown: generated.email_markdown,
        created_by: admin.user.id,
      })
      .select()
      .single()
    if (insertErr) throw insertErr

    // Update piece denormalized fields + status → in_review on first generation
    const pieceUpdates = {
      title: generated.blog_title,
      slug: generated.blog_slug,
      excerpt: generated.blog_excerpt,
      blog_markdown: generated.blog_markdown,
      email_subject: generated.email_subject,
      email_preview_text: generated.email_preview_text,
      email_markdown: generated.email_markdown,
    }
    if (piece.status === 'drafting') pieceUpdates.status = 'in_review'

    const { data: updatedPiece, error: updateErr } = await supabaseAdmin
      .from('content_pieces')
      .update(pieceUpdates)
      .eq('id', piece_id)
      .select()
      .single()
    if (updateErr) throw updateErr

    return res.status(200).json({
      piece: updatedPiece,
      draft: draftRow,
      generated,
      usage,
    })
  } catch (err) {
    console.error('content/draft error:', err)
    return res.status(500).json({ error: err.message ?? 'Draft generation failed' })
  }
}
