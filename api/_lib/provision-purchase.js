import crypto from 'node:crypto'
import { supabaseAdmin } from './supabase-admin.js'
import { tagSubscriber } from './kit.js'
import { sendAuthEmail } from './resend.js'

// listUsers has no email filter, so page through the user list until we find a
// match. 20 pages of 200 covers 4,000 users, ample at the current scale.
// Exported for reuse by the Springs 101 lead-magnet endpoint.
export async function findUserByEmail(email) {
  const perPage = 200
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage })
    if (error) throw error
    const hit = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())
    if (hit) return hit
    if (data.users.length < perPage) break
  }
  return null
}

// Has the magic-link email already gone out for this checkout session? Gates
// re-sends when provisionPurchase runs more than once for one session (a Stripe
// retry, the success-page self-heal, or the reconciliation cron).
async function magicLinkAlreadySent(sessionId) {
  const { data } = await supabaseAdmin
    .from('stripe_events')
    .select('id')
    .eq('session_id', sessionId)
    .eq('email_status', 'sent')
    .limit(1)
  return !!data?.length
}

// Turn a completed Stripe Checkout session into a fully provisioned customer:
// resolve or create the auth user, grant the workshop entitlement (plus any
// early-registration bonus), send the login email, and tag them in Kit.
//
// Idempotent, so it is safe to call repeatedly for the same session. The
// webhook, the success page, and the reconciliation cron all funnel through
// this one function so every path provisions identically.
//
// Throws on hard failures (DB or auth errors) so the caller can log and let
// Stripe retry. Kit tagging and the login email are non-fatal; their outcome
// is reported in the returned result instead.
export async function provisionPurchase(session, { siteUrl, purchasedAt } = {}) {
  const meta = session.metadata ?? {}
  const workshopId = meta.webinar_id
  const firstName = meta.first_name ?? ''
  const lastName = meta.last_name ?? ''
  // Trust the Stripe-side email over metadata; the buyer may have edited it at Checkout.
  const email = session.customer_details?.email ?? meta.email
  if (!email || !workshopId) {
    throw new Error('Missing email or webinar_id on session')
  }

  const { data: workshop, error: webErr } = await supabaseAdmin
    .from('webinars')
    .select('id, title, kit_tag, bonus_webinar_id, bonus_starts_at, bonus_ends_at')
    .eq('id', workshopId)
    .single()
  if (webErr) throw webErr

  // ---- Resolve the user: logged-in / returning / new ----
  let userId
  let userState
  if (meta.user_id) {
    // Purchase made while authenticated, so their browser already holds a session.
    userId = meta.user_id
    userState = 'logged_in'
  } else {
    const existing = await findUserByEmail(email)
    if (existing) {
      // Returning user, anonymous purchase. Do NOT overwrite user_metadata:
      // existing account values win over whatever was typed at Checkout.
      userId = existing.id
      userState = 'returning'
    } else {
      // New user: create a confirmed account flagged to set its own password.
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
    }
  }

  // ---- Grant entitlement (idempotent via the unique user_id + webinar_id constraint) ----
  const { error: entErr } = await supabaseAdmin
    .from('user_entitlements')
    .upsert(
      { user_id: userId, webinar_id: workshopId, source: 'stripe' },
      { onConflict: 'user_id,webinar_id', ignoreDuplicates: true }
    )
  if (entErr) throw entErr

  // ---- Early-registration bonus (non-fatal; apply-bonus-backfill is the safety net) ----
  if (
    workshop.bonus_webinar_id &&
    workshop.bonus_webinar_id !== workshopId &&
    workshop.bonus_starts_at &&
    workshop.bonus_ends_at
  ) {
    const boughtAt = purchasedAt ?? new Date(session.created * 1000)
    if (
      boughtAt >= new Date(workshop.bonus_starts_at) &&
      boughtAt <= new Date(workshop.bonus_ends_at)
    ) {
      const { error: bonusErr } = await supabaseAdmin
        .from('user_entitlements')
        .upsert(
          { user_id: userId, webinar_id: workshop.bonus_webinar_id, source: 'bonus' },
          { onConflict: 'user_id,webinar_id', ignoreDuplicates: true }
        )
      if (bonusErr) console.error('bonus grant failed:', bonusErr)
    }
  }

  // ---- Login email (non-fatal, sent at most once per session) ----
  // Logged-in buyers already have a browser session, so no link is needed.
  let emailStatus = 'skipped'
  let emailError = null
  if (userState === 'returning' || userState === 'new') {
    if (await magicLinkAlreadySent(session.id)) {
      emailStatus = 'skipped'
    } else {
      const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email,
        options: { redirectTo: `${siteUrl}/auth/callback` },
      })
      if (linkErr) throw linkErr
      try {
        await sendAuthEmail({
          to: email,
          kind: 'magiclink',
          siteURL: siteUrl,
          tokenHash: linkData.properties.hashed_token,
        })
        emailStatus = 'sent'
      } catch (err) {
        emailStatus = 'failed'
        emailError = err.message
        console.error('Resend magic-link send failed:', err)
      }
    }
  }

  // ---- Kit tag (non-fatal) ----
  let kitError = null
  if (workshop.kit_tag) {
    try {
      await tagSubscriber(email, firstName, workshop.kit_tag)
    } catch (err) {
      kitError = err.message
      console.error('Kit tagging failed:', err)
    }
  }

  return {
    email,
    firstName,
    lastName,
    userId,
    userState,
    workshopId,
    workshopTitle: workshop.title,
    emailStatus,
    emailError,
    kitError,
  }
}
