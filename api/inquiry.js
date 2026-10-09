import { sendInquiryEmail, sendInquiryAcknowledgement } from './_lib/resend.js'
import { supabaseAdmin } from './_lib/supabase-admin.js'
import { SCHOLARSHIP_COURSES, PATH_STAGE_LABEL } from './_lib/scholarship-config.js'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const INQUIRY_INTERESTS = new Set(['1:1 mentoring', 'In-person workshop', 'Both'])
const YEARS_OPTIONS = new Set(['<1', '1-3', '4-7', '8+'])
const PP101_OPTIONS = new Set(['yes', 'add-to-purchase'])
const EQUIPMENT_OPTIONS = new Set(['Reformer', 'Tower', 'Chair', 'Cadillac', 'Other'])
const MAIN_CAREER_OPTIONS = new Set(['yes', 'no'])
const PAYMENT_PLAN_OPTIONS = new Set(['upfront', 'monthly'])
// Keep in step with src/lib/mentorship.js.
const MENTORSHIP_YEARS_OPTIONS = new Set(['<1', '1-2', '3-5', '5+'])
const MENTORSHIP_PLAN_OPTIONS = new Set(['full', 'two'])
const MENTORSHIP_EQUIPMENT_OPTIONS = new Set(['Reformer', 'Tower', 'Chair', 'Cadillac', 'Mat only', 'Other'])
const MENTORSHIP_APPLICATIONS_OPEN = false

