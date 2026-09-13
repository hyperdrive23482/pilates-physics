import { supabaseAdmin } from './_lib/supabase-admin.js'
import { isOfferValid, formatDeadline } from './_lib/offer.js'

// GET /api/offer?t=TOKEN
//
// One route, four states, and the SERVER decides which. The state never rides
// in the URL: if it did, someone would bookmark the active URL, open it on
// Saturday, and the redirect logic would have to exist anyway.
//
// | state    | when                    | the page shows                       |
// |----------|-------------------------|--------------------------------------|
// | active   | now < expires_at        | the sales body at $39, with a clock  |
// | expired  | now > expires_at        | the sales body at $69, window closed  |
// | redeemed | redeemed_at set         | a link to the portal, no sales body   |
// | unknown  | bad or missing token    | the recovery form                     |
//
// The countdown this feeds is decoration. Enforcement happens in
// api/checkout/create-session.js, against the same row, at purchase time.

const COURSE_SLUG = 'how-a-reformer-works'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Belt and braces with the X-Robots-Tag header in vercel.json. The public
  // page shows $69 and only $69; if a $39 page is ever indexed, $69 stops
  // reading as real to anyone who browses.
  res.setHeader('X-Robots-Tag', 'noindex, nofollow')

  const token = typeof req.query.t === 'string' ? req.query.t : null

  try {
    const { data: course, error: courseErr } = await supabaseAdmin
      .from('webinars')
      .select('id, slug, title, subtitle, price_cents, stripe_price_id')
      .eq('slug', COURSE_SLUG)
      .maybeSingle()
    if (courseErr) throw courseErr
    if (!course) return res.status(404).json({ error: 'Course not found' })

    // The sales body is identical in every state, so the page can render it
    // immediately and let only the pricing block depend on this response.
    const workshop = {
      id: course.id,
      slug: course.slug,
      title: course.title,
      subtitle: course.subtitle,
      price_cents: course.price_cents,
      stripe_price_id: course.stripe_price_id,
    }

    if (!token) {
      return res.status(200).json({ state: 'unknown', workshop })
    }

    const { data: row, error: rowErr } = await supabaseAdmin
      .from('subscriber_offers')
      .select('id, token, webinar_id, expires_at, redeemed_at, first_seen_at')
      .eq('token', token)
      .maybeSingle()
    if (rowErr) throw rowErr

    if (!row || row.webinar_id !== course.id) {
      return res.status(200).json({ state: 'unknown', workshop })
    }

    if (row.redeemed_at) {
      return res.status(200).json({
        state: 'redeemed',
        workshop,
        portalUrl: `/portal/${course.slug}`,
      })
    }

    if (!isOfferValid(row, course.id)) {
      return res.status(200).json({
        state: 'expired',
        workshop,
        // Named, so the expired copy can say which day closed rather than
        // leaving the visitor to wonder whether the link was simply broken.
        deadline: formatDeadline(new Date(row.expires_at)),
        expiresAt: row.expires_at,
      })
    }

    // Analytics only, and never used for enforcement. Fire and forget: a
    // failure here must not cost someone their offer page.
    if (!row.first_seen_at) {
      supabaseAdmin
        .from('subscriber_offers')
        .update({ first_seen_at: new Date().toISOString() })
        .eq('id', row.id)
        .is('first_seen_at', null)
        .then(({ error }) => {
          if (error) console.error('first_seen_at stamp failed:', error)
        })
    }

    return res.status(200).json({
      state: 'active',
      workshop,
      token: row.token,
      expiresAt: row.expires_at,
      deadline: formatDeadline(new Date(row.expires_at)),
    })
  } catch (err) {
    console.error('offer error:', err)
    return res.status(500).json({ error: err.message ?? 'Internal error' })
  }
}
