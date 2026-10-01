import { supabaseAdmin } from '../../_lib/supabase-admin.js'
import { requireAdmin } from '../../_lib/require-admin.js'
import {
  countSubscribersByTag,
  getEmailStats,
  getGrowthStats,
  listAllSubscribersByTag,
  listBroadcastStats,
  listSequenceEmails,
  listSequenceSubscribers,
  listSequences,
} from '../../_lib/kit.js'

// GET /api/admin/kit/metrics[?refresh=1]
//
// Everything the admin Kit tab shows, in one response: list health, broadcast
// stats, per-email sequence stats, and the nurture -> $39 offer funnel.
//
// Kit never says whether someone FINISHED a sequence. Its sequence subscriber
// list holds everyone who ever entered, and the sequence's subscriber_count is
// how many are still inside it, so "finished" is derived from those two plus
// the purchase tag. The tags the automations apply are reported alongside as a
// cross-check, because when the two disagree an automation step is broken.
//
// Kit allows 120 requests per rolling minute and this costs about 20, so the
// result is cached in memory for ten minutes. A warm function instance serves
// repeat loads for free; ?refresh=1 skips the cache.

// The sequences that get a per-email breakdown and a funnel, matched by the
// name shown in Kit. Every other sequence still appears in the summary table.
const FUNNEL_SEQUENCES = [
  { name: 'Spring Calc Welcome', label: 'Nurture', purchaseTag: 'HARW-purchased' },
  { name: 'How a Reformer Works', label: 'How a Reformer Works', purchaseTag: 'HARW-purchased', offer: true },
]

const CART_TAG = 'in-HARW-sequence'
const DIDNOTBUY_TAG = 'HARW-didnotbuy'
const PURCHASED_TAG = 'HARW-purchased'

// Tag counts shown in the funnel, in funnel order.
const FUNNEL_TAGS = [
  { tag: 'spring-calc', label: 'Claimed the calculator' },
  { tag: 'completed-nurture', label: 'Finished nurture' },
  { tag: CART_TAG, label: 'Carrying the cart tag' },
  { tag: DIDNOTBUY_TAG, label: 'Finished cart, did not buy' },
  { tag: PURCHASED_TAG, label: 'Bought the course' },
  { tag: 'HARW-requeue', label: 'Parked for the backfill' },
]

const CACHE_TTL_MS = 10 * 60 * 1000
let cache = null

const lower = (s) => (s ?? '').toLowerCase()
const isoDate = (d) => d.toISOString().slice(0, 10)

// Runs one section and turns a failure into an error string instead of a 500,
// so a single Kit endpoint misbehaving costs one panel, not the page.
async function section(name, errors, fn) {
  try {
    return await fn()
  } catch (err) {
    console.error(`admin/kit/metrics ${name}:`, err)
    errors[name] = err.message ?? String(err)
    return null
  }
}

async function loadList() {
  const now = new Date()
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const [growth, email] = await Promise.all([
    getGrowthStats({ starting: isoDate(monthAgo), ending: isoDate(now) }),
    getEmailStats(),
  ])
  return {
    subscribers: growth?.subscribers ?? null,
    new_30d: growth?.new_subscribers ?? null,
    // Kit reports cancellations as a negative number.
    cancellations_30d: growth ? Math.abs(growth.cancellations ?? 0) : null,
    net_new_30d: growth?.net_new_subscribers ?? null,
    email_90d: email
      ? {
          sent: email.sent,
          open_rate: email.open_rate,
          click_rate: email.click_rate,
          unsubscribe_rate: email.unsubscribe_rate,
          bounce_rate: email.bounce_rate,
        }
      : null,
  }
}

async function loadBroadcasts() {
  const rows = await listBroadcastStats({ perPage: 50 })
  return rows
    .filter((b) => (b.stats?.recipients ?? 0) > 0)
    .map((b) => ({
      id: b.id,
      subject: b.subject,
      send_at: b.send_at,
      status: b.stats.status,
      recipients: b.stats.recipients,
      open_rate: b.stats.open_rate,
      click_rate: b.stats.click_rate,
      clicks: b.stats.total_clicks,
      unsubscribes: b.stats.unsubscribes,
    }))
}

// Map of lowercased email -> subscriber for a tag, or null if the tag is missing.
async function tagMap(tagName, opts) {
  try {
    const subs = await listAllSubscribersByTag(tagName, opts)
    return new Map(subs.map((s) => [lower(s.email_address), s]))
  } catch (err) {
    if (/tag not found/i.test(err.message)) return null
    throw err
  }
}