function trimString(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function validateInquiry(body) {
  const name = trimString(body.name)
  const email = trimString(body.email)
  const interest = trimString(body.interest)
  const message = trimString(body.message)

  if (!name) return { error: 'Name is required' }
  if (!email) return { error: 'Email is required' }
  if (!interest) return { error: 'Please tell me what you\'re interested in' }
  if (!message) return { error: 'Message is required' }
  if (name.length > 200) return { error: 'Name is too long' }
  if (email.length > 320) return { error: 'Email is too long' }
  if (message.length > 2000) return { error: 'Message is too long (max 2000 characters)' }
  if (!EMAIL_RE.test(email)) return { error: 'Please enter a valid email address' }
  if (!INQUIRY_INTERESTS.has(interest)) return { error: 'Please select a valid interest option' }

  return { payload: { name, email, interest, message } }
}

function parseNonNegativeInt(value) {
  if (value === null || value === undefined || value === '') return null
  const str = String(value).trim()
  if (!/^\d+$/.test(str)) return null
  const n = Number(str)
  if (!Number.isFinite(n) || n < 0 || n > 100) return null
  return n
}

function validateApplication(body) {
  const name = trimString(body.name)
  const email = trimString(body.email)
  const city = trimString(body.city)
  const yearsTeaching = trimString(body.yearsTeaching)
  const mainCareer = trimString(body.mainCareer)
  const completedPP101 = trimString(body.completedPP101)
  const paymentPlan = trimString(body.paymentPlan)
  const trainingBackground = trimString(body.trainingBackground)
  const physicsBackground = trimString(body.physicsBackground)
  const goalsAndInterest = trimString(body.goalsAndInterest)
  const equipment = Array.isArray(body.equipment) ? body.equipment : []
  const acknowledgement = body.acknowledgement === true
  const privatesPerWeek = parseNonNegativeInt(body.privatesPerWeek)
  const groupsPerWeek = parseNonNegativeInt(body.groupsPerWeek)

  if (!name) return { error: 'Name is required' }
  if (!email) return { error: 'Email is required' }
  if (!yearsTeaching) return { error: 'Years teaching is required' }
  if (!mainCareer) return { error: 'Please tell me whether teaching Pilates is your main career' }
  if (privatesPerWeek === null) return { error: 'Please enter a valid number of privates per week (0–100)' }
  if (groupsPerWeek === null) return { error: 'Please enter a valid number of group classes per week (0–100)' }
  if (equipment.length === 0) return { error: 'Please select at least one piece of equipment' }
  if (!trainingBackground) return { error: 'Please describe your training and certifications' }
  if (!completedPP101) return { error: 'Please tell me whether you\'ve completed Pilates Physics 101' }
  if (!goalsAndInterest) return { error: 'Please tell me why you\'re interested and what you hope to get out of it' }
  if (!paymentPlan) return { error: 'Please select a payment plan preference' }
  if (!acknowledgement) return { error: 'Please acknowledge the participation expectations' }
  if (name.length > 200) return { error: 'Name is too long' }
  if (email.length > 320) return { error: 'Email is too long' }
  if (city.length > 200) return { error: 'City is too long' }
  if (trainingBackground.length > 2000) return { error: 'Training background is too long (max 2000 characters)' }
  if (physicsBackground.length > 2000) return { error: 'Physics background is too long (max 2000 characters)' }
  if (goalsAndInterest.length > 2000) return { error: 'Goals and interest response is too long (max 2000 characters)' }
  if (!EMAIL_RE.test(email)) return { error: 'Please enter a valid email address' }
  if (!YEARS_OPTIONS.has(yearsTeaching)) return { error: 'Please select a valid years-teaching option' }
  if (!MAIN_CAREER_OPTIONS.has(mainCareer)) return { error: 'Please select a valid main-career option' }
  if (!PP101_OPTIONS.has(completedPP101)) return { error: 'Please select a valid PP-101 option' }
  if (!PAYMENT_PLAN_OPTIONS.has(paymentPlan)) return { error: 'Please select a valid payment plan' }
  for (const item of equipment) {
    if (!EQUIPMENT_OPTIONS.has(item)) return { error: 'Invalid equipment option' }
  }

  return {
    payload: {
      name,
      email,
      city,
      yearsTeaching,
      mainCareer,
      privatesPerWeek,
      groupsPerWeek,
      equipment,
      trainingBackground,
      physicsBackground,
      completedPP101,
      goalsAndInterest,
      paymentPlan,
      acknowledgement,
    },
  }
}

// The /mentorship/apply form. Payment is invoiced on acceptance, so the form
// captures who they are, how they teach, and which invoice to send.
function validateMentorship(body) {
  // Keep in step with APPLICATIONS_OPEN in src/lib/mentorship.js.
  if (!MENTORSHIP_APPLICATIONS_OPEN) return { error: 'The application period for the mentorship has closed.' }

  const name = trimString(body.name)
  const email = trimString(body.email)
  const city = trimString(body.city)
  const yearsTeaching = trimString(body.yearsTeaching)
  const mainCareer = trimString(body.mainCareer)
  const trainingBackground = trimString(body.trainingBackground)
  const goalsAndInterest = trimString(body.goalsAndInterest)
  const paymentPlan = trimString(body.paymentPlan)
  const equipment = Array.isArray(body.equipment) ? body.equipment : []
  const acknowledgement = body.acknowledgement === true
  const paymentAcknowledgement = body.paymentAcknowledgement === true
  const remoAcknowledgement = body.remoAcknowledgement === true
  const privatesPerWeek = parseNonNegativeInt(body.privatesPerWeek)
  const groupsPerWeek = parseNonNegativeInt(body.groupsPerWeek)

  if (!name) return { error: 'Name is required' }
  if (!email) return { error: 'Email is required' }
  if (!yearsTeaching) return { error: 'Please tell me how long you have been teaching' }
  if (!mainCareer) return { error: 'Please tell me whether teaching Pilates is your main career' }
  if (privatesPerWeek === null) return { error: 'Please enter a valid number of privates per week (0 to 100)' }
  if (groupsPerWeek === null) return { error: 'Please enter a valid number of group classes per week (0 to 100)' }
  if (equipment.length === 0) return { error: 'Please select at least one piece of equipment' }
  if (!trainingBackground) return { error: 'Please describe your training and certifications' }
  if (!goalsAndInterest) return { error: 'Please tell me why this program and what you want out of it' }
  if (!paymentPlan) return { error: 'Please pick a payment option' }
  if (!acknowledgement) return { error: 'Please confirm the participation note' }
  if (!paymentAcknowledgement) return { error: 'Please confirm the payment note' }
  if (name.length > 200) return { error: 'Name is too long' }
  if (email.length > 320) return { error: 'Email is too long' }
  if (city.length > 200) return { error: 'City is too long' }
  if (trainingBackground.length > 2000) return { error: 'Training background is too long (max 2000 characters)' }
  if (goalsAndInterest.length > 2000) return { error: 'Your answer is too long (max 2000 characters)' }
  if (!EMAIL_RE.test(email)) return { error: 'Please enter a valid email address' }
  if (!MENTORSHIP_YEARS_OPTIONS.has(yearsTeaching)) return { error: 'Please select a valid years-teaching option' }
  if (!MAIN_CAREER_OPTIONS.has(mainCareer)) return { error: 'Please select a valid main-career option' }
  if (!MENTORSHIP_PLAN_OPTIONS.has(paymentPlan)) return { error: 'Please select a valid payment option' }
  for (const item of equipment) {
    if (!MENTORSHIP_EQUIPMENT_OPTIONS.has(item)) return { error: 'Invalid equipment option' }
  }

  return {
    payload: {
      name,
      email,
      city,
      yearsTeaching,
      mainCareer,
      privatesPerWeek,
      groupsPerWeek,
      equipment,
      trainingBackground,
      goalsAndInterest,
      paymentPlan,
      acknowledgement,
      paymentAcknowledgement,
      remoAcknowledgement,
    },
  }
}

// The /scholarship form. The two written answers have a floor so the form
// takes some thought; keep SCHOLARSHIP_MIN_CHARS in step with
// src/lib/scholarship.js.
const SCHOLARSHIP_MIN_CHARS = 150

function validateScholarship(body) {
  const name = trimString(body.name)
  const email = trimString(body.email)
  const city = trimString(body.city)
  const pathStage = trimString(body.pathStage)
  const pathStageOther = pathStage === 'other' ? trimString(body.pathStageOther) : ''
  const story = trimString(body.story)
  const teachingImpact = trimString(body.teachingImpact)
  const courses = Array.isArray(body.courses) ? [...new Set(body.courses)] : []
  const acknowledgement = body.acknowledgement === true

  if (!name) return { error: 'Name is required' }
  if (!email) return { error: 'Email is required' }
  if (courses.length === 0) return { error: 'Please pick a course' }
  // One course per application, so each code is tied to one considered ask.
  if (courses.length > 1) return { error: 'Please pick one course per application' }
  if (!pathStage) return { error: 'Please tell me where you are in your Pilates path' }
  if (pathStage === 'other' && !pathStageOther) {
    return { error: 'Please tell me a little about where you are in your Pilates path' }
  }
  if (pathStageOther.length > 300) return { error: 'Your "Other" answer is too long (max 300 characters)' }
  if (!story) return { error: 'Please tell me about your path so far' }
  if (!teachingImpact) return { error: 'Please tell me what would change in your teaching' }
  if (!acknowledgement) return { error: 'Please confirm the note about codes' }
  if (name.length > 200) return { error: 'Name is too long' }
  if (email.length > 320) return { error: 'Email is too long' }
  if (city.length > 200) return { error: 'City is too long' }
  if (story.length < SCHOLARSHIP_MIN_CHARS || teachingImpact.length < SCHOLARSHIP_MIN_CHARS) {
    return { error: `Please write at least ${SCHOLARSHIP_MIN_CHARS} characters for each question` }
  }
  if (story.length > 2000 || teachingImpact.length > 2000) {
    return { error: 'Your answer is too long (max 2000 characters)' }
  }
  if (!EMAIL_RE.test(email)) return { error: 'Please enter a valid email address' }
  if (!Object.prototype.hasOwnProperty.call(PATH_STAGE_LABEL, pathStage)) {
    return { error: 'Please select a valid option for where you are' }
  }
  for (const c of courses) {
    if (!Object.prototype.hasOwnProperty.call(SCHOLARSHIP_COURSES, c)) {
      return { error: 'Invalid course option' }
    }
  }

  return { payload: { name, email, city, courses, pathStage, pathStageOther, story, teachingImpact } }
}

// Scholarship applications are stored as well as emailed, so the admin page
// can approve them and count them. Fatal on purpose: an application that is
// emailed but not stored cannot be approved from the admin page.
async function storeScholarship(payload, req) {
  const { count, error: countErr } = await supabaseAdmin
    .from('scholarship_applications')
    .select('id', { count: 'exact', head: true })
    // Case-insensitive exact match: escape ilike's wildcards, since _ is common in emails.
    .ilike('email', payload.email.replace(/[\\%_]/g, '\\$&'))
  if (countErr) throw countErr

  const { error } = await supabaseAdmin.from('scholarship_applications').insert({
    name: payload.name,
    email: payload.email,
    city: payload.city || null,
    courses: payload.courses,
    path_stage: payload.pathStage,
    path_stage_other: payload.pathStageOther || null,
    story: payload.story,
    teaching_impact: payload.teachingImpact,
  })
  if (error) throw error

  const origin = `${req.headers['x-forwarded-proto'] ?? 'https'}://${req.headers.host}`
  return { previousCount: count ?? 0, adminUrl: `${origin}/admin/scholarships` }
}

const VALIDATORS = {
  inquiry: validateInquiry,
  application: validateApplication,
  mentorship: validateMentorship,
  scholarship: validateScholarship,
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const body = req.body ?? {}
    const { kind, website } = body

    if (typeof website === 'string' && website.trim() !== '') {
      return res.status(200).json({ ok: true })
    }

    const validate = Object.prototype.hasOwnProperty.call(VALIDATORS, kind) ? VALIDATORS[kind] : null
    if (!validate) {
      return res.status(400).json({ error: 'Unknown inquiry kind' })
    }

    const result = validate(body)
    if (result.error) return res.status(400).json({ error: result.error })

    const extra = kind === 'scholarship' ? await storeScholarship(result.payload, req) : {}

    await sendInquiryEmail({ kind, ...result.payload, ...extra })

    try {
      await sendInquiryAcknowledgement({
        kind,
        to: result.payload.email,
        name: result.payload.name,
      })
    } catch (ackErr) {
      console.error('inquiry acknowledgement failed:', ackErr)
    }

    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('inquiry handler error:', err)
    return res.status(500).json({ error: err.message ?? 'Internal error' })
  }
}
