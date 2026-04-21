import { sendContactEmail, sendContactAcknowledgement } from './_lib/resend.js'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { name, email, message, website } = req.body ?? {}

    if (typeof website === 'string' && website.trim() !== '') {
      return res.status(200).json({ ok: true })
    }

    const trimmedName = typeof name === 'string' ? name.trim() : ''
    const trimmedEmail = typeof email === 'string' ? email.trim() : ''
    const trimmedMessage = typeof message === 'string' ? message.trim() : ''

    if (!trimmedName) return res.status(400).json({ error: 'Name is required' })
    if (!trimmedEmail) return res.status(400).json({ error: 'Email is required' })
    if (!trimmedMessage) return res.status(400).json({ error: 'Message is required' })
    if (trimmedName.length > 200) return res.status(400).json({ error: 'Name is too long' })
    if (trimmedEmail.length > 320) return res.status(400).json({ error: 'Email is too long' })
    if (trimmedMessage.length > 5000) return res.status(400).json({ error: 'Message is too long (max 5000 characters)' })
    if (!EMAIL_RE.test(trimmedEmail)) return res.status(400).json({ error: 'Please enter a valid email address' })

    await sendContactEmail({
      name: trimmedName,
      email: trimmedEmail,
      message: trimmedMessage,
    })

    try {
      await sendContactAcknowledgement({
        to: trimmedEmail,
        name: trimmedName,
        message: trimmedMessage,
      })
    } catch (ackErr) {
      console.error('contact acknowledgement failed:', ackErr)
    }

    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('contact handler error:', err)
    return res.status(500).json({ error: err.message ?? 'Internal error' })
  }
}
