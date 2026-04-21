import { Resend } from 'resend'
import fs from 'node:fs/promises'
import path from 'node:path'

const FROM = 'Pilates Physics <noreply@mail.pilatesphysics.com>'

const TEMPLATES = {
  magiclink: {
    file: 'magic-link.html',
    subject: 'Your Pilates Physics sign-in link',
  },
}

// Lazy init — the Resend SDK throws synchronously in its constructor when
// the API key is missing. Initializing at module load would 500 every webhook
// invocation if the env var isn't set yet, even though the email send is
// supposed to be non-fatal.
let _resend = null
function getResend() {
  if (!_resend) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not set')
    }
    _resend = new Resend(process.env.RESEND_API_KEY)
  }
  return _resend
}

export async function sendAuthEmail({ to, kind, siteURL, tokenHash }) {
  const meta = TEMPLATES[kind]
  if (!meta) throw new Error(`Unknown auth email kind: ${kind}`)

  const templatePath = path.join(process.cwd(), 'supabase', 'email-templates', meta.file)
  const raw = await fs.readFile(templatePath, 'utf8')
  const html = raw
    .replace(/\{\{\s*\.SiteURL\s*\}\}/g, siteURL)
    .replace(/\{\{\s*\.TokenHash\s*\}\}/g, tokenHash)
    .replace(/\{\{\s*\.Email\s*\}\}/g, to)

  const { data, error } = await getResend().emails.send({
    from: FROM,
    to,
    subject: meta.subject,
    html,
  })
  if (error) throw new Error(`Resend send failed: ${error.message ?? JSON.stringify(error)}`)
  return data
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export async function sendContactEmail({ name, email, message }) {
  const to = process.env.CONTACT_TO_EMAIL || 'kaleen@pilatesphysics.com'
  const safeName = escapeHtml(name)
  const safeEmail = escapeHtml(email)
  const safeMessage = escapeHtml(message).replace(/\n/g, '<br>')

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1C1A17; line-height: 1.6;">
      <p style="margin: 0 0 1rem; font-size: 0.85rem; color: #666; text-transform: uppercase; letter-spacing: 0.08em;">New message from the help page</p>
      <p style="margin: 0 0 0.5rem;"><strong>Name:</strong> ${safeName}</p>
      <p style="margin: 0 0 0.5rem;"><strong>Email:</strong> <a href="mailto:${safeEmail}">${safeEmail}</a></p>
      <p style="margin: 1.5rem 0 0.5rem;"><strong>Message:</strong></p>
      <div style="padding: 1rem; background: #f6f4ef; border-left: 3px solid #a48b5a;">${safeMessage}</div>
      <p style="margin: 1.5rem 0 0; font-size: 0.85rem; color: #666;">Reply directly to this email to respond to ${safeName}.</p>
    </div>
  `.trim()

  const text = `New message from the help page\n\nName: ${name}\nEmail: ${email}\n\nMessage:\n${message}\n\nReply directly to this email to respond.`

  const { data, error } = await getResend().emails.send({
    from: FROM,
    to,
    subject: `Contact form: ${name}`,
    html,
    text,
    reply_to: email,
  })
  if (error) throw new Error(`Resend send failed: ${error.message ?? JSON.stringify(error)}`)
  return data
}

export async function sendContactAcknowledgement({ to, name, message }) {
  const safeName = escapeHtml(name)
  const safeMessage = escapeHtml(message).replace(/\n/g, '<br>')

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1C1A17; line-height: 1.6; max-width: 560px;">
      <p>Hi ${safeName},</p>
      <p>Thanks for reaching out — your message came through, and Kaleen will reply within a few days.</p>
      <p style="margin: 1.5rem 0 0.5rem; font-size: 0.85rem; color: #666; text-transform: uppercase; letter-spacing: 0.08em;">Your message</p>
      <div style="padding: 1rem; background: #f6f4ef; border-left: 3px solid #a48b5a;">${safeMessage}</div>
      <p style="margin-top: 1.5rem;">— Pilates Physics</p>
    </div>
  `.trim()

  const text = `Hi ${name},\n\nThanks for reaching out — your message came through, and Kaleen will reply within a few days.\n\nYour message:\n${message}\n\n— Pilates Physics`

  const { data, error } = await getResend().emails.send({
    from: FROM,
    to,
    subject: 'We got your message — Pilates Physics',
    html,
    text,
  })
  if (error) throw new Error(`Resend send failed: ${error.message ?? JSON.stringify(error)}`)
  return data
}
