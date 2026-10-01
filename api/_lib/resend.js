import { Resend } from 'resend'
import fs from 'node:fs/promises'
import path from 'node:path'
import { SCHOLARSHIP_COURSES, PATH_STAGE_LABEL } from './scholarship-config.js'

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
  // The magic-link template carries a 6-digit code block for Supabase's hosted
  // email (between the otp-start and otp-end markers). This sender only has the
  // hashed token, not the raw code, so strip that block. The post-purchase
  // email stays link-only.
  const html = raw
    .replace(/<!-- otp-start -->[\s\S]*?<!-- otp-end -->/g, '')
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
  scholarshipCode,
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
      ${scholarshipCode ? `<p style="margin: 0 0 0.5rem;"><strong>Scholarship:</strong> ${escapeHtml(scholarshipCode)}</p>` : ''}
      <p style="margin: 1.5rem 0 0; font-size: 0.85rem; color: #666;">Stripe session: ${safeSession}</p>
    </div>
  `.trim()

  const text = `New course purchase\n\nCourse: ${workshopTitle || '(unknown course)'}\nAmount: ${amountFormatted}\nName: ${fullName}\nEmail: ${email}\nCustomer type: ${stateLabel}${scholarshipCode ? `\nScholarship: ${scholarshipCode}` : ''}\n\nStripe session: ${sessionId || ''}`

  const { data, error } = await getResend().emails.send({
    from: FROM,
    to,
    subject: `New ${scholarshipCode ? 'scholarship ' : ''}purchase: ${workshopTitle || 'course'} — ${fullName}`,
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

// /mentorship reserve form. Keep in step with src/pages/Mentorship.jsx and
// docs/mentorship-program-spec.md.
const MENTORSHIP_YEARS_LABEL = {
  '<1': 'Less than 1 year',
  '1-2': '1 to 2 years',
  '3-5': '3 to 5 years',
  '5+': 'More than 5 years',
}
const MENTORSHIP_PLAN_LABEL = {
  full: '$399 one-time payment',
  two: '2 payments of $229 ($458 total)',
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

  if (kind === 'mentorship') {
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
      goalsAndInterest,
      paymentPlan,
      remoAcknowledgement,
    } = payload
    const remoLabel = remoAcknowledgement ? 'Yes' : 'No'
    const yearsLabel = MENTORSHIP_YEARS_LABEL[yearsTeaching] || yearsTeaching
    const planLabel = MENTORSHIP_PLAN_LABEL[paymentPlan] || paymentPlan
    const careerLabel = MAIN_CAREER_LABEL[mainCareer] || mainCareer
    const equipmentLabel = (equipment || []).join(', ')
    const safeName = escapeHtml(name)
    const safeEmail = escapeHtml(email)
    const safeCity = escapeHtml(city || '(not provided)')
    const safeYears = escapeHtml(yearsLabel)
    const safeCareer = escapeHtml(careerLabel)
    const safePrivates = escapeHtml(String(privatesPerWeek))
    const safeGroups = escapeHtml(String(groupsPerWeek))
    const safeEquipment = escapeHtml(equipmentLabel)
    const safeTraining = escapeHtml(trainingBackground).replace(/\n/g, '<br>')
    const safeGoals = escapeHtml(goalsAndInterest).replace(/\n/g, '<br>')
    const safePlan = escapeHtml(planLabel)

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1C1A17; line-height: 1.6;">
        <p style="margin: 0 0 1rem; font-size: 0.85rem; color: #666; text-transform: uppercase; letter-spacing: 0.08em;">New mentorship application from /mentorship/apply</p>
        <p style="margin: 0 0 0.5rem;"><strong>Name:</strong> ${safeName}</p>
        <p style="margin: 0 0 0.5rem;"><strong>Email:</strong> <a href="mailto:${safeEmail}">${safeEmail}</a></p>
        <p style="margin: 0 0 0.5rem;"><strong>City / region:</strong> ${safeCity}</p>
        <p style="margin: 0 0 0.5rem;"><strong>Years teaching:</strong> ${safeYears}</p>
        <p style="margin: 0 0 0.5rem;"><strong>Pilates as main career:</strong> ${safeCareer}</p>
        <p style="margin: 0 0 0.5rem;"><strong>Privates per week:</strong> ${safePrivates}</p>
        <p style="margin: 0 0 0.5rem;"><strong>Group classes per week:</strong> ${safeGroups}</p>
        <p style="margin: 0 0 0.5rem;"><strong>Equipment:</strong> ${safeEquipment}</p>
        <p style="margin: 0 0 0.5rem;"><strong>Payment option:</strong> ${safePlan}</p>
        <p style="margin: 0 0 0.5rem;"><strong>Excited to use Remo Educator:</strong> ${remoLabel}</p>
        <p style="margin: 1.5rem 0 0.5rem;"><strong>Training and certifications:</strong></p>
        <div style="padding: 1rem; background: #f6f4ef; border-left: 3px solid #a48b5a;">${safeTraining}</div>
        <p style="margin: 1.5rem 0 0.5rem;"><strong>Why this program and what they want out of it:</strong></p>
        <div style="padding: 1rem; background: #f6f4ef; border-left: 3px solid #a48b5a;">${safeGoals}</div>
        <p style="margin: 1.5rem 0 0; font-size: 0.85rem; color: #666;">Applicant confirmed the participation note. On acceptance, send ${safeName} a Stripe invoice for the option above. Reply directly to this email to respond.</p>
      </div>
    `.trim()

    const text = `New mentorship application from /mentorship/apply\n\nName: ${name}\nEmail: ${email}\nCity / region: ${city || '(not provided)'}\nYears teaching: ${yearsLabel}\nPilates as main career: ${careerLabel}\nPrivates per week: ${privatesPerWeek}\nGroup classes per week: ${groupsPerWeek}\nEquipment: ${equipmentLabel}\nPayment option: ${planLabel}\nExcited to use Remo Educator: ${remoLabel}\n\nTraining and certifications:\n${trainingBackground}\n\nWhy this program and what they want out of it:\n${goalsAndInterest}\n\nApplicant confirmed the participation note. On acceptance, send a Stripe invoice for the option above. Reply directly to this email to respond.`

    const { data, error } = await getResend().emails.send({
      from: FROM,
      to,
      subject: `Mentorship application: ${name} (${planLabel})`,
      html,
      text,
      replyTo: email,
    })
    if (error) throw new Error(`Resend send failed: ${error.message ?? JSON.stringify(error)}`)
    return data
  }

  if (kind === 'scholarship') {
    const {
      name,
      email,
      city,
      courses,
      pathStage,
      pathStageOther,
      story,
      teachingImpact,
      previousCount,
      adminUrl,
    } = payload
    const coursesLabel = (courses || [])
      .map((c) => SCHOLARSHIP_COURSES[c]?.label ?? c)
      .join(', ')
    const stageLabel =
      pathStage === 'other' && pathStageOther
        ? `Other: ${pathStageOther}`
        : PATH_STAGE_LABEL[pathStage] || pathStage
    const repeatNote = previousCount
      ? `This email has applied ${previousCount} time${previousCount === 1 ? '' : 's'} before.`
      : ''
    const safeStory = escapeHtml(story).replace(/\n/g, '<br>')
    const safeImpact = escapeHtml(teachingImpact).replace(/\n/g, '<br>')

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1C1A17; line-height: 1.6;">
        <p style="margin: 0 0 1rem; font-size: 0.85rem; color: #666; text-transform: uppercase; letter-spacing: 0.08em;">New scholarship application from /scholarship</p>
        <p style="margin: 0 0 0.5rem;"><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p style="margin: 0 0 0.5rem;"><strong>Email:</strong> <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></p>
        <p style="margin: 0 0 0.5rem;"><strong>City / region:</strong> ${escapeHtml(city || '(not provided)')}</p>
        <p style="margin: 0 0 0.5rem;"><strong>Courses:</strong> ${escapeHtml(coursesLabel)}</p>
        <p style="margin: 0 0 0.5rem;"><strong>Where they are:</strong> ${escapeHtml(stageLabel)}</p>
        ${repeatNote ? `<p style="margin: 0 0 0.5rem; color: #a2462b;"><strong>${escapeHtml(repeatNote)}</strong></p>` : ''}
        <p style="margin: 1.5rem 0 0.5rem;"><strong>Their path, and what has made access harder:</strong></p>
        <div style="padding: 1rem; background: #f6f4ef; border-left: 3px solid #a48b5a;">${safeStory}</div>
        <p style="margin: 1.5rem 0 0.5rem;"><strong>What would change in their teaching:</strong></p>
        <div style="padding: 1rem; background: #f6f4ef; border-left: 3px solid #a48b5a;">${safeImpact}</div>
        <p style="margin: 1.5rem 0 0; font-size: 0.85rem; color: #666;">Approve or decline at <a href="${escapeHtml(adminUrl)}">${escapeHtml(adminUrl)}</a>. Approving sends the codes automatically.</p>
      </div>
    `.trim()

    const text = `New scholarship application from /scholarship\n\nName: ${name}\nEmail: ${email}\nCity / region: ${city || '(not provided)'}\nCourses: ${coursesLabel}\nWhere they are: ${stageLabel}\n${repeatNote ? `${repeatNote}\n` : ''}\nTheir path, and what has made access harder:\n${story}\n\nWhat would change in their teaching:\n${teachingImpact}\n\nApprove or decline at ${adminUrl}. Approving sends the codes automatically.`

    const { data, error } = await getResend().emails.send({
      from: FROM,
      to,
      subject: `Scholarship application: ${name}`,
      html,
      text,
      replyTo: email,
    })
    if (error) throw new Error(`Resend send failed: ${error.message ?? JSON.stringify(error)}`)
    return data
  }

  throw new Error(`Unknown inquiry kind: ${kind}`)
}

// Kaleen's personal note, as paragraphs: a blank line starts a new paragraph,
// a single line break stays a line break.
function noteParagraphs(note) {
  return (note ?? '')
    .replace(/\r\n/g, '\n')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
}

// The scholarship approval email, built without sending so the admin page can
// preview exactly what goes out. codes is [{ course, code, expires_at }];
// siteUrl builds the course links. personalNote, when given, replaces the
// stock opening line.
export function buildScholarshipApprovalEmail({ name, codes, siteUrl, personalNote }) {
  const note = noteParagraphs(personalNote)
  const expires = new Date(codes[0].expires_at).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
  const lines = codes.map((c) => {
    const course = SCHOLARSHIP_COURSES[c.course]
    return {
      label: course?.label ?? c.course,
      price: `$${((course?.targetCents ?? 0) / 100).toFixed(0)} USD`,
      url: `${siteUrl}${course?.path ?? ''}`,
      code: c.code,
    }
  })
  const plural = codes.length > 1

  const htmlCodes = lines
    .map(
      (l) => `
      <div style="margin: 0 0 1rem; padding: 1rem; background: #f6f4ef; border-left: 3px solid #a48b5a;">
        <p style="margin: 0 0 0.25rem;"><strong>${escapeHtml(l.label)}</strong> for ${escapeHtml(l.price)}</p>
        <p style="margin: 0 0 0.25rem; font-family: ui-monospace, Menlo, monospace; font-size: 1.05rem; letter-spacing: 0.05em;">${escapeHtml(l.code)}</p>
        <p style="margin: 0;"><a href="${escapeHtml(l.url)}">${escapeHtml(l.url)}</a></p>
      </div>`
    )
    .join('')

  const openingHtml = note.length
    ? `${note.map((p) => `<p>${escapeHtml(p).replace(/\n/g, '<br>')}</p>`).join('\n      ')}
      <p>Your scholarship is approved.</p>`
    : '<p>Thank you for applying. I loved reading your application, and your scholarship is approved.</p>'
  const openingText = note.length
    ? `${note.join('\n\n')}\n\nYour scholarship is approved.`
    : 'Thank you for applying. I loved reading your application, and your scholarship is approved.'

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1C1A17; line-height: 1.6; max-width: 560px;">
      <p>Hi ${escapeHtml(name)},</p>
      ${openingHtml}
      <p>Here ${plural ? 'are your codes' : 'is your code'}. Open the course page, click to register, and enter the code at checkout under "Add promotion code".</p>
      ${htmlCodes}
      <p>${plural ? 'Each code works once, for its own course' : 'The code works once'}, and ${plural ? 'they expire' : 'it expires'} on ${escapeHtml(expires)}. Please keep ${plural ? 'them' : 'it'} to yourself, since every code is tied to one person's application.</p>
      <p>If anything goes sideways at checkout, reply to this email and I will sort it out.</p>
      <p style="margin-top: 1.5rem;">Kaleen</p>
    </div>
  `.trim()

  const textCodes = lines.map((l) => `${l.label} for ${l.price}\nCode: ${l.code}\n${l.url}`).join('\n\n')
  const text = `Hi ${name},\n\n${openingText}\n\nHere ${plural ? 'are your codes' : 'is your code'}. Open the course page, click to register, and enter the code at checkout under "Add promotion code".\n\n${textCodes}\n\n${plural ? 'Each code works once, for its own course' : 'The code works once'}, and ${plural ? 'they expire' : 'it expires'} on ${expires}. Please keep ${plural ? 'them' : 'it'} to yourself, since every code is tied to one person's application.\n\nIf anything goes sideways at checkout, reply to this email and I will sort it out.\n\nKaleen`

  return { subject: 'Your Pilates Physics scholarship', html, text }
}

