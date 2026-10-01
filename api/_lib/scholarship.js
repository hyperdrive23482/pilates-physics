import crypto from 'node:crypto'
import { stripe } from './stripe.js'
import { supabaseAdmin } from './supabase-admin.js'
import { COUPON_PREFIX, CODE_LIFETIME_DAYS, SCHOLARSHIP_COURSES } from './scholarship-config.js'

// Scholarship pricing and Stripe plumbing. Keep the course keys and stage
// options in step with src/lib/scholarship.js. See
// supabase/migrations/056_scholarships.sql for the whole flow.
//
// Why promotion codes work here when the $39 offer could not use one: Adaptive
// Pricing rules out amount_off coupons (currency-locked), but percent_off is
// currency-agnostic. The percentage is computed from the live Price, and
// Stripe's rounding lands both scholarship prices exactly: 85.27% of $129 is
// $110.00 off, and 86.96% of $69 is $60.00 off. ensureCoupon logs if a future
// price ever fails to land.

// The webinar row a code for this course should be priced against. PP-101 and
// PP-102 are dated cohorts, so this mirrors useCurrentWorkshop: the next
// upcoming one. Cohorts cloned from each other share a Stripe Price, which is
// what lets one code cover whichever cohort the student picks.
export async function resolveCourseWorkshop(courseKey) {
  const course = SCHOLARSHIP_COURSES[courseKey]
  if (!course) throw new Error(`Unknown scholarship course: ${courseKey}`)

  let query = supabaseAdmin.from('webinars').select('id, title, slug, stripe_price_id')
  if (course.slug) {
    query = query.eq('slug', course.slug)
  } else {
    query = query
      .ilike('slug', `${course.seriesPrefix}-%`)
      .eq('kind', 'webinar')
      .in('status', ['upcoming', 'live'])
      .gt('scheduled_at', new Date().toISOString())
      .order('scheduled_at', { ascending: true })
      .limit(1)
  }
  const { data, error } = await query.maybeSingle()
  if (error) throw error
  if (!data) throw new Error(`No upcoming ${course.label} to price a code against`)
  if (!data.stripe_price_id) throw new Error(`${data.title} has no Stripe price`)
  return data
}

// One coupon per (course, Price). Created on first use, so there is nothing to
// set up in the Stripe dashboard, in test or live mode. Keying on the Price
// means a price change gets a fresh coupon with the right percentage instead
// of silently discounting to the wrong amount.
export async function ensureCoupon(courseKey, workshop) {
  const course = SCHOLARSHIP_COURSES[courseKey]
  const price = await stripe.prices.retrieve(workshop.stripe_price_id)
  const couponId = `${COUPON_PREFIX}${courseKey}-${price.id}`

  try {
    const existing = await stripe.coupons.retrieve(couponId)
    if (existing?.valid) return existing
  } catch (err) {
    if (err?.code !== 'resource_missing') throw err
  }

  const unit = price.unit_amount
  if (!unit || unit <= course.targetCents) {
    throw new Error(`${course.label} price (${unit}) is not above the scholarship price`)
  }
  const percentOff = Math.round(((unit - course.targetCents) / unit) * 10000) / 100
  const landed = unit - Math.round((unit * percentOff) / 100)
  if (landed !== course.targetCents) {
    console.error(
      `scholarship coupon for ${courseKey} lands at ${landed} cents, not ${course.targetCents}`
    )
  }

  const productId = typeof price.product === 'string' ? price.product : price.product.id
  return stripe.coupons.create({
    id: couponId,
    name: `Scholarship: ${course.label}`,
    percent_off: percentOff,
    duration: 'once',
    applies_to: { products: [productId] },
    metadata: { scholarship: 'true', course: courseKey },
  })
}

// No 0/O or 1/I, so a code read aloud or retyped survives.
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
function randomSuffix(length = 6) {
  const bytes = crypto.randomBytes(length)
  let out = ''
  for (const b of bytes) out += CODE_ALPHABET[b % CODE_ALPHABET.length]
  return out
}

