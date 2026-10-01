import { supabaseAdmin } from '../_lib/supabase-admin.js'
import { requireAdmin } from '../_lib/require-admin.js'
import { stripe } from '../_lib/stripe.js'
import { mintScholarshipCode } from '../_lib/scholarship.js'
import { SCHOLARSHIP_COURSES, CODE_LIFETIME_DAYS } from '../_lib/scholarship-config.js'
import { sendScholarshipApproval, buildScholarshipApprovalEmail } from '../_lib/resend.js'

// /admin/scholarships. GET returns every application with its codes, plus the
// metrics block. POST takes { action, id, ... }:
//   approve  mint a code per course (default: the courses they asked for),
//            skipping any course that already has a live code, and email them
//   resend   re-send the approval email with every live, unredeemed code
//   preview  the approval email as it would go out, with sample codes
//   (approve, resend and preview take an optional personalNote for the email)
//   decline  mark declined; no email, so Kaleen can write personally
//   reopen   back to pending
//   notes    save admin_notes

const NOTE_MAX = 2000

function cleanNote(note) {
  return typeof note === 'string' ? note.trim().slice(0, NOTE_MAX) : ''
}

// A restricted Stripe key missing a permission fails with a long message that
// hides the fix. Say which permissions minting needs instead.
function mintErrorMessage(err) {
  if (err?.type === 'StripePermissionError' || err?.statusCode === 403) {
    return 'The Stripe API key is missing permissions. In Stripe, edit the restricted key and set Prices to Read, Coupons to Write and Promotion codes to Write.'
  }
  return err.message
}

function isLive(code, now = Date.now()) {
  return !code.redeemed_at && new Date(code.expires_at).getTime() > now
}

async function loadApplication(id) {
  const { data, error } = await supabaseAdmin
    .from('scholarship_applications')
    .select('*, codes:scholarship_codes(*)')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data
}

async function buildMetrics(applications) {
  const now = Date.now()
  const codes = applications.flatMap((a) => a.codes ?? [])

  const { data: enrollments, error: enrollErr } = await supabaseAdmin
    .from('scholarship_enrollments')
    .select('user_id, webinar_id, source, amount_paid_cents, amount_discount_cents, created_at, workshop:webinars(title, slug)')
  if (enrollErr) throw enrollErr

  const byCourse = {}
  for (const e of enrollments ?? []) {
    const slug = e.workshop?.slug ?? ''
    const key =
      Object.keys(SCHOLARSHIP_COURSES).find((k) => {
        const c = SCHOLARSHIP_COURSES[k]
        return c.slug ? slug === c.slug : slug.startsWith(`${c.seriesPrefix}-`)
      }) ?? 'other'
    byCourse[key] = (byCourse[key] ?? 0) + 1
  }

  // Did a scholarship student go on to buy something else at full price?
  // Counted as a paid entitlement granted after their first scholarship
  // enrollment, for a course that is not itself a scholarship enrollment.
  const firstByUser = new Map()
  const scholarshipPairs = new Set()
  for (const e of enrollments ?? []) {
    scholarshipPairs.add(`${e.user_id}:${e.webinar_id}`)
    const t = new Date(e.created_at).getTime()
    if (!firstByUser.has(e.user_id) || t < firstByUser.get(e.user_id)) firstByUser.set(e.user_id, t)
  }
  let convertedStudents = 0
  if (firstByUser.size > 0) {
    const { data: paid, error: paidErr } = await supabaseAdmin
      .from('user_entitlements')
      .select('user_id, webinar_id, granted_at')
      .eq('source', 'stripe')
      .in('user_id', [...firstByUser.keys()])
    if (paidErr) throw paidErr
    const converted = new Set()
    for (const p of paid ?? []) {
      if (scholarshipPairs.has(`${p.user_id}:${p.webinar_id}`)) continue
      if (new Date(p.granted_at).getTime() > firstByUser.get(p.user_id)) converted.add(p.user_id)
    }
    convertedStudents = converted.size
  }

  return {
    applications: {
      total: applications.length,
      pending: applications.filter((a) => a.status === 'pending').length,
      approved: applications.filter((a) => a.status === 'approved').length,
      declined: applications.filter((a) => a.status === 'declined').length,
    },
    codes: {
      sent: codes.length,
      redeemed: codes.filter((c) => c.redeemed_at).length,
      live: codes.filter((c) => isLive(c, now)).length,
      expiredUnused: codes.filter((c) => !c.redeemed_at && new Date(c.expires_at).getTime() <= now).length,
    },
    students: firstByUser.size,
    enrollments: (enrollments ?? []).length,
    byCourse,
    revenueCents: (enrollments ?? []).reduce((sum, e) => sum + (e.amount_paid_cents ?? 0), 0),
    discountCents: (enrollments ?? []).reduce((sum, e) => sum + (e.amount_discount_cents ?? 0), 0),
    convertedStudents,
  }
}

function siteUrlOf(req) {
  return `${req.headers['x-forwarded-proto'] ?? 'https'}://${req.headers.host}`
}

function firstName(application) {
  return application.name.split(/\s+/)[0] || application.name
}

