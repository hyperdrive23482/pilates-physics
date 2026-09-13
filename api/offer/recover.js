import { supabaseAdmin } from '../_lib/supabase-admin.js'
import { formatDeadline } from '../_lib/offer.js'
import { sendOfferLinkEmail } from '../_lib/resend.js'

// POST /api/offer/recover  { email }
//
// Someone landed on the offer page without a working token -- a corporate
// scanner stripped the query string, or they bookmarked the bare URL -- and
// they are trying to get back to their $39 window.
//
// IT MAILS THE LINK. IT NEVER RENDERS THE OFFER. The obvious build (type an
// email, see $39) turns this route into a page that hands the discount to any
// address entered into it, which is exactly the coupon code that not using a
// Stripe coupon was supposed to eliminate: one post in a studio Facebook group
// and the token stops meaning anything. Mailing it means typing a colleague's
// address mails the colleague.
//
// THE RESPONSE NEVER VARIES. Found, not found, expired, throttled, already
// redeemed -- all return the same 200. The route confirms nothing about who is
// on the list, so there is nothing to learn by enumerating addresses.
//
// See docs/how-a-reformer-works-build-plan.md, Phase 2d.

const COURSE_SLUG = 'how-a-reformer-works'

// One send per row per 15 minutes. This is the whole rate limit and it is
// enough: no email goes anywhere unless a matching offer row already exists, so
// the blast radius is bounded to addresses already on the list, and this caps
// each of those.
const THROTTLE_MS = 15 * 60 * 1000

// Said in every case, so the answer carries no information.
const SAME_ANSWER = {
  ok: true,
  message: 'If you have an open window, the link is on its way to that inbox.',
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  res.setHeader('X-Robots-Tag', 'noindex, nofollow')

  const raw = req.body?.email
  const email = typeof raw === 'string' ? raw.trim().toLowerCase() : ''
  // A malformed address is the one case that can answer differently, because it
  // is a typo in the form rather than a fact about the list.
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'A valid email address is required' })
  }

  try {
    const { data: course } = await supabaseAdmin
      .from('webinars')
      .select('id')
      .eq('slug', COURSE_SLUG)
      .maybeSingle()
    if (!course) return res.status(200).json(SAME_ANSWER)

    // Newest first: a re-run campaign mints a second row under a new offer_key,
    // and the current one is the one worth recovering.
    const { data: rows, error: rowErr } = await supabaseAdmin
      .from('subscriber_offers')
      .select('id, token, expires_at, redeemed_at, recovery_sent_at')
      .eq('webinar_id', course.id)
      .eq('email', email)
      .order('created_at', { ascending: false })
      .limit(1)
    if (rowErr) throw rowErr

    const row = rows?.[0]

    // Nothing to recover. They already own it, or were never minted an offer.
    // The portal link belongs in the purchase email, not here.
    if (!row || row.redeemed_at) return res.status(200).json(SAME_ANSWER)

    if (row.recovery_sent_at && Date.now() - new Date(row.recovery_sent_at).getTime() < THROTTLE_MS) {
      return res.status(200).json(SAME_ANSWER)
    }

    const expiresAt = new Date(row.expires_at)
    const expired = expiresAt <= new Date()
    const origin = `${req.headers['x-forwarded-proto'] ?? 'https'}://${req.headers.host}`

    // An expired row gets an email too, and that is the point. Sending nothing
    // leaves someone who was just told "check your inbox" staring at an inbox
    // that never fills -- the dead end this route exists to remove. They get
    // what the expired pricing block says: the window closed, the course is
    // $69, nothing about it changed.
    await sendOfferLinkEmail({
      to: email,
      url: expired
        ? `${origin}/how-a-reformer-works`
        : `${origin}/offer/reformer?t=${encodeURIComponent(row.token)}`,
      deadlineLabel: formatDeadline(expiresAt),
      expired,
    })

    const { error: stampErr } = await supabaseAdmin
      .from('subscriber_offers')
      .update({ recovery_sent_at: new Date().toISOString() })
      .eq('id', row.id)
    if (stampErr) console.error('recovery_sent_at stamp failed:', stampErr)

    return res.status(200).json(SAME_ANSWER)
  } catch (err) {
    // Even a failure answers the same way. An error here is ours, and the
    // shape of the response must not become a way to probe the list.
    console.error('offer recover error:', err)
    return res.status(200).json(SAME_ANSWER)
  }
}
