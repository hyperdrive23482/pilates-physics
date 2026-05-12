import { supabaseAdmin } from '../../_lib/supabase-admin.js'
import { requireAdmin } from '../../_lib/require-admin.js'
import { updateBroadcast } from '../../_lib/kit.js'

// POST /api/admin/content/unschedule
// Body: { piece_id }
//
// Cancels the scheduled blog publish and the scheduled Kit broadcast send,
// then moves the piece back to 'in_review' so it can be re-approved.
// Keeps kit_broadcast_id and blog_post_id linked so the next approve reuses
// them rather than creating duplicates.
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
    if (piece.status !== 'scheduled') {
      return res.status(409).json({ error: `piece is ${piece.status}, not scheduled` })
    }

    if (piece.kit_broadcast_id) {
      try {
        await updateBroadcast(piece.kit_broadcast_id, { sendAt: null })
      } catch (kitErr) {
        console.warn('Kit revert-to-draft failed on unschedule:', kitErr.message)
      }
    }

    if (piece.blog_post_id) {
      const { error: blogErr } = await supabaseAdmin
        .from('blog_posts')
        .update({
          status: 'draft',
          scheduled_for: null,
          published_at: null,
        })
        .eq('id', piece.blog_post_id)
      if (blogErr) console.warn('blog_posts revert on unschedule failed:', blogErr.message)
    }

    const { data: updatedPiece, error: updateErr } = await supabaseAdmin
      .from('content_pieces')
      .update({
        status: 'in_review',
        scheduled_for: null,
      })
      .eq('id', piece_id)
      .select()
      .single()
    if (updateErr) throw updateErr

    return res.status(200).json({ piece: updatedPiece })
  } catch (err) {
    console.error('content/unschedule error:', err)
    return res.status(500).json({ error: err.message ?? 'Unschedule failed' })
  }
}
