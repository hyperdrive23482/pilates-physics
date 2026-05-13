import { supabaseAdmin } from '../../_lib/supabase-admin.js'
import { requireAdmin } from '../../_lib/require-admin.js'

// POST /api/admin/content/reset-kit-id
// Body: { piece_id }
//
// Clears kit_broadcast_id on the piece so the next "Draft in Kit" click
// creates a fresh broadcast. Use this after manually deleting the draft
// inside Kit, when the stored id is now a dangling reference.
//
// Refuses on scheduled/published pieces — those still rely on the link.
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
      .select('id, status, kit_broadcast_id')
      .eq('id', piece_id)
      .maybeSingle()
    if (pieceErr) throw pieceErr
    if (!piece) return res.status(404).json({ error: 'piece not found' })
    if (piece.status === 'scheduled' || piece.status === 'published') {
      return res.status(409).json({
        error: `piece is ${piece.status} — unschedule first before resetting the Kit link`,
      })
    }

    const { data: updatedPiece, error: updateErr } = await supabaseAdmin
      .from('content_pieces')
      .update({ kit_broadcast_id: null })
      .eq('id', piece_id)
      .select()
      .single()
    if (updateErr) throw updateErr

    return res.status(200).json({ piece: updatedPiece })
  } catch (err) {
    console.error('content/reset-kit-id error:', err)
    return res.status(500).json({ error: err.message ?? 'Reset failed' })
  }
}
