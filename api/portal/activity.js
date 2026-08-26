import { supabaseAdmin } from '../_lib/supabase-admin.js'
import { requireUser } from '../_lib/require-user.js'
import { logActivity, safePath } from '../_lib/log-activity.js'

// Deliberately NOT named /api/track. Filter lists (uBlock Origin, AdGuard,
// EasyPrivacy) commonly block URL paths matching /track, and a blocked ping
// leaves no trace at all: a dispute timeline would show a gap indistinguishable
// from a customer who never signed in. Keep this path boring.

// Event types a browser is allowed to assert. Server-only types
// (checkout_start, certificate_download, purchase, lead_magnet_claim) are
// deliberately absent: only server code may write those, so a client can never
// manufacture the strongest class of evidence.
//
// tool_open is present but writes source='client'. The ten animation-* tools
// are logged server-side in portal/animation.js; the four client-only tools
// (spring-load-calculator, springs-101, reformer-force-modeler,
// class-simulator) make no server call, so a browser-asserted event is the only
// coverage available for them. The source column keeps the two distinguishable.
const CLIENT_EVENTS = new Set([
  'login',
  'portal_view',
  'dashboard_view',
  'content_click',
  'download',
  'tool_open',
])

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Collapses mechanical duplicates only: StrictMode double-mounts, double
// clicks, reload races. Deliberately short, because a genuine repeat visit an
// hour later is real evidence and must be recorded. Session-level rollup is an
// analytics-time GROUP BY, not a write-time decision.
const DEDUP_WINDOW_SECONDS = 60

const META_KEYS = ['method', 'content_type', 'content_title', 'label']

// Slugs are compared against the webinars table, so keep the charset tight.
const SLUG_RE = /^[a-z0-9-]{1,128}$/i

function sanitizeMetadata(input) {
  if (!input || typeof input !== 'object') return {}
  const out = {}
  for (const key of META_KEYS) {
    const value = input[key]
    if (typeof value === 'string' && value) out[key] = value.slice(0, 200)
  }
  return out
}

const uuidOrNull = (value) => (UUID_RE.test(String(value ?? '')) ? value : null)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const auth = await requireUser(req, res)
  if (!auth) return
  const { user } = auth

  const body = req.body ?? {}
  const eventType = body.event_type
  if (!CLIENT_EVENTS.has(eventType)) {
    return res.status(400).json({ error: 'Unknown event type' })
  }

  const webinarId = uuidOrNull(body.webinar_id)
  const contentId = uuidOrNull(body.content_id)
  const toolSlug = SLUG_RE.test(String(body.tool_slug ?? '')) ? body.tool_slug : null

  try {
    // Independently re-verify entitlement. The browser says "I opened X"; the
    // server confirms this account was actually allowed to. That is what keeps
    // a client-asserted event worth something as evidence.
    let entitled = null
    let webinarSlug = null
    if (webinarId) {
      const [workshopRes, entRes] = await Promise.all([
        supabaseAdmin.from('webinars').select('slug').eq('id', webinarId).maybeSingle(),
        supabaseAdmin
          .from('user_entitlements')
          .select('id, expires_at')
          .eq('user_id', user.id)
          .eq('webinar_id', webinarId)
          .maybeSingle(),
      ])
      webinarSlug = workshopRes.data?.slug ?? null
      const ent = entRes.data
      entitled =
        user.user_metadata?.is_admin === true ||
        (!!ent && (!ent.expires_at || new Date(ent.expires_at) > new Date()))
    }

    const since = new Date(Date.now() - DEDUP_WINDOW_SECONDS * 1000).toISOString()
    let probe = supabaseAdmin
      .from('activity_events')
      .select('id')
      .eq('user_id', user.id)
      .eq('event_type', eventType)
      .gte('created_at', since)
      .limit(1)
    probe = webinarId ? probe.eq('webinar_id', webinarId) : probe.is('webinar_id', null)
    probe = contentId ? probe.eq('content_id', contentId) : probe.is('content_id', null)
    const { data: recent } = await probe
    if (recent?.length) return res.status(204).end()

    await logActivity(req, {
      userId: user.id,
      email: user.email,
      eventType,
      source: 'client',
      webinarId,
      webinarSlug,
      contentId,
      toolSlug,
      entitled,
      path: safePath(body.path),
      metadata: sanitizeMetadata(body.metadata),
    })

    return res.status(204).end()
  } catch (err) {
    // A tracking failure must never surface to the user. Log and succeed.
    console.error('track error:', err)
    return res.status(204).end()
  }
}
