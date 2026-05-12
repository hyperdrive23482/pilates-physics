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
    replyTo: email,
  })
  if (error) throw new Error(`Resend send failed: ${error.message ?? JSON.stringify(error)}`)
  return data
}

export async function sendPurchaseNotification({
  email,
  firstName,
  lastName,
  webinarTitle,
  amountCents,
  userState,
  sessionId,
}) {
  const to = 'kaleen@pilatesphysics.com'
  const fullName = `${firstName} ${lastName}`.trim() || '(no name)'
  const safeName = escapeHtml(fullName)
  const safeEmail = escapeHtml(email)
  const safeTitle = escapeHtml(webinarTitle || '(unknown course)')
  const safeSession = escapeHtml(sessionId || '')
  const stateLabel =
    userState === 'new'
      ? 'New customer'
      : userState === 'returning'
        ? 'Returning customer'
        : userState === 'logged_in'
          ? 'Logged-in customer'
          : userState || 'Unknown'
  const safeState = escapeHtml(stateLabel)
  const amountFormatted =
    typeof amountCents === 'number' ? `$${(amountCents / 100).toFixed(2)}` : '(unknown)'
  const safeAmount = escapeHtml(amountFormatted)

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1C1A17; line-height: 1.6;">
      <p style="margin: 0 0 1rem; font-size: 0.85rem; color: #666; text-transform: uppercase; letter-spacing: 0.08em;">New course purchase</p>
      <p style="margin: 0 0 0.5rem;"><strong>Course:</strong> ${safeTitle}</p>
      <p style="margin: 0 0 0.5rem;"><strong>Amount:</strong> ${safeAmount}</p>
      <p style="margin: 0 0 0.5rem;"><strong>Name:</strong> ${safeName}</p>
      <p style="margin: 0 0 0.5rem;"><strong>Email:</strong> <a href="mailto:${safeEmail}">${safeEmail}</a></p>
      <p style="margin: 0 0 0.5rem;"><strong>Customer type:</strong> ${safeState}</p>
      <p style="margin: 1.5rem 0 0; font-size: 0.85rem; color: #666;">Stripe session: ${safeSession}</p>
    </div>
  `.trim()

  const text = `New course purchase\n\nCourse: ${webinarTitle || '(unknown course)'}\nAmount: ${amountFormatted}\nName: ${fullName}\nEmail: ${email}\nCustomer type: ${stateLabel}\n\nStripe session: ${sessionId || ''}`

  const { data, error } = await getResend().emails.send({
    from: FROM,
    to,
    subject: `New purchase: ${webinarTitle || 'course'} — ${fullName}`,
    html,
    text,
  })
  if (error) throw new Error(`Resend send failed: ${error.message ?? JSON.stringify(error)}`)
  return data
}

export async function sendAssistApplicationEmail({
  name,
  email,
  location,
  hasComputer,
  certifiedWhen,
  teachingLoad,
  zoomExperience,
  whyInterested,
}) {
  const to = process.env.CONTACT_TO_EMAIL || 'kaleen@pilatesphysics.com'
  const safeName = escapeHtml(name)
  const safeEmail = escapeHtml(email)
  const safeLocation = escapeHtml(location)
  const safeHasComputer = escapeHtml(hasComputer === 'yes' ? 'Yes' : 'No')
  const safeCertifiedWhen = escapeHtml(certifiedWhen)
  const safeTeachingLoad = escapeHtml(teachingLoad).replace(/\n/g, '<br>')
  const safeZoomExperience = escapeHtml(zoomExperience).replace(/\n/g, '<br>')
  const safeWhyInterested = escapeHtml(whyInterested).replace(/\n/g, '<br>')

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1C1A17; line-height: 1.6;">
      <p style="margin: 0 0 1rem; font-size: 0.85rem; color: #666; text-transform: uppercase; letter-spacing: 0.08em;">New workshop assist application</p>
      <p style="margin: 0 0 0.5rem;"><strong>Name:</strong> ${safeName}</p>
      <p style="margin: 0 0 0.5rem;"><strong>Email:</strong> <a href="mailto:${safeEmail}">${safeEmail}</a></p>
      <p style="margin: 0 0 0.5rem;"><strong>Location:</strong> ${safeLocation}</p>
      <p style="margin: 0 0 0.5rem;"><strong>Has laptop/desktop access:</strong> ${safeHasComputer}</p>
      <p style="margin: 0 0 0.5rem;"><strong>Fully certified since:</strong> ${safeCertifiedWhen}</p>
      <p style="margin: 1.5rem 0 0.5rem;"><strong>Current teaching load:</strong></p>
      <div style="padding: 1rem; background: #f6f4ef; border-left: 3px solid #a48b5a;">${safeTeachingLoad}</div>
      <p style="margin: 1.5rem 0 0.5rem;"><strong>Zoom experience:</strong></p>
      <div style="padding: 1rem; background: #f6f4ef; border-left: 3px solid #a48b5a;">${safeZoomExperience}</div>
      <p style="margin: 1.5rem 0 0.5rem;"><strong>Why interested in Pilates Physics:</strong></p>
      <div style="padding: 1rem; background: #f6f4ef; border-left: 3px solid #a48b5a;">${safeWhyInterested}</div>
      <p style="margin: 1.5rem 0 0; font-size: 0.85rem; color: #666;">Reply directly to this email to respond to ${safeName}.</p>
    </div>
  `.trim()

  const text = `New workshop assist application

Name: ${name}
Email: ${email}
Location: ${location}
Has laptop/desktop access: ${hasComputer === 'yes' ? 'Yes' : 'No'}
Fully certified since: ${certifiedWhen}

Current teaching load:
${teachingLoad}

Zoom experience:
${zoomExperience}

Why interested in Pilates Physics:
${whyInterested}

Reply directly to this email to respond.`

  const { data, error } = await getResend().emails.send({
    from: FROM,
    to,
    subject: `Workshop assist application: ${name}`,
    html,
    text,
    replyTo: email,
  })
  if (error) throw new Error(`Resend send failed: ${error.message ?? JSON.stringify(error)}`)
  return data
}

export async function sendAssistAcknowledgement({ to, name }) {
  const safeName = escapeHtml(name)

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1C1A17; line-height: 1.6; max-width: 560px;">
      <p>Hi ${safeName},</p>
      <p>Thanks for applying to assist the workshop. Applications close 5/14/26 and I'll let you know either way on 5/15/26.</p>
      <p style="margin-top: 1.5rem;">— Kaleen</p>
    </div>
  `.trim()

  const text = `Hi ${name},\n\nThanks for applying to assist the workshop. Applications close 5/14/26 and I'll let you know either way on 5/15/26.\n\n— Kaleen`

  const { data, error } = await getResend().emails.send({
    from: FROM,
    to,
    subject: 'We got your application — Pilates Physics',
    html,
    text,
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
      <p>Thanks for reaching out — your message came through, and I will reply within a few days.</p>
      <p style="margin: 1.5rem 0 0.5rem; font-size: 0.85rem; color: #666; text-transform: uppercase; letter-spacing: 0.08em;">Your message</p>
      <div style="padding: 1rem; background: #f6f4ef; border-left: 3px solid #a48b5a;">${safeMessage}</div>
      <p style="margin-top: 1.5rem;">— Kaleen</p>
    </div>
  `.trim()

  const text = `Hi ${name},\n\nThanks for reaching out — your message came through, and I will reply within a few days.\n\nYour message:\n${message}\n\n— Kaleen`

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
