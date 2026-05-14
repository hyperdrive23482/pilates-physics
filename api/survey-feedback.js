import { sendSurveyFeedbackEmail } from './_lib/resend.js'
import { supabaseAdmin } from './_lib/supabase-admin.js'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const WORKSHOP_TITLE = 'Pilates Physics 101'
const WORKSHOP_DATE = '2026-05-20'

// Pacific midnight on June 1 — the latest US-local "June 1 begins". Any honest
// US respondent at their local June-1-eve still gets through; tampered submissions
// well past the window do not.
const SURVEY_CUTOFF_ISO = '2026-06-01T00:00:00-07:00'

const YEARS_OPTIONS = new Set(['<1 year', '1-3 years', '4-7 years', '8-15 years', '15+ years'])
const VALUABLE_OPTIONS = new Set([
  'Framework',
  'Background Physics',
  'Practical Application',
  'Wrap-Up Challenge worksheet',
])
const RUSHED_OPTIONS = new Set([
  'Framework',
  'Background Physics',
  'Practical Application',
  'Wrap-Up',
  'Nothing — pacing felt right',
])
const LENGTH_OPTIONS = new Set(["Could've been shorter", 'Just right', "Could've been longer"])
const SHARE_OPTIONS = new Set([
  'Yes, with my first name',
  'Yes, but keep me anonymous',
  'No, please keep my responses private',
])

function trimString(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function validateSurvey(body) {
  const name = trimString(body.name)
  const email = trimString(body.email)
  const yearsTeaching = trimString(body.years_teaching)
  const npsRaw = body.nps_score
  const changeThisWeek = trimString(body.change_this_week)
  const ahaMoment = trimString(body.aha_moment)
  const valuableSections = Array.isArray(body.valuable_sections) ? body.valuable_sections : []
  const rushedSection = trimString(body.rushed_section)
  const confusing = trimString(body.confusing)
  const lengthFeedback = trimString(body.length_feedback)
  const sharePermission = trimString(body.share_permission)
  const nextWorkshopTopic = trimString(body.next_workshop_topic)
  const anythingElse = trimString(body.anything_else)

  if (!name) return { error: 'Name is required' }
  if (!email) return { error: 'Email is required' }
  if (name.length > 200) return { error: 'Name is too long' }
  if (email.length > 320) return { error: 'Email is too long' }
  if (!EMAIL_RE.test(email)) return { error: 'Please enter a valid email address' }

  if (!yearsTeaching) return { error: 'Years teaching is required' }
  if (!YEARS_OPTIONS.has(yearsTeaching)) return { error: 'Please select a valid years-teaching option' }

  if (!Number.isInteger(npsRaw) || npsRaw < 1 || npsRaw > 10) {
    return { error: 'Please select a score from 1 to 10' }
  }

  if (!changeThisWeek) return { error: 'Please tell me one thing that will change how you teach this week' }
  if (changeThisWeek.length > 2000) return { error: 'Response is too long (max 2000 characters)' }

  if (!ahaMoment) return { error: 'Please share your favorite aha moment' }
  if (ahaMoment.length > 2000) return { error: 'Response is too long (max 2000 characters)' }

  if (valuableSections.length === 0) return { error: 'Please select at least one valuable section' }
  for (const item of valuableSections) {
    if (!VALUABLE_OPTIONS.has(item)) return { error: 'Invalid valuable-section option' }
  }

  if (!rushedSection) return { error: 'Please tell me about pacing' }
  if (!RUSHED_OPTIONS.has(rushedSection)) return { error: 'Invalid rushed-section option' }

  if (!confusing) return { error: 'Please tell me what was confusing (you can say "nothing")' }
  if (confusing.length > 2000) return { error: 'Response is too long (max 2000 characters)' }

  if (!lengthFeedback) return { error: 'Please tell me about the length' }
  if (!LENGTH_OPTIONS.has(lengthFeedback)) return { error: 'Invalid length option' }

  if (!sharePermission) return { error: 'Please tell me whether I can share your feedback' }
  if (!SHARE_OPTIONS.has(sharePermission)) return { error: 'Invalid share-permission option' }

  if (nextWorkshopTopic.length > 2000) return { error: 'Response is too long (max 2000 characters)' }
  if (anythingElse.length > 2000) return { error: 'Response is too long (max 2000 characters)' }

  return {
    payload: {
      name,
      email,
      years_teaching: yearsTeaching,
      nps_score: npsRaw,
      change_this_week: changeThisWeek,
      aha_moment: ahaMoment,
      valuable_sections: valuableSections,
      rushed_section: rushedSection,
      confusing,
      length_feedback: lengthFeedback,
      share_permission: sharePermission,
      next_workshop_topic: nextWorkshopTopic || null,
      anything_else: anythingElse || null,
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
    const { website } = body

    if (typeof website === 'string' && website.trim() !== '') {
      return res.status(200).json({ ok: true })
    }

    if (Date.now() >= Date.parse(SURVEY_CUTOFF_ISO)) {
      return res.status(403).json({ error: 'The survey period is closed.' })
    }

    const result = validateSurvey(body)
    if (result.error) return res.status(400).json({ error: result.error })

    const insertPayload = {
      workshop_title: WORKSHOP_TITLE,
      workshop_date: WORKSHOP_DATE,
      ...result.payload,
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
        workshopTitle: WORKSHOP_TITLE,
        workshopDate: WORKSHOP_DATE,
        ...result.payload,
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
