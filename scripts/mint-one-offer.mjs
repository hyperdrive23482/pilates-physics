// Mint ONE $39 window by hand, for testing.
//
// The cron is the real minter and it is deliberately all-or-nothing: switching
// MINT_OFFERS_ENABLED on starts a four-day clock for everyone carrying
// in-HARW-sequence. That is the wrong instrument for "I want to click my own
// link once", which is what this is for.
//
// It writes the database row only. The two Kit custom fields are yours to set
// by hand -- it prints exactly what to paste and where.
//
// Run:
//   node --env-file=.env scripts/mint-one-offer.mjs you@example.com
//   node --env-file=.env scripts/mint-one-offer.mjs you@example.com --days -1
//
// Needs VITE_SUPABASE_URL (already in .env) and SUPABASE_SERVICE_ROLE_KEY
// (not -- add it; the table is service-role only, by design, because a
// browser-readable offer table would hand out every live token at once).
//
//   --days N   length of the window in calendar days. Default 4, matching the
//              cron. Use a NEGATIVE number to mint an already-closed window and
//              test the expired page without waiting four days for one.
//   --key K    offer_key. Default "manual-test", deliberately not a real
//              campaign key -- see the guard below.

import { endOfOfferWindow, formatDeadline } from '../api/_lib/offer.js'
import crypto from 'node:crypto'

const COURSE_SLUG = 'how-a-reformer-works'
const SITE = process.env.SITE_BASE_URL ?? 'https://pilatesphysics.com'

// Using a live campaign key here would burn the person's real offer: the unique
// index on (offer_key, lower(email)) means the cron will then skip them
// forever, and they would never receive the window the emails promise.
const RESERVED_KEYS = [/^reformer-nurture$/, /^reformer-backfill/]

const args = process.argv.slice(2)
const email = (args.find((a) => !a.startsWith('--')) ?? '').trim().toLowerCase()
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback
}

const days = Number(flag('days', '4'))
const offerKey = flag('key', 'manual-test')

if (!email || !email.includes('@')) {
  console.error('Usage: node --env-file=.env scripts/mint-one-offer.mjs you@example.com [--days N] [--key K]')
  process.exit(2)
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('SUPABASE_SERVICE_ROLE_KEY is not set. Add it to .env (it is gitignored).')
  process.exit(2)
}
if (Number.isNaN(days)) {
  console.error(`--days must be a number, got "${flag('days', '')}"`)
  process.exit(2)
}
if (RESERVED_KEYS.some((re) => re.test(offerKey))) {
  console.error(`Refusing to mint under "${offerKey}": that is a live campaign key.`)
  console.error('A test row there permanently consumes that person\'s real offer,')
  console.error('because the unique index makes the cron skip them from then on.')
  process.exit(2)
}

// Say which database this is about to write to. These scripts get run against
// whatever .env happens to hold, and prod and staging look identical from here.
const host = (() => {
  try {
    return new URL(process.env.VITE_SUPABASE_URL).host
  } catch {
    return '(unparseable VITE_SUPABASE_URL)'
  }
})()
// Imported here, not at the top. api/_lib/supabase-admin.js constructs its
// client on import and createClient throws on a missing key, so an eager import
// would crash with a supabase-js stack trace before the env check above ever
// ran -- burying the one line that says what to do about it.
const { supabaseAdmin } = await import('../api/_lib/supabase-admin.js')

console.log(`database : ${host}`)
console.log(`email    : ${email}`)
console.log(`offer_key: ${offerKey}`)
console.log('')

const { data: course, error: courseErr } = await supabaseAdmin
  .from('webinars')
  .select('id, title')
  .eq('slug', COURSE_SLUG)
  .maybeSingle()
if (courseErr) throw courseErr
if (!course) {
  console.error(`No webinars row for "${COURSE_SLUG}". Has migration 045 been applied here?`)
  process.exit(1)
}

const token = crypto.randomBytes(24).toString('base64url')
const expiresAt = endOfOfferWindow(new Date(), days)
const deadline = formatDeadline(expiresAt)

// Re-runnable on purpose. Testing means minting repeatedly for the same address,
// and the unique index would otherwise reject every run after the first. An
// existing row is refreshed with a new token and deadline rather than failing,
// and redeemed_at is cleared so a test purchase does not poison the next run.
const { data: existing } = await supabaseAdmin
  .from('subscriber_offers')
  .select('id')
  .eq('offer_key', offerKey)
  .eq('email', email)
  .maybeSingle()

let row
if (existing) {
  const { data, error } = await supabaseAdmin
    .from('subscriber_offers')
    .update({
      token,
      expires_at: expiresAt.toISOString(),
      webinar_id: course.id,
      redeemed_at: null,
      redeemed_email: null,
      first_seen_at: null,
      recovery_sent_at: null,
      kit_synced_at: null,
    })
    .eq('id', existing.id)
    .select('id, token, expires_at')
    .single()
  if (error) throw error
  row = data
  console.log('refreshed the existing row (new token, clock reset)')
} else {
  const { data, error } = await supabaseAdmin
    .from('subscriber_offers')
    .insert({
      offer_key: offerKey,
      email,
      token,
      webinar_id: course.id,
      expires_at: expiresAt.toISOString(),
    })
    .select('id, token, expires_at')
    .single()
  if (error) throw error
  row = data
  console.log('minted a new row')
}

const url = `${SITE}/offer/reformer?t=${encodeURIComponent(row.token)}`
const closed = expiresAt <= new Date()

console.log('')
console.log('--- paste into Kit, on this subscriber ---')
console.log(`offer_token     ${row.token}`)
console.log(`offer_deadline  ${deadline}`)
console.log('')
console.log('--- or skip Kit and open this directly ---')
console.log(url)
console.log('')
console.log(`window ${closed ? 'CLOSED' : 'open until'} ${expiresAt.toISOString()}`)
console.log(
  closed
    ? 'Expect the expired page: $69, "your $39 window closed", checkout still reachable.'
    : 'Expect the active page: $39, a countdown, and the deadline named.',
)
process.exit(0)
