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
  workshopTitle,
  amountCents,
  userState,
  sessionId,
}) {
  const to = 'kaleen@pilatesphysics.com'
  const fullName = `${firstName} ${lastName}`.trim() || '(no name)'
  const safeName = escapeHtml(fullName)
  const safeEmail = escapeHtml(email)
  const safeTitle = escapeHtml(workshopTitle || '(unknown course)')
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

  const text = `New course purchase\n\nCourse: ${workshopTitle || '(unknown course)'}\nAmount: ${amountFormatted}\nName: ${fullName}\nEmail: ${email}\nCustomer type: ${stateLabel}\n\nStripe session: ${sessionId || ''}`

  const { data, error } = await getResend().emails.send({
    from: FROM,
    to,
    subject: `New purchase: ${workshopTitle || 'course'} — ${fullName}`,
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
  '<1': '<1 year',
  '1-3': '1-3 years',
  '4-7': '4-7 years',
  '8+': '8+ years',
}

const PP101_LABEL = {
  yes: 'Yes',
  'add-to-purchase': 'No — wants to add PP-101 to purchase',
}

const MAIN_CAREER_LABEL = {
  yes: 'Yes',
  no: 'No',
}

const PAYMENT_PLAN_LABEL = {
  upfront: '$1,500 single up-front payment',
  monthly: '$600/mo for 3 months',
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
      mainCareer,
      privatesPerWeek,
      groupsPerWeek,
      equipment,
      trainingBackground,
      physicsBackground,
      completedPP101,
      goalsAndInterest,
      paymentPlan,
    } = payload
    const safeName = escapeHtml(name)
    const safeEmail = escapeHtml(email)
    const safeCity = escapeHtml(city || '(not provided)')
    const safeYears = escapeHtml(YEARS_LABEL[yearsTeaching] || yearsTeaching)
    const safeMainCareer = escapeHtml(MAIN_CAREER_LABEL[mainCareer] || mainCareer)
    const safePrivates = escapeHtml(String(privatesPerWeek))
    const safeGroups = escapeHtml(String(groupsPerWeek))
    const safeEquipment = escapeHtml((equipment || []).join(', '))
    const safeTraining = escapeHtml(trainingBackground).replace(/\n/g, '<br>')
    const safePhysics = physicsBackground
      ? escapeHtml(physicsBackground).replace(/\n/g, '<br>')
      : '<em style="color:#888;">(none provided)</em>'
    const safePP101 = escapeHtml(PP101_LABEL[completedPP101] || completedPP101)
    const safeGoals = escapeHtml(goalsAndInterest).replace(/\n/g, '<br>')
    const safePaymentPlan = escapeHtml(PAYMENT_PLAN_LABEL[paymentPlan] || paymentPlan)

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1C1A17; line-height: 1.6;">
        <p style="margin: 0 0 1rem; font-size: 0.85rem; color: #666; text-transform: uppercase; letter-spacing: 0.08em;">New PP-301 application</p>
        <p style="margin: 0 0 0.5rem;"><strong>Name:</strong> ${safeName}</p>
        <p style="margin: 0 0 0.5rem;"><strong>Email:</strong> <a href="mailto:${safeEmail}">${safeEmail}</a></p>
        <p style="margin: 0 0 0.5rem;"><strong>City / region:</strong> ${safeCity}</p>
        <p style="margin: 0 0 0.5rem;"><strong>Years teaching:</strong> ${safeYears}</p>
        <p style="margin: 0 0 0.5rem;"><strong>Pilates as main career:</strong> ${safeMainCareer}</p>
        <p style="margin: 0 0 0.5rem;"><strong>Privates per week (avg):</strong> ${safePrivates}</p>
        <p style="margin: 0 0 0.5rem;"><strong>Group classes per week (avg):</strong> ${safeGroups}</p>
        <p style="margin: 0 0 0.5rem;"><strong>Equipment access:</strong> ${safeEquipment}</p>
        <p style="margin: 0 0 0.5rem;"><strong>Completed Pilates Physics 101:</strong> ${safePP101}</p>
        <p style="margin: 0 0 0.5rem;"><strong>Payment plan preference:</strong> ${safePaymentPlan}</p>
        <p style="margin: 1.5rem 0 0.5rem;"><strong>Training, certifications, workshops:</strong></p>
        <div style="padding: 1rem; background: #f6f4ef; border-left: 3px solid #a48b5a;">${safeTraining}</div>
        <p style="margin: 1.5rem 0 0.5rem;"><strong>Physics, math, or engineering background:</strong></p>
        <div style="padding: 1rem; background: #f6f4ef; border-left: 3px solid #a48b5a;">${safePhysics}</div>
        <p style="margin: 1.5rem 0 0.5rem;"><strong>Why interested in PP-301 and what they hope to get out of it:</strong></p>
        <div style="padding: 1rem; background: #f6f4ef; border-left: 3px solid #a48b5a;">${safeGoals}</div>
        <p style="margin: 1.5rem 0 0; font-size: 0.85rem; color: #666;">Applicant acknowledged participation expectations. Reply directly to this email to respond to ${safeName}.</p>
      </div>
    `.trim()

    const text = `New PP-301 application\n\nName: ${name}\nEmail: ${email}\nCity / region: ${city || '(not provided)'}\nYears teaching: ${YEARS_LABEL[yearsTeaching] || yearsTeaching}\nPilates as main career: ${MAIN_CAREER_LABEL[mainCareer] || mainCareer}\nPrivates per week (avg): ${privatesPerWeek}\nGroup classes per week (avg): ${groupsPerWeek}\nEquipment access: ${(equipment || []).join(', ')}\nCompleted Pilates Physics 101: ${PP101_LABEL[completedPP101] || completedPP101}\nPayment plan preference: ${PAYMENT_PLAN_LABEL[paymentPlan] || paymentPlan}\n\nTraining, certifications, workshops:\n${trainingBackground}\n\nPhysics, math, or engineering background:\n${physicsBackground || '(none provided)'}\n\nWhy interested in PP-301 and what they hope to get out of it:\n${goalsAndInterest}\n\nApplicant acknowledged participation expectations.\nReply directly to this email to respond.`

    const { data, error } = await getResend().emails.send({
      from: FROM,
      to,
      subject: `PP-301 Application: ${name}`,
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
    ? 'Your PP-301 application — Pilates Physics'
    : 'Thanks for reaching out — Pilates Physics'

  const bodyHtml = isApplication
    ? `<p>Thanks for applying to Pilates Physics 301 — your application came through.</p>
       <p>I review every application personally, and you'll hear back from me within a week.</p>`
    : `<p>Thanks for reaching out — your inquiry came through, and I'll get back to you within a few days.</p>`

  const bodyText = isApplication
    ? `Thanks for applying to Pilates Physics 301 — your application came through.\n\nI review every application personally, and you'll hear back from me within a week.`
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

export async function sendSurveyFeedbackEmail({
  workshopTitle,
  workshopDate,
  name,
  email,
  years_teaching,
  nps_score,
  change_this_week,
  aha_moment,
  valuable_sections,
  rushed_section,
  confusing,
  length_feedback,
  share_permission,
  next_workshop_topic,
  anything_else,
}) {
  const to = process.env.CONTACT_TO_EMAIL || 'kaleen@pilatesphysics.com'

  const safeTitle = escapeHtml(workshopTitle)
  const safeDate = escapeHtml(workshopDate)
  const safeName = escapeHtml(name)
  const safeEmail = escapeHtml(email)
  const safeYears = escapeHtml(years_teaching)
  const safeNps = escapeHtml(String(nps_score))
  const safeValuable = escapeHtml((valuable_sections || []).join(', '))
  const safeRushed = escapeHtml(rushed_section)
  const safeLength = escapeHtml(length_feedback)
  const safeShare = escapeHtml(share_permission)
  const safeChange = escapeHtml(change_this_week).replace(/\n/g, '<br>')
  const safeAha = escapeHtml(aha_moment).replace(/\n/g, '<br>')
  const safeConfusing = escapeHtml(confusing).replace(/\n/g, '<br>')
  const safeNextTopic = next_workshop_topic
    ? escapeHtml(next_workshop_topic).replace(/\n/g, '<br>')
    : null
  const safeAnythingElse = anything_else
    ? escapeHtml(anything_else).replace(/\n/g, '<br>')
    : null

  const quote = (content) =>
    `<div style="padding: 1rem; background: #f6f4ef; border-left: 3px solid #a48b5a;">${content}</div>`

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1C1A17; line-height: 1.6;">
      <p style="margin: 0 0 1rem; font-size: 0.85rem; color: #666; text-transform: uppercase; letter-spacing: 0.08em;">New survey response — ${safeTitle} (${safeDate})</p>
      <p style="margin: 0 0 0.5rem;"><strong>Name:</strong> ${safeName}</p>
      <p style="margin: 0 0 0.5rem;"><strong>Email:</strong> <a href="mailto:${safeEmail}">${safeEmail}</a></p>
      <p style="margin: 0 0 0.5rem;"><strong>Years teaching:</strong> ${safeYears}</p>
      <p style="margin: 0 0 0.5rem;"><strong>NPS:</strong> ${safeNps} / 10</p>
      <p style="margin: 1.5rem 0 0.5rem;"><strong>Most valuable sections:</strong> ${safeValuable}</p>
      <p style="margin: 0 0 0.5rem;"><strong>Section that felt rushed:</strong> ${safeRushed}</p>
      <p style="margin: 0 0 0.5rem;"><strong>Length feedback:</strong> ${safeLength}</p>
      <p style="margin: 0 0 0.5rem;"><strong>Share permission:</strong> ${safeShare}</p>
      <p style="margin: 1.5rem 0 0.5rem;"><strong>What's going to change how they teach this week:</strong></p>
      ${quote(safeChange)}
      <p style="margin: 1.5rem 0 0.5rem;"><strong>Favorite aha moment:</strong></p>
      ${quote(safeAha)}
      <p style="margin: 1.5rem 0 0.5rem;"><strong>Confusing / wants explained differently:</strong></p>
      ${quote(safeConfusing)}
      ${safeNextTopic ? `<p style="margin: 1.5rem 0 0.5rem;"><strong>What they want to learn next:</strong></p>${quote(safeNextTopic)}` : ''}
      ${safeAnythingElse ? `<p style="margin: 1.5rem 0 0.5rem;"><strong>Anything else:</strong></p>${quote(safeAnythingElse)}` : ''}
      <p style="margin: 1.5rem 0 0; font-size: 0.85rem; color: #666;">Reply directly to this email to respond to ${safeName}.</p>
    </div>
  `.trim()

  const textLines = [
    `New survey response — ${workshopTitle} (${workshopDate})`,
    '',
    `Name: ${name}`,
    `Email: ${email}`,
    `Years teaching: ${years_teaching}`,
    `NPS: ${nps_score} / 10`,
    '',
    `Most valuable sections: ${(valuable_sections || []).join(', ')}`,
    `Section that felt rushed: ${rushed_section}`,
    `Length feedback: ${length_feedback}`,
    `Share permission: ${share_permission}`,
    '',
    `What's going to change how they teach this week:`,
    change_this_week,
    '',
    `Favorite aha moment:`,
    aha_moment,
    '',
    `Confusing / wants explained differently:`,
    confusing,
  ]
  if (next_workshop_topic) {
    textLines.push('', `What they want to learn next:`, next_workshop_topic)
  }
  if (anything_else) {
    textLines.push('', `Anything else:`, anything_else)
  }
  const text = textLines.join('\n')

  const { data, error } = await getResend().emails.send({
    from: FROM,
    to,
    subject: `Survey response: ${workshopTitle} — ${name} (NPS ${nps_score})`,
    html,
    text,
    replyTo: email,
  })
  if (error) throw new Error(`Resend send failed: ${error.message ?? JSON.stringify(error)}`)
  return data
}
