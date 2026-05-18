import { sendSurveyFeedbackEmail } from './_lib/resend.js'
import { supabaseAdmin } from './_lib/supabase-admin.js'
import { validateResponses, legacyColumnMirror } from './_lib/survey-validation.js'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function trimString(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function validateNameEmail(body) {
  const name = trimString(body.name)
  const email = trimString(body.email)
  if (!name) return { error: 'Name is required' }
  if (!email) return { error: 'Email is required' }
  if (name.length > 200) return { error: 'Name is too long' }
  if (email.length > 320) return { error: 'Email is too long' }
  if (!EMAIL_RE.test(email)) return { error: 'Please enter a valid email address' }
  return { payload: { name, email } }
}

async function getAuthedUser(req) {
  const authHeader = req.headers.authorization || req.headers.Authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null
  const token = authHeader.slice(7).trim()
  if (!token) return null
  const { data, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !data?.user) return { error: 'Invalid authentication token' }
  return { user: data.user }
}

function nameFromUser(user) {
  const first = trimString(user.user_metadata?.first_name)
  const last = trimString(user.user_metadata?.last_name)
  const combined = `${first} ${last}`.trim()
  return combined || user.email
}

function workshopDateString(scheduledAt) {
  if (!scheduledAt) return null
  const d = new Date(scheduledAt)
  if (Number.isNaN(d.getTime())) return null
  return d.toISOString().slice(0, 10)
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const body = req.body ?? {}
    const { website } = body

    if (typeof website === 'string' && website.trim() !== '') {
      return res.status(200).json({ ok: true })
    }

    const webinarSlug = trimString(body.webinar_slug)
    if (!webinarSlug) {
      return res.status(400).json({ error: 'webinar_slug is required' })
    }

    const { data: webinar, error: webinarErr } = await supabaseAdmin
      .from('webinars')
      .select('id, slug, title, scheduled_at, survey_config')
      .eq('slug', webinarSlug)
      .maybeSingle()

    if (webinarErr) {
      console.error('survey-feedback webinar lookup error:', webinarErr)
      return res.status(500).json({ error: 'Could not load the workshop. Please try again.' })
    }
    if (!webinar) {
      return res.status(404).json({ error: 'Workshop not found' })
    }

    const config = webinar.survey_config
    if (!config?.enabled) {
      return res.status(403).json({ error: 'The survey is not currently accepting responses.' })
    }
    const now = Date.now()
    if (config.opens_at && now < Date.parse(config.opens_at)) {
      return res.status(403).json({ error: 'The survey has not opened yet.' })
    }
    if (config.closes_at && now >= Date.parse(config.closes_at)) {
      return res.status(403).json({ error: 'The survey period is closed.' })
    }

    const validation = validateResponses(config, body.responses)
    if (validation.error) return res.status(400).json({ error: validation.error })

    const authResult = await getAuthedUser(req)
    if (authResult?.error) return res.status(401).json({ error: authResult.error })
    const authUser = authResult?.user ?? null

    let identity
    if (authUser) {
      identity = {
        name: nameFromUser(authUser),
        email: authUser.email,
        user_id: authUser.id,
      }
      const { data: existing, error: existingErr } = await supabaseAdmin
        .from('workshop_feedback')
        .select('id')
        .eq('user_id', authUser.id)
        .eq('webinar_id', webinar.id)
        .maybeSingle()
      if (existingErr) {
        console.error('survey-feedback dedup check error:', existingErr)
        return res.status(500).json({ error: 'Could not save your feedback. Please try again.' })
      }
      if (existing) {
        return res.status(409).json({ error: 'You have already submitted feedback for this workshop.' })
      }
    } else {
      const nameEmail = validateNameEmail(body)
      if (nameEmail.error) return res.status(400).json({ error: nameEmail.error })
      identity = { ...nameEmail.payload, user_id: null }
    }

    const workshopDate = workshopDateString(webinar.scheduled_at)
    if (!workshopDate) {
      return res.status(400).json({ error: 'Workshop has no scheduled date. Ask the admin to set one before collecting feedback.' })
    }

    const insertPayload = {
      webinar_id: webinar.id,
      workshop_title: webinar.title,
      workshop_date: workshopDate,
      responses: validation.responses,
      ...legacyColumnMirror(validation.responses),
      ...identity,
    }

    const { error: insertErr } = await supabaseAdmin
      .from('workshop_feedback')
      .insert(insertPayload)

    if (insertErr) {
      console.error('survey-feedback insert error:', insertErr)
      return res.status(500).json({ error: 'Could not save your feedback. Please try again.' })
    }

    try {
      await sendSurveyFeedbackEmail({
        workshopTitle: webinar.title,
        workshopDate,
        name: identity.name,
        email: identity.email,
        questions: config.questions,
        responses: validation.responses,
        recipientEmail: config.admin_email,
      })
    } catch (emailErr) {
      console.error('survey-feedback email failed:', emailErr)
    }

    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('survey-feedback handler error:', err)
    return res.status(500).json({ error: err.message ?? 'Internal error' })
  }
}
