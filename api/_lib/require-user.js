import { supabaseAdmin } from './supabase-admin.js'

// Verify the caller's Authorization Bearer JWT and return the authenticated user.
// Returns { user } on success. On failure, sends an error response and returns null.
export async function requireUser(req, res) {
  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing bearer token' })
    return null
  }
  const { data, error } = await supabaseAdmin.auth.getUser(auth.slice(7))
  if (error || !data?.user) {
    res.status(401).json({ error: 'Invalid token' })
    return null
  }
  return { user: data.user }
}
