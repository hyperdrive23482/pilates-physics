import crypto from 'node:crypto'
import { supabaseAdmin } from '../_lib/supabase-admin.js'
import { listSubscribersByTag, updateSubscriberFields } from '../_lib/kit.js'
import { endOfOfferWindow, formatDeadline } from '../_lib/offer.js'

// Vercel Cron: GET /api/cron/mint-offers, every 15 minutes.
//
// Mints the $39 window for everyone Kit has moved into the cart sequence, and
// writes the token and deadline back to Kit so email 4 can carry the link.
//
// The cron is a pure READER of Kit tags. It never applies or removes one --
// every tag transition is owned by a Kit automation, so the funnel stays
// legible in one screen of the Kit dashboard instead of being split between
// there and this file.
//
// THERE IS NO CURSOR STATE. An earlier draft tracked one, which meant storing
// cron state the schema has nowhere to put and getting the advance ordering
// exactly right so a mid-batch failure could not orphan a row holding a token
// nobody received. The unique index on (offer_key, lower(email)) makes minting
// idempotent instead, so re-reading the same subscribers costs one query and
// nothing else. A run that dies halfway is picked up fifteen minutes later, and
// the rows whose kit_synced_at is still null are the retry queue.

const COURSE_SLUG = 'how-a-reformer-works'
const OFFER_TAG = 'in-HARW-sequence'
const BACKFILL_TAG = 'HARW-backfill'

const NURTURE_KEY = 'reformer-nurture'
const BACKFILL_KEY = 'reformer-backfill-2026-09'

// Kit allows 120 requests per rolling 60 seconds per API key. Each subscriber
// costs one PUT, so 40 writes plus a handful of reads sits well under the
// ceiling at one write every 600ms, and finishes inside the 60s maxDuration set
// for this function in vercel.json.
//
// At a 15-minute cadence this still mints up to 3,840 offers a day, an order of
// magnitude more headroom than a 238-person backfill needs.
const MAX_WRITES_PER_RUN = 40
const WRITE_DELAY_MS = 600

// Honouring tagged_at is right until it would hand someone a window that is
// already dead. Below this much time remaining, re-anchor to now.
const MIN_USEFUL_WINDOW_MS = 2 * 24 * 60 * 60 * 1000

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// 32 URL-safe characters. Opaque on purpose: nothing about the value is derived
// from the subscriber, so the token carries no PII into a URL, a referrer
// header, or a forwarded email.
const newToken = () => crypto.randomBytes(24).toString('base64url')

// Page through every subscriber carrying a tag. Keyed by lowercased email so
// the two tag lists can be intersected by address.
async function subscribersByTag(tagName) {
  const found = new Map()
  let after = null
  // Bounded so a pagination bug cannot spin this function until it times out.
  for (let page = 0; page < 20; page += 1) {
    const { subscribers, nextCursor } = await listSubscribersByTag(tagName, { after })
    for (const sub of subscribers) {
      if (sub.email_address) found.set(sub.email_address.toLowerCase(), sub)
    }
    if (!nextCursor) break
    after = nextCursor
  }
  return found
}

// Addresses that already hold the course, so nobody is offered a discount on
// something they own. Kit's "HARW Purchase" automation removes the offer tag at
// purchase time and is the primary defence; this is the backstop for the
// backfill cohort, some of whom bought before that automation existed.
//
// Sending a discount for something someone already bought is the kind of error
// people screenshot.
async function entitledEmails(webinarId) {
  const { data: ents, error } = await supabaseAdmin
    .from('user_entitlements')
    .select('user_id')
    .eq('webinar_id', webinarId)
  if (error) throw error

  const ids = new Set((ents ?? []).map((e) => e.user_id))
  if (ids.size === 0) return new Set()

  // listUsers has no id filter, so page the user list once per run and keep the
  // addresses we care about. Same pattern as findUserByEmail in
  // provision-purchase.js, but paid for once rather than once per candidate.
  const emails = new Set()
  const perPage = 200
  for (let page = 1; page <= 20; page += 1) {
    const { data, error: listErr } = await supabaseAdmin.auth.admin.listUsers({ page, perPage })
    if (listErr) throw listErr
    for (const user of data.users) {
      if (ids.has(user.id) && user.email) emails.add(user.email.toLowerCase())
    }
    if (data.users.length < perPage) break
  }
  return emails
}

// OFF UNLESS EXPLICITLY ENABLED, and the default direction is deliberate.
//
// Minting is not reversible from the outside: it starts a four-day clock and
// writes a deadline into Kit, and if the cart sequence is not actually sending
// yet, that window expires in silence. Worse, the unique index on
// (offer_key, lower(email)) then refuses to mint a second one, so the person
// has spent their offer for that campaign without ever seeing it.
//
// So deploying the code and starting the clocks are two separate decisions.
// Unset, this runs as a DRY RUN: it reports exactly who it would mint for and
// changes nothing. Set MINT_OFFERS_ENABLED=true in Vercel when Kit is actually
// sending, and the same run starts minting.
//
// Failing closed means a forgotten variable means nobody gets a link -- visible
// in the response and in the first email that ships without one. Failing open
// would mean silently spent offers, which is not recoverable.
const isEnabled = () => process.env.MINT_OFFERS_ENABLED === 'true'

