import { sendAssistApplicationEmail, sendAssistAcknowledgement } from './_lib/resend.js'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const {
      name,
      email,
      location,
      hasComputer,
      certifiedWhen,
      teachingLoad,
      zoomExperience,
      whyInterested,
      available,
      website,
    } = req.body ?? {}

    if (typeof website === 'string' && website.trim() !== '') {
      return res.status(200).json({ ok: true })
    }

    const trimmedName = typeof name === 'string' ? name.trim() : ''
    const trimmedEmail = typeof email === 'string' ? email.trim() : ''
    const trimmedLocation = typeof location === 'string' ? location.trim() : ''
    const trimmedHasComputer = typeof hasComputer === 'string' ? hasComputer.trim() : ''
    const trimmedCertifiedWhen = typeof certifiedWhen === 'string' ? certifiedWhen.trim() : ''
    const trimmedTeachingLoad = typeof teachingLoad === 'string' ? teachingLoad.trim() : ''
    const trimmedZoomExperience = typeof zoomExperience === 'string' ? zoomExperience.trim() : ''
    const trimmedWhyInterested = typeof whyInterested === 'string' ? whyInterested.trim() : ''

    if (!trimmedName) return res.status(400).json({ error: 'Name is required' })
    if (!trimmedEmail) return res.status(400).json({ error: 'Email is required' })
    if (!trimmedLocation) return res.status(400).json({ error: 'Location is required' })
    if (!trimmedHasComputer) return res.status(400).json({ error: 'Please answer the laptop/desktop access question' })
    if (!trimmedCertifiedWhen) return res.status(400).json({ error: 'Certification date is required' })
    if (!trimmedTeachingLoad) return res.status(400).json({ error: 'Teaching load is required' })
    if (!trimmedZoomExperience) return res.status(400).json({ error: 'Zoom experience is required' })
    if (!trimmedWhyInterested) return res.status(400).json({ error: 'Please tell us why you are interested' })

    if (trimmedName.length > 200) return res.status(400).json({ error: 'Name is too long' })
    if (trimmedEmail.length > 320) return res.status(400).json({ error: 'Email is too long' })
    if (trimmedLocation.length > 200) return res.status(400).json({ error: 'Location is too long' })
    if (trimmedCertifiedWhen.length > 200) return res.status(400).json({ error: 'Certification date is too long' })
    if (trimmedTeachingLoad.length > 750) return res.status(400).json({ error: 'Teaching load is too long (max 750 characters)' })
    if (trimmedZoomExperience.length > 750) return res.status(400).json({ error: 'Zoom experience is too long (max 750 characters)' })
    if (trimmedWhyInterested.length > 750) return res.status(400).json({ error: 'Response is too long (max 750 characters)' })

    if (!EMAIL_RE.test(trimmedEmail)) return res.status(400).json({ error: 'Please enter a valid email address' })

    if (trimmedHasComputer !== 'yes' && trimmedHasComputer !== 'no') {
      return res.status(400).json({ error: 'Invalid value for laptop/desktop access' })
    }

    if (available !== true) {
      return res.status(400).json({ error: 'You must confirm you are available during the workshop time' })
    }

    await sendAssistApplicationEmail({
      name: trimmedName,
      email: trimmedEmail,
      location: trimmedLocation,
      hasComputer: trimmedHasComputer,
      certifiedWhen: trimmedCertifiedWhen,
      teachingLoad: trimmedTeachingLoad,
      zoomExperience: trimmedZoomExperience,
      whyInterested: trimmedWhyInterested,
    })

    try {
      await sendAssistAcknowledgement({
        to: trimmedEmail,
        name: trimmedName,
      })
    } catch (ackErr) {
      console.error('assist acknowledgement failed:', ackErr)
    }

    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('assist handler error:', err)
    return res.status(500).json({ error: err.message ?? 'Internal error' })
  }
}
