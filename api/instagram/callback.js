import {
  exchangeCodeForToken,
  exchangeForLongLivedToken,
  getConnection,
  saveConnection,
  igGet,
} from '../_lib/instagram.js'

// OAuth redirect target for Business Login for Instagram.
//
// This route is deliberately NOT admin-gated: Instagram redirects the
// browser here directly, so there is no bearer token to check. The guard
// is the `state` nonce, which only an authenticated admin could have
// written (see api/admin/instagram-connect.js) and which is single-use.
const STATE_TTL_MS = 10 * 60 * 1000

function adminUrl(query) {
  const base = (process.env.SITE_BASE_URL ?? '').replace(/\/$/, '')
  return `${base}/admin/instagram${query}`
}

function fail(res, message) {
  console.error('instagram/callback:', message)
  return res.redirect(302, adminUrl(`?ig_error=${encodeURIComponent(message)}`))
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { code, state, error_description: errorDescription, error: oauthError } = req.query

  // Instagram sends the user back here with an error when they decline.
  if (oauthError) return fail(res, errorDescription || oauthError)
  if (!code) return fail(res, 'Instagram did not return an authorization code')
  if (!state) return fail(res, 'Missing state parameter')

  try {
    const connection = await getConnection()
    if (!connection?.pending_state) {
      return fail(res, 'No pending authorization. Start again from the planner.')
    }
    if (connection.pending_state !== state) {
      return fail(res, 'State mismatch. Authorization rejected.')
    }
    if (
      connection.pending_state_at &&
      Date.now() - new Date(connection.pending_state_at).getTime() > STATE_TTL_MS
    ) {
      return fail(res, 'Authorization expired. Start again from the planner.')
    }

    const shortToken = await exchangeCodeForToken(code)
    const { token, expiresIn } = await exchangeForLongLivedToken(shortToken)

    // Confirm the token works and capture who it belongs to, so the UI can
    // show which account is connected.
    let profile = {}
    try {
      profile = await igGet('me', { fields: 'user_id,username' }, token)
    } catch (e) {
      console.error('instagram/callback: profile lookup failed', e)
    }

    await saveConnection({
      access_token: token,
      token_expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
      token_refreshed_at: new Date().toISOString(),
      ig_user_id: profile.user_id ? String(profile.user_id) : null,
      username: profile.username ?? null,
      pending_state: null,
      pending_state_at: null,
      last_sync_error: null,
    })

    return res.redirect(302, adminUrl('?connected=1'))
  } catch (err) {
    return fail(res, err.message ?? 'Authorization failed')
  }
}
