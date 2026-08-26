import { supabaseAdmin } from './supabase-admin.js'

const MAX_TEXT = 512
const MAX_PATH = 200

const IPV4_RE = /^\d{1,3}(\.\d{1,3}){3}$/

function isIp(value) {
  if (!value) return false
  if (IPV4_RE.test(value)) {
    return value.split('.').every((octet) => Number(octet) <= 255)
  }
  // Loose IPv6 check. Postgres inet does the real validation; this only has to
  // keep obvious junk from failing the insert and costing us the row.
  return value.includes(':') && /^[0-9a-fA-F:.]+$/.test(value)
}

// Vercel's edge sets x-real-ip and x-vercel-forwarded-for itself, so both are
// authoritative. x-forwarded-for is the last resort: only its FIRST entry is
// the client, and that entry is also the one a client can forge by sending the
// header itself, which is why everything is validated before use.
export function clientIp(req) {
  const candidates = [
    req.headers['x-real-ip'],
    req.headers['x-vercel-forwarded-for'],
    String(req.headers['x-forwarded-for'] ?? '').split(',')[0],
  ]
  for (const candidate of candidates) {
    const ip = typeof candidate === 'string' ? candidate.trim() : ''
    if (isIp(ip)) return ip
  }
  return null
}

// Query strings carry magic-link token_hash values and OAuth codes. Never
// store them.
export function safePath(value) {
  if (typeof value !== 'string' || !value) return null
  return value.split('?')[0].split('#')[0].slice(0, MAX_PATH)
}

function trim(value, max = MAX_TEXT) {
  return typeof value === 'string' && value ? value.slice(0, max) : null
}

// Append one row to the activity log. NEVER throws: a logging failure must not
// fail the request it is observing.
//
// IMPORTANT: callers must AWAIT this. On Vercel a promise left unawaited can be
// dropped when the function freezes after responding, and the row silently
// never lands. Overlap it with other work (Promise.all) if latency matters.
// Fire-and-forget is a browser-side pattern only, see src/lib/track.js.
export async function logActivity(req, event) {
  try {
    const { error } = await supabaseAdmin.from('activity_events').insert({
      user_id: event.userId ?? null,
      email: event.email ? String(event.email).toLowerCase().slice(0, 320) : null,
      event_type: event.eventType,
      source: event.source ?? 'server',
      webinar_id: event.webinarId ?? null,
      webinar_slug: trim(event.webinarSlug, 128),
      content_id: event.contentId ?? null,
      tool_slug: trim(event.toolSlug, 128),
      entitled: typeof event.entitled === 'boolean' ? event.entitled : null,
      path: safePath(event.path),
      ip_address: clientIp(req),
      user_agent: trim(req.headers['user-agent']),
      metadata: event.metadata ?? {},
    })
    if (error) console.error('logActivity insert failed:', error.message)
  } catch (err) {
    console.error('logActivity error:', err)
  }
}