async function loadSequences(purchased) {
  const all = await listSequences({ includeStats: true })

  const summary = all.map((s) => ({
    id: s.id,
    name: s.name,
    active: s.active,
    email_count: s.email_count,
    in_progress: s.subscriber_count,
    recipients: s.stats?.recipients ?? null,
    open_rate: s.stats?.open_rate ?? null,
    click_rate: s.stats?.click_rate ?? null,
    unsubscribe_rate: s.stats?.unsubscribe_rate ?? null,
  }))

  const funnels = await Promise.all(
    FUNNEL_SEQUENCES.map(async (cfg) => {
      const seq = all.find((s) => s.name === cfg.name)
      if (!seq) return { ...cfg, missing: true }

      const [emails, subs] = await Promise.all([
        listSequenceEmails(seq.id),
        listSequenceSubscribers(seq.id, { status: 'all' }),
      ])

      // A purchase counts toward this sequence only if it came after they
      // entered it. Earlier buyers were never sold to by these emails.
      const bought = subs.filter((s) => {
        const p = purchased?.get(lower(s.email_address))
        return p && (!p.tagged_at || !s.added_at || p.tagged_at >= s.added_at)
      }).length
      const unsubscribed = subs.filter((s) => s.state && s.state !== 'active').length
      const inProgress = seq.subscriber_count ?? 0
      const finished = Math.max(0, subs.length - inProgress - unsubscribed - bought)
      const addedDates = subs.map((s) => s.added_at).filter(Boolean).sort()

      return {
        label: cfg.label,
        name: seq.name,
        offer: Boolean(cfg.offer),
        entered: subs.length,
        in_progress: inProgress,
        finished_without_buying: finished,
        unsubscribed,
        bought,
        with_offer_token: cfg.offer ? subs.filter((s) => s.fields?.offer_token).length : null,
        first_added_at: addedDates[0] ?? null,
        last_added_at: addedDates.at(-1) ?? null,
        stats: seq.stats ?? null,
        emails: emails
          .slice()
          .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
          .map((e) => ({
            id: e.id,
            position: e.position,
            subject: e.subject,
            published: e.published,
            delay: e.delay_value != null ? `${e.delay_value} ${e.delay_unit ?? ''}`.trim() : null,
            recipients: e.stats?.recipients ?? 0,
            opens: e.stats?.opens ?? 0,
            clicks: e.stats?.clicks ?? 0,
            open_rate: e.stats?.open_rate ?? null,
            click_rate: e.stats?.click_rate ?? null,
            unsubscribe_rate: e.stats?.unsubscribe_rate ?? null,
          })),
      }
    }),
  )

  return { summary, funnels }
}

async function loadTagCounts() {
  return Promise.all(
    FUNNEL_TAGS.map(async ({ tag, label }) => {
      try {
        return { tag, label, count: await countSubscribersByTag(tag) }
      } catch (err) {
        if (/tag not found/i.test(err.message)) return { tag, label, count: null, missing: true }
        throw err
      }
    }),
  )
}

// The checks that would have caught the dead ?t= links in September 2026.
function cartHealth(cart, didNotBuy, purchased) {
  if (!cart) return null
  const current = [...cart.entries()].filter(
    ([email]) => !didNotBuy?.has(email) && !purchased?.has(email),
  )
  return {
    mint_enabled: process.env.MINT_OFFERS_ENABLED === 'true',
    in_cart_now: current.length,
    in_cart_without_token: current.filter(([, s]) => !s.fields?.offer_token).length,
    // The "HARW Email Sequence" automation should remove the cart tag after
    // applying HARW-didnotbuy. Anyone holding both was never cleaned up, and
    // will be minted a window they never hear about once minting is enabled.
    stale_cart_tag: didNotBuy ? [...cart.keys()].filter((e) => didNotBuy.has(e)).length : null,
  }
}

async function loadOffers() {
  const { data, error } = await supabaseAdmin
    .from('subscriber_offers')
    .select('offer_key, email, expires_at, first_seen_at, redeemed_at, redeemed_email, kit_synced_at')
  if (error) throw error

  const now = Date.now()
  const byKey = new Map()
  for (const row of data ?? []) {
    const k = byKey.get(row.offer_key) ?? {
      offer_key: row.offer_key,
      minted: 0,
      kit_synced: 0,
      seen: 0,
      redeemed: 0,
      live: 0,
      expired_unused: 0,
      forwarded: 0,
    }
    k.minted += 1
    if (row.kit_synced_at) k.kit_synced += 1
    if (row.first_seen_at) k.seen += 1
    if (row.redeemed_at) {
      k.redeemed += 1
      if (row.redeemed_email && lower(row.redeemed_email) !== lower(row.email)) k.forwarded += 1
    } else if (new Date(row.expires_at).getTime() < now) {
      k.expired_unused += 1
    } else {
      k.live += 1
    }
    byKey.set(row.offer_key, k)
  }
  return [...byKey.values()].sort((a, b) => b.minted - a.minted)
}

export async function buildMetrics() {
  const errors = {}

  const tags = await section('funnel', errors, async () => {
    const [cart, didNotBuy, purchased] = await Promise.all([
      tagMap(CART_TAG),
      tagMap(DIDNOTBUY_TAG),
      // 'all' so a buyer who later unsubscribed still counts as a sale.
      tagMap(PURCHASED_TAG, { status: 'all' }),
    ])
    return { cart, didNotBuy, purchased }
  })

  const [list, broadcasts, sequences, tagCounts, offers] = await Promise.all([
    section('list', errors, loadList),
    section('broadcasts', errors, loadBroadcasts),
    section('sequences', errors, () => loadSequences(tags?.purchased ?? null)),
    section('tag_counts', errors, loadTagCounts),
    section('offers', errors, loadOffers),
  ])

  return {
    fetched_at: new Date().toISOString(),
    list,
    broadcasts,
    sequences,
    tag_counts: tagCounts,
    cart_health: tags ? cartHealth(tags.cart, tags.didNotBuy, tags.purchased) : null,
    offers,
    errors,
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const admin = await requireAdmin(req, res)
  if (!admin) return

  if (!process.env.KIT_API_KEY) {
    return res.status(500).json({ error: 'KIT_API_KEY is not set in this environment' })
  }

  try {
    const fresh = cache && Date.now() - cache.at < CACHE_TTL_MS
    if (fresh && req.query?.refresh !== '1') return res.status(200).json(cache.data)

    const data = await buildMetrics()
    // A partial result is shown but not cached, so a Kit hiccup does not stick
    // around for ten minutes.
    cache = Object.keys(data.errors).length ? null : { at: Date.now(), data }
    return res.status(200).json(data)
  } catch (err) {
    console.error('admin/kit/metrics error:', err)
    return res.status(500).json({ error: err.message ?? 'Failed to load Kit metrics' })
  }
}