// Sent when Kaleen approves a scholarship in /admin/scholarships.
export async function sendScholarshipApproval({ to, name, codes, siteUrl, personalNote }) {
  const replyTo = process.env.CONTACT_TO_EMAIL || 'kaleen@pilatesphysics.com'
  const { subject, html, text } = buildScholarshipApprovalEmail({ name, codes, siteUrl, personalNote })
  const { data, error } = await getResend().emails.send({
    from: FROM,
    to,
    subject,
    html,
    text,
    replyTo,
  })
  if (error) throw new Error(`Resend send failed: ${error.message ?? JSON.stringify(error)}`)
  return data
}

const ACK_COPY = {
  application: {
    subject: 'Your PP-301 application — Pilates Physics',
    html: `<p>Thanks for applying to Pilates Physics 301 — your application came through.</p>
       <p>I review every application personally, and you'll hear back from me within a week.</p>`,
    text: `Thanks for applying to Pilates Physics 301 — your application came through.\n\nI review every application personally, and you'll hear back from me within a week.`,
  },
  mentorship: {
    subject: 'Your mentorship application. Pilates Physics',
    html: `<p>Thanks for applying to the 8-week mentorship. Your application came through.</p>
       <p>I read every application personally, in the order they arrive, and you will hear back from me within a week. If it is a fit, your invoice for the payment option you picked comes with the acceptance, and your place is confirmed once it is paid.</p>`,
    text: `Thanks for applying to the 8-week mentorship. Your application came through.\n\nI read every application personally, in the order they arrive, and you will hear back from me within a week. If it is a fit, your invoice for the payment option you picked comes with the acceptance, and your place is confirmed once it is paid.`,
  },
  scholarship: {
    subject: 'Your scholarship application. Pilates Physics',
    html: `<p>Thank you for applying for a Pilates Physics scholarship. Your application came through.</p>
       <p>I read every application personally and you will hear back from me within a week. If it is approved, your code comes in that email, along with how to use it at checkout.</p>`,
    text: `Thank you for applying for a Pilates Physics scholarship. Your application came through.\n\nI read every application personally and you will hear back from me within a week. If it is approved, your code comes in that email, along with how to use it at checkout.`,
  },
  inquiry: {
    subject: 'Thanks for reaching out — Pilates Physics',
    html: `<p>Thanks for reaching out — your inquiry came through, and I'll get back to you within a few days.</p>`,
    text: `Thanks for reaching out — your inquiry came through, and I'll get back to you within a few days.`,
  },
}

