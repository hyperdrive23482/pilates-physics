import { stripe } from '../_lib/stripe.js'
import { supabaseAdmin } from '../_lib/supabase-admin.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { slug, email, firstName, lastName } = req.body ?? {}
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

    // Look up webinar
    const { data: webinar, error: webErr } = await supabaseAdmin
      .from('webinars')
      .select('id, title, slug, status, stripe_price_id, kit_tag')
      .eq('slug', slug)
      .maybeSingle()
    if (webErr) throw webErr
    if (!webinar) return res.status(404).json({ error: 'Webinar not found' })
    if (!['upcoming', 'live'].includes(webinar.status)) {
      return res.status(400).json({ error: 'Registration not open for this webinar' })
    }
    if (!webinar.stripe_price_id) {
      return res.status(400).json({ error: 'Webinar is not configured for purchase yet' })
    }

    // Logged-in duplicate-purchase check
    if (user) {
      const { data: existing } = await supabaseAdmin
        .from('user_entitlements')
        .select('id')
        .eq('user_id', user.id)
        .eq('webinar_id', webinar.id)
        .maybeSingle()
      if (existing) {
        return res.status(409).json({
          alreadyEnrolled: true,
          portalUrl: `/portal/${slug}`,
        })
      }
    }

    const origin = `${req.headers['x-forwarded-proto'] ?? 'https'}://${req.headers.host}`

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: webinar.stripe_price_id, quantity: 1 }],
      customer_email: resolvedEmail,
      allow_promotion_codes: true,
      success_url: `${origin}/workshops/${slug}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/workshops/${slug}`,
      metadata: {
        webinar_id: webinar.id,
        webinar_slug: slug,
        user_id: user?.id ?? '',
        email: resolvedEmail,
        first_name: firstName ?? user?.user_metadata?.first_name ?? '',
        last_name: lastName ?? user?.user_metadata?.last_name ?? '',
      },
    })

    return res.status(200).json({ url: session.url })
  } catch (err) {
    console.error('create-session error:', err)
    return res.status(500).json({ error: err.message ?? 'Internal error' })
  }
}
