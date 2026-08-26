import { supabaseAdmin } from '../_lib/supabase-admin.js'
import { requireAdmin } from '../_lib/require-admin.js'

// Everything needed to reconstruct one person's history, for the admin
// timeline and the Stripe dispute export.
//
// Accepts ?user_id= or ?email=. Email matters: activity_events uses
// ON DELETE SET NULL, so a deleted account leaves rows with a null user_id and
// the email snapshot as the only remaining handle. A dispute arrives with an
// email, not a uuid, so that is the lookup that has to keep working.
const MAX_EVENTS = 2000

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const admin = await requireAdmin(req, res)
  if (!admin) return

  const userId = typeof req.query.user_id === 'string' ? req.query.user_id : null
  const email = typeof req.query.email === 'string' ? req.query.email.toLowerCase() : null
  if (!userId && !email) {
    return res.status(400).json({ error: 'user_id or email is required' })
  }

  try {
    // Query each handle separately and merge, rather than building a PostgREST
    // .or() filter by string interpolation. An email is user-supplied data and
    // the .or() grammar is comma/parenthesis delimited, so interpolating one
    // in would be fragile at best. Both handles are needed: events written
    // before an account existed (an anonymous checkout_start, a lead magnet
    // claim) carry an email with a null user_id, and those are precisely the
    // pre-purchase records a dispute turns on.
    const columns =
      'id, created_at, event_type, source, email, webinar_id, webinar_slug, content_id, tool_slug, entitled, path, ip_address, user_agent, metadata'
    const byHandle = (column, value) =>
      supabaseAdmin
        .from('activity_events')
        .select(columns)
        .eq(column, value)
        .order('created_at', { ascending: true })
        .limit(MAX_EVENTS)

    const [byIdRes, byEmailRes, entRes] = await Promise.all([
      userId ? byHandle('user_id', userId) : Promise.resolve({ data: [], error: null }),
      email ? byHandle('email', email) : Promise.resolve({ data: [], error: null }),
      userId
        ? supabaseAdmin
            .from('user_entitlements')
            .select('id, webinar_id, source, granted_at, expires_at, workshop:webinars(title, slug)')
            .eq('user_id', userId)
            .order('granted_at', { ascending: true })
        : Promise.resolve({ data: [], error: null }),
    ])
    for (const r of [byIdRes, byEmailRes, entRes]) {
      if (r.error) throw r.error
    }

    // A row matching both handles appears in both result sets.
    const merged = new Map()
    for (const row of [...(byIdRes.data ?? []), ...(byEmailRes.data ?? [])]) {
      merged.set(row.id, row)
    }
    const events = [...merged.values()].sort(
      (a, b) => new Date(a.created_at) - new Date(b.created_at)
    )

    // The auth record may be gone (deleted account) while the evidence
    // remains. That is the design, so a miss here is not an error.
    let account = null
    if (userId) {
      const { data } = await supabaseAdmin.auth.admin.getUserById(userId)
      if (data?.user) {
        account = {
          id: data.user.id,
          email: data.user.email,
          first_name: data.user.user_metadata?.first_name ?? '',
          last_name: data.user.user_metadata?.last_name ?? '',
          created_at: data.user.created_at,
          last_sign_in_at: data.user.last_sign_in_at ?? null,
        }
      }
    }

    return res.status(200).json({
      account,
      entitlements: entRes.data ?? [],
      events,
      // Surfaced rather than silently swallowed: a truncated export must say
      // so. Either leg hitting the cap means the merged view is incomplete.
      truncated:
        (byIdRes.data?.length ?? 0) === MAX_EVENTS ||
        (byEmailRes.data?.length ?? 0) === MAX_EVENTS,
    })
  } catch (err) {
    console.error('user-activity error:', err)
    return res.status(500).json({ error: err.message ?? 'Internal error' })
  }
}
