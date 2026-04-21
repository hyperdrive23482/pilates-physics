import crypto from 'node:crypto'
import { stripe } from '../_lib/stripe.js'
import { supabaseAdmin } from '../_lib/supabase-admin.js'
import { tagSubscriber } from '../_lib/kit.js'
import { sendAuthEmail } from '../_lib/resend.js'

// Vercel pure Node functions don't have the Next.js bodyParser flag —
// we build the raw body from the stream ourselves for signature verification.
async function readRawBody(req) {
  const chunks = []
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  }
  return Buffer.concat(chunks)
}

async function findUserByEmail(email) {
  // listUsers doesn't accept a direct email filter; page through until found.
  // For this project's scale, a single page (default 50) is fine; expand if needed.
  let page = 1
  const perPage = 200
  while (true) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage })
    if (error) throw error
    const hit = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())
    if (hit) return hit
    if (data.users.length < perPage) return null
    page += 1
    if (page > 20) return null
  }
}

async function logEvent(row) {
  const { error } = await supabaseAdmin.from('stripe_events').insert(row)
  if (error) console.error('stripe_events insert error:', error)
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).end()
  }

  const sig = req.headers['stripe-signature']
  let event
  try {
    const rawBody = await readRawBody(req)
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('Stripe signature verification failed:', err.message)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  // Idempotency: exit early if we've already processed this event
  const { data: existingEvent } = await supabaseAdmin
    .from('stripe_events')
    .select('id')
    .eq('event_id', event.id)
    .maybeSingle()
  if (existingEvent) return res.status(200).json({ received: true, duplicate: true })

  if (event.type !== 'checkout.session.completed') {
    return res.status(200).json({ received: true, ignored: event.type })
  }

  const session = event.data.object
  const meta = session.metadata ?? {}
  const webinarId = meta.webinar_id
  const firstName = meta.first_name ?? ''
  const lastName = meta.last_name ?? ''

  // Always trust the Stripe-side email over metadata — user may have edited it at Checkout
  const email = session.customer_details?.email ?? meta.email
  if (!email || !webinarId) {
    await logEvent({
      event_id: event.id,
      session_id: session.id,
      event_type: event.type,
      webinar_id: webinarId || null,
      status: 'failed',
      error: 'Missing email or webinar_id on session',
      payload: session,
    })
    return res.status(200).json({ received: true, error: 'missing_fields' })
  }

  try {
    // Look up webinar for kit_tag
    const { data: webinar, error: webErr } = await supabaseAdmin
      .from('webinars')
      .select('id, kit_tag, bonus_webinar_id, bonus_starts_at, bonus_ends_at')
      .eq('id', webinarId)
      .single()
    if (webErr) throw webErr

    // ---- Three-branch user resolution ----
    let userId
    let userState
    let tokenHash = null
    const origin = `${req.headers['x-forwarded-proto'] ?? 'https'}://${req.headers.host}`

    if (meta.user_id) {
      // Branch (a): logged-in purchase — session exists in their browser, no magic link
      userId = meta.user_id
      userState = 'logged_in'
    } else {
      const existing = await findUserByEmail(email)
      if (existing) {
        // Branch (b): returning user, anonymous purchase — send magic link so they can log in
        userId = existing.id
        userState = 'returning'
        // Do NOT update user_metadata — existing account values win over form values
        const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
          type: 'magiclink',
          email,
          options: { redirectTo: `${origin}/auth/callback` },
        })
        if (linkErr) throw linkErr
        tokenHash = linkData.properties.hashed_token
      } else {
        // Branch (c): new user — create account + send magic link; AuthCallback routes to /set-password
        const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
          email,
          password: crypto.randomUUID(),
          email_confirm: true,
          user_metadata: {
            first_name: firstName,
            last_name: lastName,
            needs_password: true,
          },
        })
        if (createErr) throw createErr
        userId = created.user.id
        userState = 'new'
        const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
          type: 'magiclink',
          email,
          options: { redirectTo: `${origin}/auth/callback` },
        })
        if (linkErr) throw linkErr
        tokenHash = linkData.properties.hashed_token
      }
    }

    // ---- Grant entitlement (idempotent via unique user_id+webinar_id) ----
    const { error: entErr } = await supabaseAdmin
      .from('user_entitlements')
      .upsert(
        { user_id: userId, webinar_id: webinarId, source: 'stripe' },
        { onConflict: 'user_id,webinar_id', ignoreDuplicates: true }
      )
    if (entErr) throw entErr

    // ---- Early-registration bonus (non-fatal; backfill API is the safety net) ----
    if (
      webinar.bonus_webinar_id &&
      webinar.bonus_webinar_id !== webinarId &&
      webinar.bonus_starts_at &&
      webinar.bonus_ends_at
    ) {
      const purchasedAt = new Date(event.created * 1000)
      if (
        purchasedAt >= new Date(webinar.bonus_starts_at) &&
        purchasedAt <= new Date(webinar.bonus_ends_at)
      ) {
        const { error: bonusErr } = await supabaseAdmin
          .from('user_entitlements')
          .upsert(
            { user_id: userId, webinar_id: webinar.bonus_webinar_id, source: 'bonus' },
            { onConflict: 'user_id,webinar_id', ignoreDuplicates: true }
          )
        if (bonusErr) console.error('bonus grant failed:', bonusErr)
      }
    }

    // ---- Magic-link email (non-fatal — entitlement already granted) ----
    // generateLink only mints the token; sending is on us. Skip for branch (a).
    let emailStatus = 'skipped'
    let emailError = null
    if (tokenHash) {
      try {
        await sendAuthEmail({ to: email, kind: 'magiclink', siteURL: origin, tokenHash })
        emailStatus = 'sent'
      } catch (err) {
        emailStatus = 'failed'
        emailError = err.message
        console.error('Resend magic-link send failed:', err)
      }
    }

    // ---- Kit.com tag (non-fatal) ----
    let kitError = null
    if (webinar.kit_tag) {
      try {
        await tagSubscriber(email, firstName, lastName, webinar.kit_tag)
      } catch (err) {
        kitError = err.message
        console.error('Kit tagging failed:', err)
      }
    }

    await logEvent({
      event_id: event.id,
      session_id: session.id,
      event_type: event.type,
      webinar_id: webinarId,
      user_id: userId,
      user_state: userState,
      status: kitError ? 'kit_failed' : 'processed',
      error: kitError,
      email_status: emailStatus,
      email_error: emailError,
      payload: session,
    })

    return res.status(200).json({ received: true })
  } catch (err) {
    console.error('webhook handler error:', err)
    await logEvent({
      event_id: event.id,
      session_id: session.id,
      event_type: event.type,
      webinar_id: webinarId,
      status: 'failed',
      error: err.message,
      payload: session,
    })
    // Return 500 so Stripe retries — the idempotency check above protects us from duplicate work.
    return res.status(500).json({ error: err.message })
  }
}
