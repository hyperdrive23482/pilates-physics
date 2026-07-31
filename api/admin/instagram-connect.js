import { randomUUID } from 'node:crypto'
import { requireAdmin } from '../_lib/require-admin.js'
import {
  authorizeUrl,
  getConnection,
  saveConnection,
  expiresInDays,
  redirectUri,
} from '../_lib/instagram.js'

// Connection management for the Instagram sync.
//   GET    → status for the admin UI (never returns the token itself)
//   POST   → mint a state nonce and hand back an authorize URL
//   DELETE → forget the token, keeping every synced post in place
export default async function handler(req, res) {
  const admin = await requireAdmin(req, res)
  if (!admin) return

  const configured = Boolean(process.env.INSTAGRAM_APP_ID && process.env.INSTAGRAM_APP_SECRET)

  try {
    if (req.method === 'GET') {
      const connection = await getConnection()
      return res.status(200).json({
        configured,
        connected: Boolean(connection?.access_token),
        username: connection?.username ?? null,
        expires_in_days: expiresInDays(connection),
        last_synced_at: connection?.last_synced_at ?? null,
        last_sync_error: connection?.last_sync_error ?? null,
        synced_media_count: connection?.synced_media_count ?? 0,
        // Surfaced so the redirect URI can be copied into the Meta app
        // dashboard without guessing at it.
        redirect_uri: configured ? redirectUri() : null,
      })
    }

    if (req.method === 'POST') {
      if (!configured) {
        return res.status(400).json({
          error: 'INSTAGRAM_APP_ID and INSTAGRAM_APP_SECRET are not set on this deployment',
        })
      }
      const state = randomUUID()
      await saveConnection({
        pending_state: state,
        pending_state_at: new Date().toISOString(),
      })
      return res.status(200).json({ url: authorizeUrl(state) })
    }

    if (req.method === 'DELETE') {
      await saveConnection({
        access_token: null,
        token_expires_at: null,
        token_refreshed_at: null,
        ig_user_id: null,
        username: null,
        pending_state: null,
        pending_state_at: null,
        last_sync_error: null,
      })
      return res.status(204).end()
    }

    res.setHeader('Allow', 'GET, POST, DELETE')
    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    console.error('admin/instagram-connect error:', err)
    return res.status(500).json({ error: err.message ?? 'Internal error' })
  }
}
