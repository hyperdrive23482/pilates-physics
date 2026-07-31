import { supabaseAdmin } from './supabase-admin.js'

// Instagram API with Instagram Login (the post-2024 flow — no Facebook
// Page required, the professional account authorizes directly).
//
// Endpoints per Meta's Business Login docs:
//   authorize      https://www.instagram.com/oauth/authorize
//   code exchange  https://api.instagram.com/oauth/access_token   (POST, form-encoded)
//   long-lived     https://graph.instagram.com/access_token       (grant_type=ig_exchange_token)
//   refresh        https://graph.instagram.com/refresh_access_token (grant_type=ig_refresh_token)
export const IG_GRAPH = 'https://graph.instagram.com'
export const IG_API_VERSION = 'v25.0'
export const IG_SCOPES = ['instagram_business_basic', 'instagram_business_manage_insights']

// Long-lived tokens last 60 days. Refresh once we're inside this window
// so a missed cron run or two doesn't strand the connection.
const REFRESH_WINDOW_DAYS = 10

export function appCredentials() {
  const clientId = process.env.INSTAGRAM_APP_ID
  const clientSecret = process.env.INSTAGRAM_APP_SECRET
  if (!clientId || !clientSecret) {
    throw new Error('INSTAGRAM_APP_ID and INSTAGRAM_APP_SECRET must be set')
  }
  return { clientId, clientSecret }
}

export function redirectUri() {
  const base = process.env.SITE_BASE_URL
  if (!base) throw new Error('SITE_BASE_URL must be set')
  return `${base.replace(/\/$/, '')}/api/instagram/callback`
}

export function authorizeUrl(state) {
  const { clientId } = appCredentials()
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri(),
    scope: IG_SCOPES.join(','),
    response_type: 'code',
    state,
  })
  return `https://www.instagram.com/oauth/authorize?${params}`
}

// Meta returns errors as JSON with wildly inconsistent shapes depending on
// which host answered. Normalise to a single readable message.
async function readError(res) {
  const text = await res.text()
  try {
    const json = JSON.parse(text)
    return (
      json?.error?.message ??
      json?.error_message ??
      json?.error_description ??
      json?.error ??
      text
    )
  } catch {
    return text || `HTTP ${res.status}`
  }
}

export async function exchangeCodeForToken(code) {
  const { clientId, clientSecret } = appCredentials()
  const res = await fetch('https://api.instagram.com/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri(),
      code,
    }),
  })
  if (!res.ok) throw new Error(`Code exchange failed: ${await readError(res)}`)
  const json = await res.json()
  if (!json.access_token) throw new Error('Code exchange returned no access_token')
  return json.access_token
}

export async function exchangeForLongLivedToken(shortToken) {
  const { clientSecret } = appCredentials()
  const params = new URLSearchParams({
    grant_type: 'ig_exchange_token',
    client_secret: clientSecret,
    access_token: shortToken,
  })
  const res = await fetch(`${IG_GRAPH}/access_token?${params}`)
  if (!res.ok) throw new Error(`Long-lived exchange failed: ${await readError(res)}`)
  const json = await res.json()
  if (!json.access_token) throw new Error('Long-lived exchange returned no access_token')
  return { token: json.access_token, expiresIn: json.expires_in ?? 5184000 }
}

export async function refreshLongLivedToken(token) {
  const params = new URLSearchParams({
    grant_type: 'ig_refresh_token',
    access_token: token,
  })
  const res = await fetch(`${IG_GRAPH}/refresh_access_token?${params}`)
  if (!res.ok) throw new Error(`Token refresh failed: ${await readError(res)}`)
  const json = await res.json()
  if (!json.access_token) throw new Error('Refresh returned no access_token')
  return { token: json.access_token, expiresIn: json.expires_in ?? 5184000 }
}

export async function getConnection() {
  const { data, error } = await supabaseAdmin
    .from('instagram_connection')
    .select('*')
    .eq('id', true)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function saveConnection(patch) {
  const { data, error } = await supabaseAdmin
    .from('instagram_connection')
    .upsert({ id: true, ...patch }, { onConflict: 'id' })
    .select()
    .single()
  if (error) throw error
  return data
}

export function expiresInDays(connection) {
  if (!connection?.token_expires_at) return null
  const ms = new Date(connection.token_expires_at).getTime() - Date.now()
  return Math.floor(ms / 86400000)
}

// Returns a usable token, refreshing first if we're inside the window.
// Throws if there is no connection at all — callers should surface that
// as "not connected" rather than a generic failure.
export async function getUsableToken() {
  const connection = await getConnection()
  if (!connection?.access_token) {
    const err = new Error('Instagram is not connected')
    err.code = 'NOT_CONNECTED'
    throw err
  }

  const days = expiresInDays(connection)
  if (days !== null && days <= REFRESH_WINDOW_DAYS) {
    // A token already past expiry cannot be refreshed — it needs a full
    // reauthorization, and saying so beats a confusing API error.
    if (days < 0) {
      const err = new Error('Instagram token has expired. Reconnect the account.')
      err.code = 'TOKEN_EXPIRED'
      throw err
    }
    const { token, expiresIn } = await refreshLongLivedToken(connection.access_token)
    const saved = await saveConnection({
      access_token: token,
      token_expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
      token_refreshed_at: new Date().toISOString(),
    })
    return { token: saved.access_token, connection: saved }
  }

  return { token: connection.access_token, connection }
}

export async function igGet(path, params, token) {
  const qs = new URLSearchParams({ ...params, access_token: token })
  const url = path.startsWith('http')
    ? `${path}${path.includes('?') ? '&' : '?'}${qs}`
    : `${IG_GRAPH}/${IG_API_VERSION}/${path.replace(/^\//, '')}?${qs}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(await readError(res))
  return res.json()
}