// Mint one single-use, 30-day promotion code for an approved applicant and
// record it. Throws on any Stripe or DB failure.
export async function mintScholarshipCode(application, courseKey) {
  const course = SCHOLARSHIP_COURSES[courseKey]
  const workshop = await resolveCourseWorkshop(courseKey)
  const coupon = await ensureCoupon(courseKey, workshop)
  const expiresAt = new Date(Date.now() + CODE_LIFETIME_DAYS * 24 * 60 * 60 * 1000)

  const promo = await stripe.promotionCodes.create({
    coupon: coupon.id,
    code: `SCHOLAR-${course.codeTag}-${randomSuffix()}`,
    max_redemptions: 1,
    expires_at: Math.floor(expiresAt.getTime() / 1000),
    metadata: { scholarship_application_id: application.id, course: courseKey },
  })

  const { data, error } = await supabaseAdmin
    .from('scholarship_codes')
    .insert({
      application_id: application.id,
      course: courseKey,
      code: promo.code,
      stripe_promotion_code_id: promo.id,
      stripe_coupon_id: coupon.id,
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single()
  if (error) {
    // The code exists in Stripe but not here, which would leave a purchase
    // with no link back to the application. Deactivate it rather than leave
    // an untracked live code.
    await stripe.promotionCodes.update(promo.id, { active: false }).catch(() => {})
    throw error
  }
  return data
}

function idOf(value) {
  if (!value) return null
  return typeof value === 'string' ? value : value.id ?? null
}

// The scholarship discount on a completed Checkout session, or null. The
// webhook payload lists applied discounts on session.discounts; the breakdown
// fallback covers a session object that omits them.
export async function findScholarshipDiscount(session) {
  let discounts = (session.discounts ?? []).map((d) => ({
    couponId: idOf(d.coupon),
    promotionCodeId: idOf(d.promotion_code),
  }))

  if (discounts.length === 0 && session.total_details?.amount_discount > 0) {
    const full = await stripe.checkout.sessions.retrieve(session.id, {
      expand: ['total_details.breakdown'],
    })
    discounts = (full.total_details?.breakdown?.discounts ?? []).map((d) => ({
      couponId: idOf(d.discount?.coupon),
      promotionCodeId: idOf(d.discount?.promotion_code),
    }))
  }

  return discounts.find((d) => d.couponId?.startsWith(COUPON_PREFIX)) ?? null
}

// Called from provisionPurchase once the entitlement exists. Idempotent: the
// enrollment upserts on (user_id, webinar_id) and the code stamp only fills
// an empty redeemed_at. Throws; the caller treats it as non-fatal.
export async function recordScholarshipPurchase(session, { userId, workshopId, email }) {
  const discount = await findScholarshipDiscount(session)
  if (!discount) return null

  let codeRow = null
  if (discount.promotionCodeId) {
    const { data, error } = await supabaseAdmin
      .from('scholarship_codes')
      .select('id, code')
      .eq('stripe_promotion_code_id', discount.promotionCodeId)
      .maybeSingle()
    if (error) throw error
    codeRow = data
  }

  const { error: enrollErr } = await supabaseAdmin.from('scholarship_enrollments').upsert(
    {
      user_id: userId,
      webinar_id: workshopId,
      code_id: codeRow?.id ?? null,
      source: 'stripe',
      amount_paid_cents: session.amount_total ?? null,
      amount_discount_cents: session.total_details?.amount_discount ?? null,
      stripe_session_id: session.id,
    },
    { onConflict: 'user_id,webinar_id' }
  )
  if (enrollErr) throw enrollErr

  if (codeRow) {
    const { error: stampErr } = await supabaseAdmin
      .from('scholarship_codes')
      .update({
        redeemed_at: new Date().toISOString(),
        redeemed_email: email,
        redeemed_user_id: userId,
        stripe_session_id: session.id,
      })
      .eq('id', codeRow.id)
      .is('redeemed_at', null)
    if (stampErr) throw stampErr
  }

  return { code: codeRow?.code ?? discount.promotionCodeId ?? discount.couponId }
}
