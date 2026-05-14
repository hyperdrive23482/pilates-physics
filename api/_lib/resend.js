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

const YEARS_LABEL = {
  '<1': 'Less than 1 year',
  '1-3': '1–3 years',
  '3-7': '3–7 years',
  '7+': '7+ years',
}

const PP101_LABEL = {
  yes: 'Yes',
  equivalent: 'No, but has equivalent background',
  no: 'No',
}

export async function sendInquiryEmail({ kind, ...payload }) {
  const to = process.env.CONTACT_TO_EMAIL || 'kaleen@pilatesphysics.com'

  if (kind === 'inquiry') {
    const { name, email, interest, message } = payload
    const safeName = escapeHtml(name)
    const safeEmail = escapeHtml(email)
    const safeInterest = escapeHtml(interest)
    const safeMessage = escapeHtml(message).replace(/\n/g, '<br>')

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1C1A17; line-height: 1.6;">
        <p style="margin: 0 0 1rem; font-size: 0.85rem; color: #666; text-transform: uppercase; letter-spacing: 0.08em;">New inquiry from /education</p>
        <p style="margin: 0 0 0.5rem;"><strong>Interested in:</strong> ${safeInterest}</p>
        <p style="margin: 0 0 0.5rem;"><strong>Name:</strong> ${safeName}</p>
        <p style="margin: 0 0 0.5rem;"><strong>Email:</strong> <a href="mailto:${safeEmail}">${safeEmail}</a></p>
        <p style="margin: 1.5rem 0 0.5rem;"><strong>Message:</strong></p>
        <div style="padding: 1rem; background: #f6f4ef; border-left: 3px solid #a48b5a;">${safeMessage}</div>
        <p style="margin: 1.5rem 0 0; font-size: 0.85rem; color: #666;">Reply directly to this email to respond to ${safeName}.</p>
      </div>
    `.trim()

    const text = `New inquiry from /education\n\nInterested in: ${interest}\nName: ${name}\nEmail: ${email}\n\nMessage:\n${message}\n\nReply directly to this email to respond.`

    const { data, error } = await getResend().emails.send({
      from: FROM,
      to,
      subject: `Inquiry: ${interest} — ${name}`,
      html,
      text,
      replyTo: email,
    })
    if (error) throw new Error(`Resend send failed: ${error.message ?? JSON.stringify(error)}`)
    return data
  }

  if (kind === 'application') {
    const {
      name,
      email,
      city,
      yearsTeaching,
      equipment,
      completedPP101,
      whyInterested,
      whatHope,
    } = payload
    const safeName = escapeHtml(name)
    const safeEmail = escapeHtml(email)
    const safeCity = escapeHtml(city || '(not provided)')
    const safeYears = escapeHtml(YEARS_LABEL[yearsTeaching] || yearsTeaching)
    const safeEquipment = escapeHtml((equipment || []).join(', '))
    const safePP101 = escapeHtml(PP101_LABEL[completedPP101] || completedPP101)
    const safeWhy = escapeHtml(whyInterested).replace(/\n/g, '<br>')
    const safeHope = escapeHtml(whatHope).replace(/\n/g, '<br>')

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1C1A17; line-height: 1.6;">
        <p style="margin: 0 0 1rem; font-size: 0.85rem; color: #666; text-transform: uppercase; letter-spacing: 0.08em;">New PP-201 application</p>
        <p style="margin: 0 0 0.5rem;"><strong>Name:</strong> ${safeName}</p>
        <p style="margin: 0 0 0.5rem;"><strong>Email:</strong> <a href="mailto:${safeEmail}">${safeEmail}</a></p>
        <p style="margin: 0 0 0.5rem;"><strong>City / region:</strong> ${safeCity}</p>
        <p style="margin: 0 0 0.5rem;"><strong>Years teaching:</strong> ${safeYears}</p>
        <p style="margin: 0 0 0.5rem;"><strong>Equipment access:</strong> ${safeEquipment}</p>
        <p style="margin: 0 0 0.5rem;"><strong>Completed PP-101:</strong> ${safePP101}</p>
        <p style="margin: 1.5rem 0 0.5rem;"><strong>Why interested in PP-201:</strong></p>
        <div style="padding: 1rem; background: #f6f4ef; border-left: 3px solid #a48b5a;">${safeWhy}</div>
        <p style="margin: 1.5rem 0 0.5rem;"><strong>What they hope to get out of it:</strong></p>
        <div style="padding: 1rem; background: #f6f4ef; border-left: 3px solid #a48b5a;">${safeHope}</div>
        <p style="margin: 1.5rem 0 0; font-size: 0.85rem; color: #666;">Reply directly to this email to respond to ${safeName}.</p>
      </div>
    `.trim()

    const text = `New PP-201 application\n\nName: ${name}\nEmail: ${email}\nCity / region: ${city || '(not provided)'}\nYears teaching: ${YEARS_LABEL[yearsTeaching] || yearsTeaching}\nEquipment access: ${(equipment || []).join(', ')}\nCompleted PP-101: ${PP101_LABEL[completedPP101] || completedPP101}\n\nWhy interested:\n${whyInterested}\n\nWhat they hope to get out of it:\n${whatHope}\n\nReply directly to this email to respond.`

    const { data, error } = await getResend().emails.send({
      from: FROM,
      to,
      subject: `PP-201 Application: ${name}`,
      html,
      text,
      replyTo: email,
    })
    if (error) throw new Error(`Resend send failed: ${error.message ?? JSON.stringify(error)}`)
    return data
  }

  throw new Error(`Unknown inquiry kind: ${kind}`)
}

export async function sendInquiryAcknowledgement({ kind, to, name }) {
  const safeName = escapeHtml(name)

  const isApplication = kind === 'application'
  const subject = isApplication
    ? 'Your PP-201 application — Pilates Physics'
    : 'Thanks for reaching out — Pilates Physics'

  const bodyHtml = isApplication
    ? `<p>Thanks for applying to Pilates Physics 201 — your application came through.</p>
       <p>I review every application personally, and you'll hear back from me within a week.</p>`
    : `<p>Thanks for reaching out — your inquiry came through, and I'll get back to you within a few days.</p>`

  const bodyText = isApplication
    ? `Thanks for applying to Pilates Physics 201 — your application came through.\n\nI review every application personally, and you'll hear back from me within a week.`
    : `Thanks for reaching out — your inquiry came through, and I'll get back to you within a few days.`

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1C1A17; line-height: 1.6; max-width: 560px;">
      <p>Hi ${safeName},</p>
      ${bodyHtml}
      <p style="margin-top: 1.5rem;">— Kaleen</p>
    </div>
  `.trim()

  const text = `Hi ${name},\n\n${bodyText}\n\n— Kaleen`

  const { data, error } = await getResend().emails.send({
    from: FROM,
    to,
    subject,
    html,
    text,
  })
  if (error) throw new Error(`Resend send failed: ${error.message ?? JSON.stringify(error)}`)
  return data
}
