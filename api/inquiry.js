import { sendInquiryEmail, sendInquiryAcknowledgement } from './_lib/resend.js'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const INQUIRY_INTERESTS = new Set(['1:1 mentoring', 'In-person workshop', 'Both'])
const YEARS_OPTIONS = new Set(['<1', '1-3', '4-7', '8+'])
const PP101_OPTIONS = new Set(['yes', 'add-to-purchase'])
const EQUIPMENT_OPTIONS = new Set(['Reformer', 'Tower', 'Chair', 'Cadillac', 'Other'])
const MAIN_CAREER_OPTIONS = new Set(['yes', 'no'])
const PAYMENT_PLAN_OPTIONS = new Set(['upfront', 'monthly'])

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

    if (kind !== 'inquiry' && kind !== 'application') {
      return res.status(400).json({ error: 'Unknown inquiry kind' })
    }

    const result = kind === 'inquiry' ? validateInquiry(body) : validateApplication(body)
    if (result.error) return res.status(400).json({ error: result.error })

    await sendInquiryEmail({ kind, ...result.payload })

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