// Sends the email, then records the note that went out with it. A failed
// save is logged rather than thrown, since the email has already gone.
async function emailCodes(application, codes, req, personalNote) {
  await sendScholarshipApproval({
    to: application.email,
    name: firstName(application),
    codes,
    siteUrl: siteUrlOf(req),
    personalNote,
  })
  const { error } = await supabaseAdmin
    .from('scholarship_applications')
    .update({ approval_note: personalNote || null, approval_note_sent_at: new Date().toISOString() })
    .eq('id', application.id)
  if (error) console.error('scholarship approval note save failed:', error)
}

// Sample codes in the same shape as real ones, so the preview matches the
// sent email apart from the code itself.
function previewEmail(application, courses, req, personalNote) {
  const keys = (Array.isArray(courses) && courses.length ? courses : application.courses).filter(
    (c) => SCHOLARSHIP_COURSES[c]
  )
  const expiresAt = new Date(Date.now() + CODE_LIFETIME_DAYS * 24 * 60 * 60 * 1000).toISOString()
  const codes = keys.map((course) => ({
    course,
    code: `SCHOLAR-${SCHOLARSHIP_COURSES[course].codeTag}-XXXXXX`,
    expires_at: expiresAt,
  }))
  if (codes.length === 0) throw Object.assign(new Error('Pick at least one course'), { status: 400 })
  return buildScholarshipApprovalEmail({
    name: firstName(application),
    codes,
    siteUrl: siteUrlOf(req),
    personalNote,
  })
}

async function approve(application, courses, req, personalNote) {
  const requested = Array.isArray(courses) && courses.length ? courses : application.courses
  for (const c of requested) {
    if (!SCHOLARSHIP_COURSES[c]) throw Object.assign(new Error(`Unknown course: ${c}`), { status: 400 })
  }

  const existing = application.codes ?? []
  const minted = []
  const failures = []
  for (const course of requested) {
    if (existing.some((c) => c.course === course && isLive(c))) continue
    try {
      minted.push(await mintScholarshipCode(application, course))
    } catch (err) {
      console.error(`scholarship mint failed (${course}):`, err)
      failures.push(`${SCHOLARSHIP_COURSES[course].label}: ${mintErrorMessage(err)}`)
    }
  }

  if (minted.length === 0 && failures.length > 0) {
    throw new Error(failures.join('; '))
  }

  const { error: updErr } = await supabaseAdmin
    .from('scholarship_applications')
    .update({ status: 'approved', reviewed_at: new Date().toISOString() })
    .eq('id', application.id)
  if (updErr) throw updErr

  let emailError = null
  if (minted.length > 0) {
    try {
      await emailCodes(application, minted, req, personalNote)
    } catch (err) {
      console.error('scholarship approval email failed:', err)
      emailError = err.message
    }
  }

  return { minted: minted.length, failures, emailError }
}

export default async function handler(req, res) {
  const admin = await requireAdmin(req, res)
  if (!admin) return

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabaseAdmin
        .from('scholarship_applications')
        .select('*, codes:scholarship_codes(*)')
        .order('created_at', { ascending: false })
      if (error) throw error
      const applications = data ?? []
      const metrics = await buildMetrics(applications)
      return res.status(200).json({ applications, metrics })
    }

    if (req.method !== 'POST') {
      res.setHeader('Allow', 'GET, POST')
      return res.status(405).json({ error: 'Method not allowed' })
    }

    const { action, id, courses, notes } = req.body ?? {}
    const personalNote = cleanNote(req.body?.personalNote)
    if (!id) return res.status(400).json({ error: 'id is required' })
    const application = await loadApplication(id)
    if (!application) return res.status(404).json({ error: 'Application not found' })

    if (action === 'preview') {
      return res.status(200).json({ preview: previewEmail(application, courses, req, personalNote) })
    }

    let result = {}
    if (action === 'approve') {
      result = await approve(application, courses, req, personalNote)
    } else if (action === 'resend') {
      const live = (application.codes ?? []).filter((c) => isLive(c))
      if (live.length === 0) return res.status(400).json({ error: 'No live codes to send' })
      await emailCodes(application, live, req, personalNote)
    } else if (action === 'decline' || action === 'reopen') {
      const status = action === 'decline' ? 'declined' : 'pending'
      // Declining also switches off any live codes, so a decline after an
      // approval actually takes the discount back.
      if (action === 'decline') {
        for (const c of (application.codes ?? []).filter((x) => isLive(x))) {
          await stripe.promotionCodes.update(c.stripe_promotion_code_id, { active: false })
          await supabaseAdmin
            .from('scholarship_codes')
            .update({ expires_at: new Date().toISOString() })
            .eq('id', c.id)
        }
      }
      const { error } = await supabaseAdmin
        .from('scholarship_applications')
        .update({ status, reviewed_at: action === 'decline' ? new Date().toISOString() : null })
        .eq('id', id)
      if (error) throw error
    } else if (action === 'notes') {
      const { error } = await supabaseAdmin
        .from('scholarship_applications')
        .update({ admin_notes: typeof notes === 'string' ? notes.slice(0, 4000) : null })
        .eq('id', id)
      if (error) throw error
    } else {
      return res.status(400).json({ error: 'Unknown action' })
    }

    const updated = await loadApplication(id)
    return res.status(200).json({ application: updated, ...result })
  } catch (err) {
    console.error('admin scholarships error:', err)
    return res.status(err.status ?? 500).json({ error: err.message ?? 'Internal error' })
  }
}
