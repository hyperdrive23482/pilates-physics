/**
 * Server side of first-party attribution.
 *
 * Two jobs:
 *   1. Validate and persist the `attribution` object a browser posts (from
 *      src/lib/attribution.js) into touch_attribution, once per account.
 *   2. Bucket a stored touch into a source name ("Instagram", "Google",
 *      "Direct") for the Funnel and Audience panels, so every admin page puts
 *      a person under the same source.
 *
 * The pure functions here import nothing and are unit-tested in
 * attribution.test.js. Only recordTouchAttribution touches the database, and
 * it is imported lazily by the two endpoints that call it.
 *
 * Ported from pilates-session-coach/supabase/functions/_shared/attribution.ts.
 */

export const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']

const MAX_VALUE = 100
const MAX_PATH = 200

const EMAIL_RE = /[^\s@/?#]+@[^\s@/?#]+\.[a-z]{2,}/i
const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i
const JWT_RE = /eyJ[\w-]+\.[\w-]+/
const HEX_TOKEN_RE = /^(?=.*\d)[0-9a-f]{16,}$/i
const HOST_RE = /^[a-z0-9.-]+$/

function isSensitive(value) {
  return EMAIL_RE.test(value) || UUID_RE.test(value) || JWT_RE.test(value) || HEX_TOKEN_RE.test(value)
}

/** A text value a browser sent, or null. The client already redacted; this
 *  repeats it because a browser can send anything. */
export function cleanValue(value, max = MAX_VALUE) {
  if (typeof value !== 'string') return null
  const v = value.trim()
  if (!v || isSensitive(v)) return null
  return v.slice(0, max)
}

function cleanHost(value) {
  const v = cleanValue(value)
  if (!v) return null
  const host = v.toLowerCase().replace(/^www\./, '')
  return HOST_RE.test(host) ? host : null
}

function cleanPath(value) {
  if (typeof value !== 'string' || !value.startsWith('/')) return null
  // Query strings and fragments never land, whatever the client did.
  const path = value.split('?')[0].split('#')[0]
  const segments = path.split('/').map((seg) => (seg && isSensitive(seg) ? ':redacted' : seg))
  return segments.join('/').slice(0, MAX_PATH) || '/'
}

function cleanAt(value) {
  if (typeof value !== 'string') return null
  const t = Date.parse(value)
  if (Number.isNaN(t)) return null
  // A timestamp from the future or before the site existed is junk.
  if (t > Date.now() + 86400000 || t < Date.parse('2024-01-01T00:00:00Z')) return null
  return new Date(t).toISOString()
}

/**
 * One touch as posted by the browser, validated field by field. Returns null
 * when the object is missing or has no timestamp, which is what a browser with
 * storage blocked sends.
 */
export function cleanTouch(raw) {
  if (!raw || typeof raw !== 'object') return null
  const at = cleanAt(raw.at)
  if (!at) return null
  const touch = {
    referrer_host: cleanHost(raw.referrer_host),
    landing_path: cleanPath(raw.landing_path),
    at,
  }
  for (const key of UTM_KEYS) touch[key] = cleanValue(raw[key])
  return touch
}

/** The posted `attribution` object as `{first, last}`, each cleaned or null. */
export function cleanAttribution(raw) {
  if (!raw || typeof raw !== 'object') return { first: null, last: null }
  return { first: cleanTouch(raw.first), last: cleanTouch(raw.last) }
}

/** Flattens `{first, last}` into the touch_attribution column shape. */
export function touchColumns(attribution) {
  const out = {}
  for (const prefix of ['first', 'last']) {
    const t = attribution?.[prefix] ?? null
    out[`${prefix}_referrer_host`] = t?.referrer_host ?? null
    out[`${prefix}_landing_path`] = t?.landing_path ?? null
    out[`${prefix}_seen_at`] = t?.at ?? null
    for (const key of UTM_KEYS) out[`${prefix}_${key}`] = t?.[key] ?? null
  }
  return out
}

/**
 * A compact form for Stripe Checkout metadata (50 keys, 500 chars each). Only
 * the fields the funnel buckets on, so a session carries its own attribution
 * through to the webhook without a round trip to our database.
 */
export function attributionToMetadata(attribution) {
  const meta = {}
  for (const prefix of ['first', 'last']) {
    const t = attribution?.[prefix]
    if (!t) continue
    meta[`attr_${prefix}_at`] = t.at
    if (t.referrer_host) meta[`attr_${prefix}_ref`] = t.referrer_host
    if (t.landing_path) meta[`attr_${prefix}_path`] = t.landing_path.slice(0, 200)
    if (t.utm_source) meta[`attr_${prefix}_src`] = t.utm_source
    if (t.utm_medium) meta[`attr_${prefix}_med`] = t.utm_medium
    if (t.utm_campaign) meta[`attr_${prefix}_camp`] = t.utm_campaign
    if (t.utm_content) meta[`attr_${prefix}_cont`] = t.utm_content
    if (t.utm_term) meta[`attr_${prefix}_term`] = t.utm_term
  }
  return meta
}

/** The inverse of attributionToMetadata, re-cleaned. */
export function attributionFromMetadata(meta) {
  if (!meta || typeof meta !== 'object') return { first: null, last: null }
  const read = (prefix) =>
    cleanTouch({
      at: meta[`attr_${prefix}_at`],
      referrer_host: meta[`attr_${prefix}_ref`],
      landing_path: meta[`attr_${prefix}_path`],
      utm_source: meta[`attr_${prefix}_src`],
      utm_medium: meta[`attr_${prefix}_med`],
      utm_campaign: meta[`attr_${prefix}_camp`],
      utm_content: meta[`attr_${prefix}_cont`],
      utm_term: meta[`attr_${prefix}_term`],
    })
  return { first: read('first'), last: read('last') }
}

// ---------------------------------------------------------------------------
// Bucketing: a stored touch -> the place a person would name.
// ---------------------------------------------------------------------------

export const NO_RECORD = 'No record'
export const DIRECT = 'Direct'
export const NO_CAMPAIGN = '(no campaign)'

/** utm_source spellings that mean the same place. Keys are lowercased. */
const UTM_ALIASES = {
  ig: 'Instagram',
  instagram: 'Instagram',
  fb: 'Facebook',
  facebook: 'Facebook',
  google: 'Google',
  chatgpt: 'ChatGPT',
  'chatgpt.com': 'ChatGPT',
  openai: 'ChatGPT',
  youtube: 'YouTube',
  yt: 'YouTube',
  linkedin: 'LinkedIn',
  tiktok: 'TikTok',
  pinterest: 'Pinterest',
  substack: 'Substack',
  kit: 'Email',
  email: 'Email',
  newsletter: 'Email',
  convertkit: 'Email',
  broadcast: 'Email',
}

/** Referrer hosts by the place a person would name. First match wins. */
const HOST_NAMES = [
  [/(^|\.)instagram\.com$/, 'Instagram'],
  [/(^|\.)(l\.instagram\.com)$/, 'Instagram'],
  [/(^|\.)(facebook\.com|fb\.com|fb\.me|l\.facebook\.com|lm\.facebook\.com)$/, 'Facebook'],
  [/^(mail\.google\.com|outlook\.(live|office)\.com|mail\.yahoo\.com)$/, 'Email'],
  [/(^|\.)google\.[a-z.]+$/, 'Google'],
  [/(^|\.)bing\.com$/, 'Bing'],
  [/(^|\.)duckduckgo\.com$/, 'DuckDuckGo'],
  [/(^|\.)(chatgpt\.com|openai\.com)$/, 'ChatGPT'],
  [/(^|\.)perplexity\.ai$/, 'Perplexity'],
  [/(^|\.)(youtube\.com|youtu\.be)$/, 'YouTube'],
  [/(^|\.)(linkedin\.com|lnkd\.in)$/, 'LinkedIn'],
  [/^(t\.co|x\.com|twitter\.com)$/, 'X'],
  [/(^|\.)pinterest\.[a-z.]+$/, 'Pinterest'],
  [/(^|\.)tiktok\.com$/, 'TikTok'],
  [/(^|\.)substack\.com$/, 'Substack'],
  [/(^|\.)linktr\.ee$/, 'Linktree'],
]

export function sourceFromUtm(utmSource) {
  const key = String(utmSource).trim().toLowerCase()
  return UTM_ALIASES[key] ?? key
}

export function sourceFromHost(host) {
  const h = String(host).toLowerCase()
  for (const [re, name] of HOST_NAMES) if (re.test(h)) return name
  return h
}

/**
 * Where one touch came from, most specific first: the utm_source someone chose
 * to tag the link with, then the site that linked them, then nothing (Direct).
 * A touch with no timestamp is the empty record a browser with storage blocked
 * sends, so it is No record.
 *
 * Accepts either the camelCase shape from a touch_attribution row (via
 * touchFromRow) or the snake_case shape a browser posts.
 */
export function touchSource(touch) {
  if (!touch) return NO_RECORD
  const seenAt = touch.seenAt ?? touch.at ?? null
  if (!seenAt) return NO_RECORD
  const utmSource = touch.utmSource ?? touch.utm_source ?? null
  if (utmSource) return sourceFromUtm(utmSource)
  const host = touch.referrerHost ?? touch.referrer_host ?? null
  if (host) return sourceFromHost(host)
  return DIRECT
}

const s = (v) => (typeof v === 'string' && v.length > 0 ? v : null)

/** One touch out of a touch_attribution row. */
export function touchFromRow(row, prefix) {
  if (!row) return null
  return {
    referrerHost: s(row[`${prefix}_referrer_host`]),
    utmSource: s(row[`${prefix}_utm_source`]),
    utmMedium: s(row[`${prefix}_utm_medium`]),
    utmCampaign: s(row[`${prefix}_utm_campaign`]),
    landingPath: s(row[`${prefix}_landing_path`]),
    seenAt: s(row[`${prefix}_seen_at`]),
  }
}

/** A campaign, from first touch or failing that last: a campaign link often
 *  brings back someone who first came another way. */
export function campaignOf(row) {
  return s(row?.first_utm_campaign) ?? s(row?.last_utm_campaign) ?? NO_CAMPAIGN
}

export function countBy(items, key, limit = 12) {
  const counts = new Map()
  for (const item of items) {
    const k = key(item)
    counts.set(k, (counts.get(k) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label))
    .slice(0, limit)
}

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

/**
 * Write a touch_attribution row for this account, once. Idempotent: a second
 * call for the same user is a no-op, so the lead claim and a later checkout
 * cannot overwrite each other, and a Stripe retry cannot double-write.
 *
 * Never throws: attribution is analytics, and a failure here must not break
 * the request that produced it. Returns true when a row was written.
 */
export async function recordTouchAttribution(supabaseAdmin, { userId, email, attribution, via }) {
  if (!userId) return false
  try {
    const clean = cleanAttribution(attribution)
    const { data, error } = await supabaseAdmin
      .from('touch_attribution')
      .upsert(
        {
          user_id: userId,
          email: email ? String(email).toLowerCase().slice(0, 320) : null,
          recorded_via: via,
          ...touchColumns(clean),
        },
        { onConflict: 'user_id', ignoreDuplicates: true },
      )
      .select('user_id')
    if (error) {
      console.error('touch_attribution upsert failed:', error.message)
      return false
    }
    return Boolean(data?.length)
  } catch (err) {
    console.error('recordTouchAttribution error:', err)
    return false
  }
}
