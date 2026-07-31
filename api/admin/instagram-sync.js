import { requireAdmin } from '../_lib/require-admin.js'
import { getUsableToken, saveConnection } from '../_lib/instagram.js'
import { syncMediaPage, recordSyncSuccess } from '../_lib/instagram-sync.js'

// POST /api/admin/instagram-sync[?after=<cursor>]
//
// Syncs one page of media and hands the cursor back, so the browser drives
// the loop. Each invocation stays a couple of seconds long instead of one
// request racing the function timeout on a large backfill, and the UI can
// show progress while it runs.
export default async function handler(req, res) {
  const admin = await requireAdmin(req, res)
  if (!admin) return

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { token } = await getUsableToken()
    const { created, updated, nextCursor, hasNext } = await syncMediaPage({
      token,
      after: req.query.after || null,
    })

    let total = null
    if (!hasNext) total = await recordSyncSuccess()

    return res.status(200).json({
      created,
      updated,
      done: !hasNext,
      next_cursor: nextCursor,
      total_synced: total,
    })
  } catch (err) {
    console.error('admin/instagram-sync error:', err)
    if (err.code === 'NOT_CONNECTED' || err.code === 'TOKEN_EXPIRED') {
      return res.status(409).json({ error: err.message, code: err.code })
    }
    // Record it so the planner can show what went wrong without the admin
    // having to dig through Vercel logs.
    try {
      await saveConnection({ last_sync_error: err.message ?? 'Sync failed' })
    } catch {
      /* the original error is what matters */
    }
    return res.status(500).json({ error: err.message ?? 'Internal error' })
  }
}
