import { supabaseAdmin } from '../../_lib/supabase-admin.js'
import { requireAdmin } from '../../_lib/require-admin.js'
import { createBroadcast, updateBroadcast } from '../../_lib/kit.js'
import { buildEmailHtml } from '../../_lib/content-email.js'

// POST /api/admin/content/draft-in-kit
// Body: { piece_id }
//
// Creates a Kit broadcast in DRAFT state (no send_at) for the piece, OR if the
// piece already has a kit_broadcast_id, updates the existing draft with the
// latest content. Persists the broadcast id on the piece if newly created.
//
// Does NOT change the piece's editorial status.
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const admin = await requireAdmin(req, res)
  if (!admin) return

  const { piece_id } = req.body ?? {}
  if (!piece_id) return res.status(400).json({ error: 'piece_id required' })

  try {
    const { data: piece, error: pieceErr } = await supabaseAdmin
      .from('content_pieces')
      .select('*')
      .eq('id', piece_id)
      .maybeSingle()
    if (pieceErr) throw pieceErr
    if (!piece) return res.status(404).json({ error: 'piece not found' })

    if (!piece.email_subject || !piece.email_markdown) {
      return res.status(400).json({ error: 'piece is missing email content' })
    }
    if (piece.status === 'published') {
      return res.status(409).json({ error: 'piece already published' })
    }
    if (piece.status === 'scheduled') {
      return res.status(409).json({
        error: 'piece is scheduled — unschedule first if you want to revert to draft',
      })
    }

    const emailHtml = buildEmailHtml({ emailMarkdown: piece.email_markdown, slug: piece.slug })

    let broadcastId = piece.kit_broadcast_id
    let action

    if (broadcastId) {
      // Update existing Kit draft in place
      await updateBroadcast(broadcastId, {
        subject: piece.email_subject,
        previewText: piece.email_preview_text ?? null,
        contentHtml: emailHtml,
        // explicitly leave send_at unchanged — don't pass it
      })
      action = 'updated'
    } else {
      const broadcast = await createBroadcast({
        subject: piece.email_subject,
        previewText: piece.email_preview_text ?? null,
        contentHtml: emailHtml,
        // no sendAt → Kit treats it as a draft
      })
      broadcastId = broadcast?.id ?? null
      action = 'created'

      if (broadcastId) {
        const { error: updateErr } = await supabaseAdmin
          .from('content_pieces')
          .update({ kit_broadcast_id: String(broadcastId) })
          .eq('id', piece_id)
        if (updateErr) throw updateErr
      }
    }

    return res.status(200).json({
      action,
      kit_broadcast_id: broadcastId ? String(broadcastId) : null,
    })
  } catch (err) {
    console.error('content/draft-in-kit error:', err)
    return res.status(500).json({ error: err.message ?? 'Draft-in-Kit failed' })
  }
}
