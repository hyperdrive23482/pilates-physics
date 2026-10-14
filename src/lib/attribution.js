/**
 * First-party attribution: how someone found Pilates Physics, kept in their own
 * browser until they become known to us (claiming the spring calculator, or
 * buying), then saved server-side to touch_attribution.
 *
 * PostHog sees UTMs and referrers too, but misses part of the audience (ad
 * blockers, a purchase on a different device than the browsing), so this is the
 * record of our own. Two of them:
 *
 *   first  written on the first page load this browser ever makes, direct or
 *          not, and never overwritten.
 *   last   the most recent page load that arrived from somewhere: an external
 *          referrer or a UTM tag. Starts as a copy of first.
 *
 * RUNS FROM main.jsx, BEFORE REACT, once per document. In-app navigations do
 * not change document.referrer and are not new arrivals, so once is the whole
 * design. Running before React also means a redirecting route still records
 * the path it actually landed on.
 *
 * WHAT IS NEVER STORED. Only the referrer's host, never its URL. Only the
 * landing pathname, never its query string, so `t=` (offer tokens), `token=`,
 * `email=` and Kit's `ck_subscriber_id=` cannot get in. Path segments and UTM
 * values that look like an email, a UUID, a JWT or a random token are replaced
 * or dropped.
 *
 * IMPORTS NOTHING, so it is safe to unit test under node and can never drag
 * the Supabase client into the entry chunk. Every storage access is wrapped
 * because storage can be missing or throw in a private window.
 *
 * Ported from pilates-session-coach/src/lib/attribution.ts.
 */

export const FIRST_TOUCH_KEY = 'pp.attr.first'
export const LAST_TOUCH_KEY = 'pp.attr.last'

export const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']

const MAX_VALUE = 100
const MAX_PATH = 200
export const REDACTED = ':redacted'

const EMAIL_RE = /[^\s@/?#]+@[^\s@/?#]+\.[a-z]{2,}/i
const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i
const JWT_RE = /eyJ[\w-]+\.[\w-]+/
const HEX_TOKEN_RE = /^(?=.*\d)[0-9a-f]{16,}$/i
const B64_CHARS_RE = /^[A-Za-z0-9_-]+$/

/** Looks like personal data or a credential: never stored, whatever it is in. */
function isSensitive(value) {
  return EMAIL_RE.test(value) || UUID_RE.test(value) || JWT_RE.test(value) || HEX_TOKEN_RE.test(value)
}

/** A path segment that looks generated rather than written: 16+ url-safe
 *  characters mixing upper case and digits. Lowercase hyphenated blog slugs,
 *  even with a year in them, do not match. */
function isTokenSegment(segment) {
  return segment.length >= 16 && B64_CHARS_RE.test(segment) && /[A-Z]/.test(segment) && /\d/.test(segment)
}

/** A pathname with every token-like segment replaced by `:redacted`. */
export function redactPath(pathname) {
  const parts = String(pathname || '/').split('/')
  const out = parts.map((raw, i) => {
    if (i === 0 || raw === '') return raw
    let segment = raw
    try {
      segment = decodeURIComponent(raw)
    } catch {
      // Malformed escape: judge it as written.
    }
    if (isSensitive(segment) || isTokenSegment(segment)) return REDACTED
    return raw
  })
  const path = out.join('/') || '/'
  return path.length > MAX_PATH ? path.slice(0, MAX_PATH) : path
}

/** A UTM value worth keeping, or null. Sensitive values are dropped outright. */
export function cleanValue(value) {
  const v = (value ?? '').trim()
  if (!v || isSensitive(v)) return null
  // A long unbroken mixed-case-and-digit string is a click or subscriber id.
  if (v.length >= 32 && B64_CHARS_RE.test(v) && /[A-Z]/.test(v) && /\d/.test(v)) return null
  return v.slice(0, MAX_VALUE)
}

/** The referrer's host, lowercased and without `www.`, or null. */
export function referrerHost(referrer) {
  if (!referrer) return null
  try {
    const url = new URL(referrer)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
    const host = url.hostname.toLowerCase().replace(/^www\./, '')
    return host ? host.slice(0, MAX_VALUE) : null
  } catch {
    return null
  }
}

/** Hosts that are us: navigating between them is not arriving from somewhere. */
function isOwnHost(host, currentHost) {
  const current = String(currentHost || '').toLowerCase().replace(/^www\./, '')
  return (
    host === current ||
    host === 'pilatesphysics.com' ||
    host.endsWith('.pilatesphysics.com') ||
    host.endsWith('.vercel.app') ||
    host === 'localhost' ||
    host === '127.0.0.1'
  )
}

/** Hosts that send people back to us mid-flow: Stripe after checkout, Supabase
 *  after an email link, Kit after a form confirmation. Not a source. */
function isFlowHost(host) {
  return (
    host === 'stripe.com' ||
    host.endsWith('.stripe.com') ||
    host.endsWith('.supabase.co') ||
    host === 'kit.com' ||
    host.endsWith('.kit.com') ||
    host.endsWith('.convertkit.com')
  )
}

/** The touch for one page load. Pure, so it can be tested without a browser. */
export function touchFromPageLoad(href, referrer, now) {
  const url = new URL(href)
  const utm = {}
  for (const key of UTM_KEYS) utm[key] = cleanValue(url.searchParams.get(key))

  const host = referrerHost(referrer)
  const external = host && !isOwnHost(host, url.hostname) && !isFlowHost(host) ? host : null

  const touch = {
    referrer_host: external,
    ...utm,
    landing_path: redactPath(url.pathname),
    at: now.toISOString(),
  }
  const hasSource = external !== null || UTM_KEYS.some((k) => utm[k] !== null)
  return { touch, hasSource }
}

function storage() {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage
  } catch {
    return null
  }
}

