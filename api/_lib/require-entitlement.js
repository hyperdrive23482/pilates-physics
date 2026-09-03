import { supabaseAdmin } from './supabase-admin.js'

/**
 * Confirm a verified user may reach a product's paid contents.
 *
 * Lifted out of api/certificate/[workshopId].js so the quiz enforces access
 * the same way the certificate does. Two endpoints checking entitlement with
 * two copies of the logic is how one of them ends up subtly weaker.
 *
 * Admins bypass, which is how a course can be checked before anyone buys it.
 * The caller is told, because a bypassed check must never be logged as if the
 * person were entitled: `entitled` stays null for an admin rather than true.
 *
 * On failure this sends the response and returns null, matching requireUser.
 *
 * @returns {Promise<{ isAdmin: boolean, entitled: boolean | null } | null>}
 */
export async function requireEntitlement(res, user, webinarId) {
  const isAdmin = user.user_metadata?.is_admin === true
  if (isAdmin) return { isAdmin: true, entitled: null }

  const { data: ent, error } = await supabaseAdmin
    .from('user_entitlements')
    .select('id, expires_at')
    .eq('user_id', user.id)
    .eq('webinar_id', webinarId)
    .maybeSingle()

  if (error) throw error
  if (!ent) {
    res.status(403).json({ error: 'No access to this course' })
    return null
  }
  if (ent.expires_at && new Date(ent.expires_at) <= new Date()) {
    res.status(403).json({ error: 'Access expired' })
    return null
  }

  return { isAdmin: false, entitled: true }
}
