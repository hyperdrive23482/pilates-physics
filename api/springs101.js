import crypto from 'node:crypto'
import { supabaseAdmin } from './_lib/supabase-admin.js'
import { requireUser } from './_lib/require-user.js'
import { findUserByEmail } from './_lib/provision-purchase.js'
import { sendAuthEmail } from './_lib/resend.js'
import { tagSubscriber } from './_lib/kit.js'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const TOOL_SLUGS = ['spring-load-calculator']

// Spring Load Calculator lead magnet: create (or find) a free account, grant
// the calculator entitlement, email a sign-in link, and tag the subscriber in
// Kit. Mirrors provisionPurchase minus Stripe.
//
// Two historical names are kept on purpose. This file is still springs101.js
// because the landing page bundle in a stale browser tab would POST to a 404
// otherwise, and vercel.json pins email templates to this path. The Kit tag on
// the calculator row is still "springs-101" because the six-email nurture
// sequence in Kit is triggered by it. The Springs 101 primer itself is no
// longer granted here: it stays entitled for everyone who already claimed it,
// and is preserved for use elsewhere.
//
// Idempotent: resubmitting the same email re-sends a fresh magic link and
// the entitlement upserts no-op, so "I lost the email, submit again" works.
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { firstName, lastName, email, website } = req.body ?? {}

    // Honeypot: bots that fill the hidden field get a silent success.
    if (typeof website === 'string' && website.trim() !== '') {
      return res.status(200).json({ ok: true, userState: 'new', emailSent: true })
    }

    // ---- Resolve identity: logged-in claim vs anonymous signup ----
    let userId = null
    let userState
    let normalizedEmail
    let trimmedFirst = ''
    let trimmedLast = ''

    if (req.headers.authorization) {
      const auth = await requireUser(req, res)
      if (!auth) return // requireUser already sent the 401
      userId = auth.user.id
      userState = 'logged_in'
      normalizedEmail = auth.user.email?.toLowerCase()
      trimmedFirst = auth.user.user_metadata?.first_name ?? ''
    } else {
      trimmedFirst = typeof firstName === 'string' ? firstName.trim() : ''
      trimmedLast = typeof lastName === 'string' ? lastName.trim() : ''
      const trimmedEmail = typeof email === 'string' ? email.trim() : ''

      // Last name is optional here: this lead magnet collects first name + email
      // only (matching the newsletter). A blank last_name is backfilled later if
      // the user buys a workshop (see api/_lib/provision-purchase.js).
      if (!trimmedFirst) return res.status(400).json({ error: 'First name is required' })
      if (!trimmedEmail) return res.status(400).json({ error: 'Email is required' })
      if (trimmedFirst.length > 200) return res.status(400).json({ error: 'First name is too long' })
      if (trimmedLast.length > 200) return res.status(400).json({ error: 'Last name is too long' })
      if (trimmedEmail.length > 320) return res.status(400).json({ error: 'Email is too long' })
      if (!EMAIL_RE.test(trimmedEmail)) {
        return res.status(400).json({ error: 'Please enter a valid email address' })
      }
      normalizedEmail = trimmedEmail.toLowerCase()
    }

    // ---- Fetch the tool row; fail loudly if the seed migration is missing ----
    const { data: tools, error: toolsErr } = await supabaseAdmin
      .from('webinars')
      .select('id, slug, kit_tag')
      .in('slug', TOOL_SLUGS)
    if (toolsErr) throw toolsErr
    if (!tools || tools.length !== TOOL_SLUGS.length) {
      const found = (tools ?? []).map((t) => t.slug)
      throw new Error(`Missing tool rows: ${TOOL_SLUGS.filter((s) => !found.includes(s)).join(', ')}`)
    }

    // ---- Resolve or create the auth user (anonymous path) ----
    if (!userId) {
      const existing = await findUserByEmail(normalizedEmail)
      if (existing) {
        // Returning user. Do NOT overwrite user_metadata: existing account
        // values win over whatever was typed in the form.
        userId = existing.id
        userState = 'returning'
      } else {
        const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
          email: normalizedEmail,
          password: crypto.randomUUID(),
          email_confirm: true,
          user_metadata: {
            first_name: trimmedFirst,
            last_name: trimmedLast,
            needs_password: true,
          },
        })
        if (createErr) throw createErr
        userId = created.user.id
        userState = 'new'
      }
    }

    // ---- Grant the entitlement (idempotent; never touches existing rows) ----
    const { error: entErr } = await supabaseAdmin
      .from('user_entitlements')
      .upsert(
        tools.map((t) => ({ user_id: userId, webinar_id: t.id, source: 'lead_magnet' })),
        { onConflict: 'user_id,webinar_id', ignoreDuplicates: true }
      )
    if (entErr) throw entErr

    // ---- Magic link (skipped for logged-in claims; non-fatal to the grant) ----
    let emailSent = false
    if (userState !== 'logged_in') {
      const origin = `${req.headers['x-forwarded-proto'] ?? 'https'}://${req.headers.host}`
      try {
        const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
          type: 'magiclink',
          email: normalizedEmail,
          options: { redirectTo: `${origin}/auth/callback` },
        })
        if (linkErr) throw linkErr
        await sendAuthEmail({
          to: normalizedEmail,
          kind: 'magiclink',
          siteURL: origin,
          tokenHash: linkData.properties.hashed_token,
        })
        emailSent = true
      } catch (err) {
        console.error('springs101 magic-link send failed:', err)
      }
    }

    // ---- Kit tag (non-fatal) ----
    const calculatorRow = tools.find((t) => t.slug === 'spring-load-calculator')
    if (calculatorRow?.kit_tag) {
      try {
        await tagSubscriber(normalizedEmail, trimmedFirst, calculatorRow.kit_tag)
      } catch (err) {
        console.error('springs101 Kit tagging failed:', err)
      }
    }

    return res.status(200).json({ ok: true, userState, emailSent })
  } catch (err) {
    console.error('springs101 handler error:', err)
    return res.status(500).json({ error: err.message ?? 'Internal error' })
  }
}