export async function sendInquiryAcknowledgement({ kind, to, name }) {
  const safeName = escapeHtml(name)

  const copy = ACK_COPY[kind] ?? ACK_COPY.inquiry
  const { subject, html: bodyHtml, text: bodyText } = copy

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

function formatResponseForEmail(question, value) {
  if (value == null) return ''
  switch (question.type) {
    case 'nps':
      return `${value} / 10`
    case 'multi_select':
      return Array.isArray(value) ? value.join(', ') : String(value)
    default:
      return String(value)
  }
}

export async function sendSurveyFeedbackEmail({
  workshopTitle,
  workshopDate,
  name,
  email,
  questions,
  responses,
  recipientEmail,
}) {
  const to = recipientEmail || process.env.CONTACT_TO_EMAIL || 'kaleen@pilatesphysics.com'

  const safeTitle = escapeHtml(workshopTitle)
  const safeDate = escapeHtml(workshopDate)
  const safeName = escapeHtml(name)
  const safeEmail = escapeHtml(email)

  const quote = (content) =>
    `<div style="padding: 1rem; background: #f6f4ef; border-left: 3px solid #a48b5a;">${content}</div>`

  const npsQuestion = (questions || []).find((q) => q.type === 'nps')
  const npsValue = npsQuestion ? responses?.[npsQuestion.id] : null

  const htmlBlocks = []
  const textLines = [
    `New survey response — ${workshopTitle} (${workshopDate})`,
    '',
    `Name: ${name}`,
    `Email: ${email}`,
  ]

  for (const q of questions || []) {
    const raw = responses?.[q.id]
    const present =
      raw !== undefined &&
      raw !== null &&
      !(typeof raw === 'string' && raw.trim() === '') &&
      !(Array.isArray(raw) && raw.length === 0)
    if (!present) continue

    const formatted = formatResponseForEmail(q, raw)
    const safeLabel = escapeHtml(q.label)
    const safeValue = escapeHtml(formatted)

    if (q.type === 'long_text') {
      htmlBlocks.push(`<p style="margin: 1.5rem 0 0.5rem;"><strong>${safeLabel}</strong></p>${quote(safeValue.replace(/\n/g, '<br>'))}`)
    } else {
      htmlBlocks.push(`<p style="margin: 0 0 0.5rem;"><strong>${safeLabel}</strong> ${safeValue}</p>`)
    }

    textLines.push('', q.label, formatted)
  }

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1C1A17; line-height: 1.6;">
      <p style="margin: 0 0 1rem; font-size: 0.85rem; color: #666; text-transform: uppercase; letter-spacing: 0.08em;">New survey response from ${safeTitle} (${safeDate})</p>
      <p style="margin: 0 0 0.5rem;"><strong>Name:</strong> ${safeName}</p>
      <p style="margin: 0 0 1rem;"><strong>Email:</strong> <a href="mailto:${safeEmail}">${safeEmail}</a></p>
      ${htmlBlocks.join('\n      ')}
      <p style="margin: 1.5rem 0 0; font-size: 0.85rem; color: #666;">Reply directly to this email to respond to ${safeName}.</p>
    </div>
  `.trim()

  const subject = npsValue != null
    ? `Survey response: ${workshopTitle} from ${name} (NPS ${npsValue})`
    : `Survey response: ${workshopTitle} from ${name}`

  const { data, error } = await getResend().emails.send({
    from: FROM,
    to,
    subject,
    html,
    text: textLines.join('\n'),
    replyTo: email,
  })
  if (error) throw new Error(`Resend send failed: ${error.message ?? JSON.stringify(error)}`)
  return data
}

// The recovery email from api/offer/recover.js.
//
// Two shapes, one function, because the alternative is sending nothing to the
// person whose window already closed -- and they were just told to check their
// inbox. An inbox that never fills is the dead end that route exists to remove.
//
// Inline HTML rather than a template file, following sendContactAcknowledgement
// above. The magic-link template is the exception in this file, and it exists
// only because Supabase's hosted email shares it.
export async function sendOfferLinkEmail({ to, url, deadlineLabel, expired = false }) {
  const safeUrl = escapeHtml(url)
  const safeDeadline = escapeHtml(deadlineLabel)

  const subject = expired
    ? 'Your $39 window has closed — How a Reformer Works'
    : 'Your link to How a Reformer Works for $39'

  const bodyHtml = expired
    ? `<p>Your $39 window closed on ${safeDeadline}.</p>
       <p>The course is $69. Nothing about it has changed — every module, the
       calculator, and the inspection checklist are all still included, exactly
       as they were.</p>`
    : `<p>Here is your link. It works until <strong>${safeDeadline}</strong>, and
       after that the course is $69 — same course, same everything.</p>`

  const bodyText = expired
    ? `Your $39 window closed on ${deadlineLabel}.

The course is $69. Nothing about it has changed - every module, the calculator, and the inspection checklist are all still included, exactly as they were.`
    : `Here is your link. It works until ${deadlineLabel}, and after that the course is $69 - same course, same everything.`

  const cta = expired ? 'See the course' : 'Open your $39 link'

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1C1A17; line-height: 1.6; max-width: 560px;">
      <p>Hi,</p>
      ${bodyHtml}
      <p style="margin: 1.5rem 0;">
        <a href="${safeUrl}" style="display: inline-block; padding: 0.75rem 1.5rem; background: #1C1A17; color: #fff; text-decoration: none; border-radius: 2px;">${cta}</a>
      </p>
      <p style="margin: 1.5rem 0 0; font-size: 0.85rem; color: #666;">
        If the button does not work, paste this into your browser:<br>
        <a href="${safeUrl}">${safeUrl}</a>
      </p>
      <p style="margin-top: 1.5rem;">— Kaleen</p>
    </div>
  `.trim()

  const text = `Hi,

${bodyText}

${url}

- Kaleen`

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