/** Record this page load. Called once per document from main.jsx. */
export function captureAttribution() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return
  const store = storage()
  if (!store) return
  try {
    const { touch, hasSource } = touchFromPageLoad(window.location.href, document.referrer, new Date())
    const value = JSON.stringify(touch)
    if (!store.getItem(FIRST_TOUCH_KEY)) {
      store.setItem(FIRST_TOUCH_KEY, value)
      store.setItem(LAST_TOUCH_KEY, value)
    } else if (hasSource) {
      store.setItem(LAST_TOUCH_KEY, value)
    }
  } catch {
    // Quota, a blocked write, or a URL the browser itself could not parse.
  }
}

/** A stored touch, re-checked field by field: storage is user-editable. */
export function parseTouch(raw) {
  if (!raw) return null
  try {
    const p = JSON.parse(raw)
    if (!p || typeof p !== 'object') return null
    const at = typeof p.at === 'string' && !Number.isNaN(Date.parse(p.at)) ? new Date(p.at).toISOString() : null
    const path =
      typeof p.landing_path === 'string' && p.landing_path.startsWith('/') ? redactPath(p.landing_path) : null
    if (!at || !path) return null
    const utm = {}
    for (const key of UTM_KEYS) utm[key] = typeof p[key] === 'string' ? cleanValue(p[key]) : null
    const host = typeof p.referrer_host === 'string' ? referrerHost(`https://${p.referrer_host}`) : null
    return { referrer_host: host, ...utm, landing_path: path, at }
  } catch {
    return null
  }
}

/**
 * Both records, shaped as the `attribution` field the lead-claim and checkout
 * endpoints accept. Null fields when the browser kept nothing.
 */
export function readAttribution() {
  const store = storage()
  if (!store) return { first: null, last: null }
  try {
    return {
      first: parseTouch(store.getItem(FIRST_TOUCH_KEY)),
      last: parseTouch(store.getItem(LAST_TOUCH_KEY)),
    }
  } catch {
    return { first: null, last: null }
  }
}
