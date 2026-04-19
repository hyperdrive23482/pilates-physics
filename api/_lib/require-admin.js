import { supabaseAdmin } from './supabase-admin.js'

// Verify the caller's Authorization Bearer JWT belongs to an admin user.
// Returns { user } on success. On failure, sends an error response and returns null.
export async function requireAdmin(req, res) {
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
  if (data.user.user_metadata?.is_admin !== true) {
    res.status(403).json({ error: 'Admin access required' })
    return null
  }
  return { user: data.user }
}
