import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const TEMPLATE = readFileSync(
  path.join(__dirname, '../_assets/certificate-template.html'),
  'utf-8'
)

const LOGO_DATA_URL =
  'data:image/png;base64,' +
  readFileSync(
    path.join(__dirname, '../_assets/pilates-physics-logo.png')
  ).toString('base64')

const INSTRUCTOR_NAME = 'Kaleen Canevari'
const DESCRIPTION_MAX = 360

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function formatDate(scheduledAt) {
  if (!scheduledAt) return ''
  const d = new Date(scheduledAt)
  if (Number.isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(d)
}

function truncate(text, max) {
  if (!text || text.length <= max) return text
  return text.slice(0, max).replace(/\s+\S*$/, '') + '…'
}

export function renderCertificateHtml({ webinar, participantName }) {
  const subtitle = webinar.subtitle?.trim()
  const description = webinar.description
    ? truncate(webinar.description.trim(), DESCRIPTION_MAX)
    : ''

  const subs = {
    logoUrl: LOGO_DATA_URL,
    participantName: escapeHtml(participantName),
    workshopTitle: escapeHtml(webinar.title),
    workshopSubtitleHtml: subtitle
      ? `<div class="course-subtitle">${escapeHtml(subtitle)}</div>`
      : '',
    workshopDescriptionHtml: description
      ? `<div class="course-desc">${escapeHtml(description)}</div>`
      : '',
    workshopDate: escapeHtml(formatDate(webinar.scheduled_at)),
    workshopDuration: webinar.duration_min
      ? `${escapeHtml(webinar.duration_min)} minutes`
      : '—',
    instructorName: escapeHtml(INSTRUCTOR_NAME),
  }

  return TEMPLATE.replace(/\{\{(\w+)\}\}/g, (_, key) =>
    Object.prototype.hasOwnProperty.call(subs, key) ? subs[key] : ''
  )
}