export default async function handler(req, res) {
  const auth = req.headers.authorization
  const expected = process.env.CRON_SECRET
  if (expected && auth !== `Bearer ${expected}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const enabled = isEnabled()
  const result = {
    enabled,
    dry_run: !enabled,
    scanned: 0,
    would_mint: 0,
    minted: 0,
    synced: 0,
    skipped_entitled: 0,
    errors: [],
  }

  try {
    const { data: course, error: courseErr } = await supabaseAdmin
      .from('webinars')
      .select('id')
      .eq('slug', COURSE_SLUG)
      .maybeSingle()
    if (courseErr) throw courseErr
    if (!course) throw new Error(`No webinars row for slug "${COURSE_SLUG}"`)

    // ---- 1. Who is in the cart sequence, and which cohort are they? --------
    const inSequence = await subscribersByTag(OFFER_TAG)
    result.scanned = inSequence.size
    if (inSequence.size === 0) return res.status(200).json(result)

    // The backfill tag is the ONLY thing that can tell the two cohorts apart:
    // both enter through the same offer tag. A missing tag is not fatal -- it
    // has simply not been created yet, and everyone counts as nurture.
    let backfill = new Map()
    try {
      backfill = await subscribersByTag(BACKFILL_TAG)
    } catch (err) {
      console.warn(`mint-offers: no ${BACKFILL_TAG} tag yet (${err.message})`)
    }

    const emails = [...inSequence.keys()]
    const entitled = await entitledEmails(course.id)

    // ---- 2. What do we already have? --------------------------------------
    const { data: existingRows, error: rowsErr } = await supabaseAdmin
      .from('subscriber_offers')
      .select('id, email, token, expires_at, kit_synced_at')
      .eq('webinar_id', course.id)
      .in('email', emails)
    if (rowsErr) throw rowsErr

    const byEmail = new Map((existingRows ?? []).map((r) => [r.email.toLowerCase(), r]))

    // ---- 3. Mint what is missing ------------------------------------------
    const toSync = []

    for (const email of emails) {
      if (byEmail.has(email)) continue
      if (entitled.has(email)) {
        result.skipped_entitled += 1
        continue
      }
      result.would_mint += 1

      // Dry run: counted, and nothing else. No row, no Kit write, no clock.
      if (!enabled) continue

      if (toSync.length >= MAX_WRITES_PER_RUN) break

      const sub = inSequence.get(email)

      // The clock starts when Kit applied the tag, not when this run happened
      // to notice. Normally those are minutes apart; after a cron outage they
      // are not, and tagged_at is what email 4's "4 days" was measured from.
      const taggedAt = sub.tagged_at ? new Date(sub.tagged_at) : new Date()
      let expiresAt = endOfOfferWindow(taggedAt)

      // ...unless honouring tagged_at would hand someone a window that is
      // already dead or nearly so, which happens only if this job was broken
      // for days. Re-anchoring is the generous direction to err, and a link
      // that works beats a link that apologises for our own downtime.
      if (expiresAt.getTime() - Date.now() < MIN_USEFUL_WINDOW_MS) {
        console.warn(
          `mint-offers: ${email} tagged ${sub.tagged_at} would expire ${expiresAt.toISOString()}, re-anchoring to now`,
        )
        expiresAt = endOfOfferWindow(new Date())
      }

      const row = {
        offer_key: backfill.has(email) ? BACKFILL_KEY : NURTURE_KEY,
        email,
        token: newToken(),
        webinar_id: course.id,
        expires_at: expiresAt.toISOString(),
      }

      const { data: inserted, error: insErr } = await supabaseAdmin
        .from('subscriber_offers')
        .insert(row)
        .select('id, email, token, expires_at')
        .single()

      if (insErr) {
        // A unique violation means a concurrent run won the race. Not an error.
        if (insErr.code === '23505') continue
        result.errors.push(`insert ${email}: ${insErr.message}`)
        continue
      }
      result.minted += 1
      toSync.push({ row: inserted, sub })
    }

    // ---- 4. Rows still owing a write to Kit --------------------------------
    // The retry queue: anything minted by an earlier run whose Kit write failed.
    // They still carry the tag, so their subscriber id is already in the map and
    // finding them costs no extra Kit call.
    for (const [email, existing] of enabled ? byEmail : []) {
      if (existing.kit_synced_at) continue
      if (toSync.length >= MAX_WRITES_PER_RUN) break
      const sub = inSequence.get(email)
      if (sub) toSync.push({ row: existing, sub })
    }

    // ---- 5. Write the token and deadline back to Kit -----------------------
    for (const [i, entry] of toSync.entries()) {
      const { row, sub } = entry
      if (i > 0) await sleep(WRITE_DELAY_MS)
      try {
        await updateSubscriberFields(sub.id, sub.email_address, {
          offer_token: row.token,
          // A human string, never a timestamp: Kit formats nothing, and
          // whatever lands here is exactly what email 8 shows the reader.
          offer_deadline: formatDeadline(new Date(row.expires_at)),
        })
        const { error: stampErr } = await supabaseAdmin
          .from('subscriber_offers')
          .update({ kit_synced_at: new Date().toISOString() })
          .eq('id', row.id)
        if (stampErr) throw stampErr
        result.synced += 1
      } catch (err) {
        // Leave kit_synced_at null. That IS the retry queue, and the partial
        // index in migration 050 is what makes finding it cheap.
        result.errors.push(`kit sync ${row.email}: ${err.message}`)
      }
    }

    return res.status(200).json(result)
  } catch (err) {
    console.error('mint-offers error:', err)
    return res.status(500).json({ error: err.message ?? 'Internal error', ...result })
  }
}
