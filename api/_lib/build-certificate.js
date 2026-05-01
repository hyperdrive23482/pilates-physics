import PDFDocument from 'pdfkit'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Read logo once at module load and reuse across invocations.
const LOGO_BUFFER = readFileSync(
  path.join(__dirname, '../_assets/pilates-physics-logo.png')
)

const INSTRUCTOR_NAME = 'Kaleen Canevari'

// US Letter landscape (points; 72 points = 1 inch).
const PAGE_WIDTH = 792
const PAGE_HEIGHT = 612
const MARGIN = 54 // 0.75 in
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2

const COLOR_INK = '#1C1A17'
const COLOR_MUTED = '#6B6B6B'

function formatDateTime(scheduledAt) {
  if (!scheduledAt) return null
  const d = new Date(scheduledAt)
  if (Number.isNaN(d.getTime())) return null
  const dateStr = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(d)
  const timeStr = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  }).format(d)
  return { dateStr, timeStr }
}

function truncate(text, max) {
  if (!text || text.length <= max) return text
  return text.slice(0, max).replace(/\s+\S*$/, '') + '…'
}

/**
 * Build a Certificate of Completion PDF.
 *
 * @param {object} args
 * @param {object} args.webinar  - { title, subtitle, description, scheduled_at, duration_min }
 * @param {string} args.participantName - display name for the participant
 * @returns {PDFKit.PDFDocument} an unfinalized PDFDocument; caller pipes + ends it
 */
export function buildCertificate({ webinar, participantName }) {
  const doc = new PDFDocument({
    size: 'LETTER',
    layout: 'landscape',
    margins: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN },
    info: {
      Title: `Certificate of Completion — ${webinar.title}`,
      Author: 'Pilates Physics',
      Subject: 'Certificate of Completion',
    },
  })

  // === Logo at top, centered ===
  const logoHeight = 90 // ~1.25 in
  doc.image(LOGO_BUFFER, MARGIN, MARGIN, {
    fit: [CONTENT_WIDTH, logoHeight],
    align: 'center',
    valign: 'top',
  })

  let y = MARGIN + logoHeight + 18

  // === Eyebrow ===
  doc
    .font('Helvetica-Bold')
    .fontSize(11)
    .fillColor(COLOR_MUTED)
    .text('CERTIFICATE OF COMPLETION', MARGIN, y, {
      width: CONTENT_WIDTH,
      align: 'center',
      characterSpacing: 4,
    })
  y = doc.y + 14

  // === Awarded to ===
  doc
    .font('Helvetica')
    .fontSize(11)
    .fillColor(COLOR_MUTED)
    .text('Awarded to', MARGIN, y, { width: CONTENT_WIDTH, align: 'center' })
  y = doc.y + 6

  // === Participant name ===
  doc
    .font('Times-Bold')
    .fontSize(32)
    .fillColor(COLOR_INK)
    .text(participantName, MARGIN, y, { width: CONTENT_WIDTH, align: 'center' })
  y = doc.y + 12

  // === for completing ===
  doc
    .font('Helvetica')
    .fontSize(11)
    .fillColor(COLOR_MUTED)
    .text('for completing', MARGIN, y, { width: CONTENT_WIDTH, align: 'center' })
  y = doc.y + 6

  // === Workshop title ===
  doc
    .font('Times-Bold')
    .fontSize(22)
    .fillColor(COLOR_INK)
    .text(webinar.title, MARGIN, y, { width: CONTENT_WIDTH, align: 'center' })
  y = doc.y

  // === Subtitle (optional) ===
  if (webinar.subtitle) {
    y += 4
    doc
      .font('Helvetica-Oblique')
      .fontSize(12)
      .fillColor(COLOR_MUTED)
      .text(webinar.subtitle, MARGIN, y, {
        width: CONTENT_WIDTH,
        align: 'center',
      })
    y = doc.y
  }
  y += 14

  // === Date / time / duration ===
  const dt = formatDateTime(webinar.scheduled_at)
  const parts = []
  if (dt) parts.push(`${dt.dateStr} · ${dt.timeStr}`)
  if (webinar.duration_min) parts.push(`${webinar.duration_min} minutes`)
  if (parts.length > 0) {
    doc
      .font('Helvetica')
      .fontSize(11)
      .fillColor(COLOR_INK)
      .text(parts.join(' · '), MARGIN, y, {
        width: CONTENT_WIDTH,
        align: 'center',
      })
    y = doc.y + 4
  }

  // === Instructor ===
  doc
    .font('Helvetica')
    .fontSize(11)
    .fillColor(COLOR_INK)
    .text(`Instructor: ${INSTRUCTOR_NAME}`, MARGIN, y, {
      width: CONTENT_WIDTH,
      align: 'center',
    })
  y = doc.y + 14

  // === Description (truncated) ===
  if (webinar.description) {
    const desc = truncate(webinar.description, 360)
    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor(COLOR_MUTED)
      .text(desc, MARGIN + 60, y, {
        width: CONTENT_WIDTH - 120,
        align: 'center',
        lineGap: 2,
      })
  }

  // === Footer ===
  doc
    .font('Helvetica')
    .fontSize(9)
    .fillColor(COLOR_MUTED)
    .text('pilatesphysics.com', MARGIN, PAGE_HEIGHT - MARGIN - 10, {
      width: CONTENT_WIDTH,
      align: 'center',
    })

  return doc
}
