import { getUsableToken, saveConnection, expiresInDays } from '../_lib/instagram.js'
import { syncMediaPage, recordSyncSuccess } from '../_lib/instagram-sync.js'

// Vercel Cron: GET /api/cron/instagram-refresh
//
// Two jobs, both time-sensitive:
//   1. Keep the long-lived token alive. It lasts 60 days and can only be
//      refreshed while still valid, so letting it lapse means Kaleen has to
//      reauthorize by hand. getUsableToken() refreshes inside the window.
//   2. Re-pull metrics for recent posts. Views and saves keep accruing for
//      weeks after publishing, so yesterday's numbers go stale on their own.
//
// Only recent pages are re-synced — older posts have essentially stopped
// moving, and a full backfill is what the manual "Sync" button is for.
const PAGES_TO_REFRESH = 2

export default async function handler(req, res) {
  const auth = req.headers.authorization
  const expected = process.env.CRON_SECRET
  if (expected && auth !== `Bearer ${expected}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  // Not configured or not connected is a normal state, not a failure. Return
  // 200 so the cron doesn't report as broken on a deployment that never set
  // Instagram up.
  if (!process.env.INSTAGRAM_APP_ID || !process.env.INSTAGRAM_APP_SECRET) {
    return res.status(200).json({ skipped: 'Instagram app credentials not configured' })
  }

  try {
    const { token, connection } = await getUsableToken()

    let created = 0
    let updated = 0
    let cursor = null
    for (let page = 0; page < PAGES_TO_REFRESH; page++) {
      const result = await syncMediaPage({ token, after: cursor })
      created += result.created
      updated += result.updated
      if (!result.hasNext) break
      cursor = result.nextCursor
    }

    await recordSyncSuccess()

    return res.status(200).json({
      created,
      updated,
      token_expires_in_days: expiresInDays(connection),
    })
  } catch (err) {
    if (err.code === 'NOT_CONNECTED') {
      return res.status(200).json({ skipped: 'Instagram not connected' })
    }
    console.error('cron/instagram-refresh error:', err)
    try {
      await saveConnection({ last_sync_error: err.message ?? 'Scheduled sync failed' })
    } catch {
      /* the original error is what matters */
    }
    return res.status(500).json({ error: err.message ?? 'Internal error' })
  }
}
