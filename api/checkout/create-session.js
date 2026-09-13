import { stripe } from '../_lib/stripe.js'
import { supabaseAdmin } from '../_lib/supabase-admin.js'
import { logActivity } from '../_lib/log-activity.js'
import { isOfferValid } from '../_lib/offer.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { slug, email, firstName, lastName, offerToken } = req.body ?? {}
    if (!slug) return res.status(400).json({ error: 'slug is required' })

    // Resolve logged-in user (optional)
    let user = null
    const auth = req.headers.authorization
    if (auth?.startsWith('Bearer ')) {
      const { data, error } = await supabaseAdmin.auth.getUser(auth.slice(7))
      if (!error) user = data.user
    }

    // Anonymous path requires an email on the form
    const resolvedEmail = user?.email ?? email
    if (!resolvedEmail) {
      return res.status(400).json({ error: 'email is required for anonymous purchase' })
    }

    // Look up workshop
    const { data: workshop, error: webErr } = await supabaseAdmin
      .from('webinars')
      .select('id, title, slug, status, stripe_price_id, kit_tag')
      .eq('slug', slug)
      .maybeSingle()
    if (webErr) throw webErr
    if (!workshop) return res.status(404).json({ error: 'Workshop not found' })
    // Courses sit at 'live' permanently and pass this deliberately: an
  // on-demand product has no event to be upcoming for, and no reason to ever
  // stop selling. Do not "fix" this by excluding 'live'.
  if (!['upcoming', 'live'].includes(workshop.status)) {
      return res.status(400).json({ error: 'Registration not open for this workshop' })
    }
    if (!workshop.stripe_price_id) {
      return res.status(400).json({ error: 'Workshop is not configured for purchase yet' })
    }

    // Logged-in duplicate-purchase check
    if (user) {
      const { data: existing } = await supabaseAdmin
        .from('user_entitlements')
        .select('id')
        .eq('user_id', user.id)
        .eq('webinar_id', workshop.id)
        .maybeSingle()
      if (existing) {
        return res.status(409).json({
          alreadyEnrolled: true,
          portalUrl: `/portal/${slug}`,
        })
      }
    }

    // ---- The $39 offer window ---------------------------------------
    //
    // THIS IS THE ENTIRE ENFORCEMENT LAYER. There is no Stripe coupon and no
    // promotion code behind it (Adaptive Pricing rules both out -- see the
    // build plan), so the offer path simply points at a different Price. That
    // means Stripe validates nothing here. The countdown on the page is
    // decoration and the client clock is a suggestion; this block is what
    // actually decides whether someone pays $39 or $69.
    let offer = null
    if (offerToken) {
      const { data: row, error: offerErr } = await supabaseAdmin
        .from('subscriber_offers')
        .select('id, token, email, webinar_id, expires_at, redeemed_at')
        .eq('token', offerToken)
        .maybeSingle()
      if (offerErr) throw offerErr

      // Every condition lives in isOfferValid, which is pure and tested by
      // scripts/test-offer-checkout.mjs.
      const valid = isOfferValid(row, workshop.id)

      // 410, never 409. useCheckout treats every 409 from this route as "you
      // already own this" and sends the buyer to the portal, where someone
      // whose window closed has no entitlement. 410 Gone is the honest code and
      // it does not collide.
      //
      // And never a silent fallthrough to full price: someone whose window shut
      // while the tab sat open would see $39 on the page and $69 on the Stripe
      // receipt, which is the exact bait-and-switch the expired pricing block
      // exists to prevent. Make them click $69 deliberately.
      if (!valid) {
        return res.status(410).json({ offerExpired: true })
      }

      // There is deliberately NO check that row.email matches the buyer.
      // Forwarded links are allowed to work; the webhook records who actually
      // paid in redeemed_email. Requiring a match would reject the teacher
      // whose Kit address is their gmail and whose card sits on their studio
      // address. See the build plan, "Decided, 2026-09-13".

      if (!process.env.TRIPWIRE_OFFER_PRICE_ID) {
        // Fail loudly rather than falling through to $69. A silent downgrade
        // here charges an honest buyer full price for a link that promised $39.
        console.error('offer token accepted but TRIPWIRE_OFFER_PRICE_ID is unset')
        return res.status(500).json({ error: 'Offer pricing is not configured' })
      }

      offer = row
    }

    const origin = `${req.headers['x-forwarded-proto'] ?? 'https'}://${req.headers.host}`

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price: offer ? process.env.TRIPWIRE_OFFER_PRICE_ID : workshop.stripe_price_id,
          quantity: 1,
        },
      ],
      customer_email: resolvedEmail,
      // No stacking on the offer path: $39 is already the discount, and an
      // unrelated active promotion code must not compound it.
      allow_promotion_codes: !offer,
      success_url: `${origin}/workshops/${slug}/success?session_id={CHECKOUT_SESSION_ID}`,
      // Built from the validated row, never from anything the client posted, or
      // this parameter becomes an open redirect.
      cancel_url: offer
        ? `${origin}/offer/reformer?t=${encodeURIComponent(offer.token)}`
        : `${origin}/workshops/${slug}`,
      metadata: {
        webinar_id: workshop.id,
        webinar_slug: slug,
        user_id: user?.id ?? '',
        email: resolvedEmail,
        first_name: firstName ?? user?.user_metadata?.first_name ?? '',
        last_name: lastName ?? user?.user_metadata?.last_name ?? '',
        // Closes the loop: provisionPurchase stamps redeemed_at on this row.
        offer_id: offer?.id ?? '',
      },
    })

    // The IP that initiated the purchase. Stripe will not reliably give you
    // this, and comparing it against later login IPs is the strongest single
    // artifact against a "cardholder did not authorize" claim.
    await logActivity(req, {
      userId: user?.id ?? null,
      email: resolvedEmail,
      eventType: 'checkout_start',
      source: 'server',
      webinarId: workshop.id,
      webinarSlug: workshop.slug,
      metadata: { label: session.id, ...(offer ? { offer_id: offer.id } : {}) },
    })

    return res.status(200).json({ url: session.url })
  } catch (err) {
    console.error('create-session error:', err)
    return res.status(500).json({ error: err.message ?? 'Internal error' })
  }
}
