import { sendInquiryEmail, sendInquiryAcknowledgement } from './_lib/resend.js'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const INQUIRY_INTERESTS = new Set(['1:1 mentoring', 'In-person workshop', 'Both'])
const YEARS_OPTIONS = new Set(['<1', '1-3', '3-7', '7+'])
const PP101_OPTIONS = new Set(['yes', 'equivalent', 'no'])
const EQUIPMENT_OPTIONS = new Set(['Reformer', 'Tower', 'Chair', 'Cadillac', 'Other'])

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

function validateApplication(body) {
  const name = trimString(body.name)
  const email = trimString(body.email)
  const city = trimString(body.city)
  const yearsTeaching = trimString(body.yearsTeaching)
  const completedPP101 = trimString(body.completedPP101)
  const whyInterested = trimString(body.whyInterested)
  const whatHope = trimString(body.whatHope)
  const equipment = Array.isArray(body.equipment) ? body.equipment : []

  if (!name) return { error: 'Name is required' }
  if (!email) return { error: 'Email is required' }
  if (!yearsTeaching) return { error: 'Years teaching is required' }
  if (equipment.length === 0) return { error: 'Please select at least one piece of equipment' }
  if (!completedPP101) return { error: 'Please tell me whether you\'ve completed PP-101' }
  if (!whyInterested) return { error: 'Please tell me why you\'re interested' }
  if (!whatHope) return { error: 'Please tell me what you hope to get out of it' }
  if (name.length > 200) return { error: 'Name is too long' }
  if (email.length > 320) return { error: 'Email is too long' }
  if (city.length > 200) return { error: 'City is too long' }
  if (whyInterested.length > 2000) return { error: 'Why interested response is too long (max 2000 characters)' }
  if (whatHope.length > 2000) return { error: 'What you hope to get response is too long (max 2000 characters)' }
  if (!EMAIL_RE.test(email)) return { error: 'Please enter a valid email address' }
  if (!YEARS_OPTIONS.has(yearsTeaching)) return { error: 'Please select a valid years-teaching option' }
  if (!PP101_OPTIONS.has(completedPP101)) return { error: 'Please select a valid PP-101 option' }
  for (const item of equipment) {
    if (!EQUIPMENT_OPTIONS.has(item)) return { error: 'Invalid equipment option' }
  }

  return {
    payload: { name, email, city, yearsTeaching, equipment, completedPP101, whyInterested, whatHope },
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
