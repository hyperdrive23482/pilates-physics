import PDFDocument from 'pdfkit'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const LOGO_BUFFER = readFileSync(
  path.join(__dirname, '../_assets/pilates-physics-logo.png')
)

const INSTRUCTOR_NAME = 'Kaleen Canevari'

// US Letter landscape (points; 72 = 1 inch). 11 x 8.5 in.
const PAGE_WIDTH = 792
const PAGE_HEIGHT = 612

// Layout
const CORNER_INSET = 27
const CORNER_LEN = 24
const CORNER_STROKE = 1.5

const SIDE_INSET = 84
const TOP_INSET = 60
const BOTTOM_INSET = 56
const CONTENT_WIDTH = PAGE_WIDTH - SIDE_INSET * 2

// Colors
const COLOR_INK = '#1a1814'
const COLOR_INK_SOFT = '#4a4540'
const COLOR_INK_FAINT = '#8a8680'
const COLOR_PAPER = '#f5f1e8'

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

function drawCornerMarks(doc) {
  doc.lineWidth(CORNER_STROKE).strokeColor(COLOR_INK)
  const i = CORNER_INSET
  const l = CORNER_LEN
  // Top-left
  doc.moveTo(i, i).lineTo(i + l, i).stroke()
  doc.moveTo(i, i).lineTo(i, i + l).stroke()
  // Top-right
  doc.moveTo(PAGE_WIDTH - i, i).lineTo(PAGE_WIDTH - i - l, i).stroke()
  doc.moveTo(PAGE_WIDTH - i, i).lineTo(PAGE_WIDTH - i, i + l).stroke()
  // Bottom-left
  doc.moveTo(i, PAGE_HEIGHT - i).lineTo(i + l, PAGE_HEIGHT - i).stroke()
  doc.moveTo(i, PAGE_HEIGHT - i).lineTo(i, PAGE_HEIGHT - i - l).stroke()
  // Bottom-right
  doc
    .moveTo(PAGE_WIDTH - i, PAGE_HEIGHT - i)
    .lineTo(PAGE_WIDTH - i - l, PAGE_HEIGHT - i)
    .stroke()
  doc
    .moveTo(PAGE_WIDTH - i, PAGE_HEIGHT - i)
    .lineTo(PAGE_WIDTH - i, PAGE_HEIGHT - i - l)
    .stroke()
}

export function buildCertificate({ webinar, participantName }) {
  const doc = new PDFDocument({
    size: 'LETTER',
    layout: 'landscape',
    margin: 0,
    info: {
      Title: `Certificate of Completion — ${webinar.title}`,
      Author: 'Pilates Physics',
      Subject: 'Certificate of Completion',
    },
  })

  // Cream paper background (logo PNG has a transparent background, so the
  // cream shows through around the wordmark cleanly).
  doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT).fill(COLOR_PAPER)

  drawCornerMarks(doc)

  // === Logo (PILATES / PHYSICS wordmark) ===
  const logoHeight = 70
  doc.image(LOGO_BUFFER, SIDE_INSET, TOP_INSET, {
    fit: [CONTENT_WIDTH, logoHeight],
    align: 'center',
    valign: 'top',
  })
  let y = TOP_INSET + logoHeight + 28

  // === CERTIFICATE OF COMPLETION ===
  doc
    .font('Helvetica-Bold')
    .fontSize(10.5)
    .fillColor(COLOR_INK_SOFT)
    .text('CERTIFICATE OF COMPLETION', SIDE_INSET, y, {
      width: CONTENT_WIDTH,
      align: 'center',
      characterSpacing: 4,
    })
  y = doc.y + 10

  // === Horizontal rule ===
  const ruleWidth = 60
  const ruleX = (PAGE_WIDTH - ruleWidth) / 2
  doc
    .lineWidth(1.25)
    .strokeColor(COLOR_INK)
    .moveTo(ruleX, y)
    .lineTo(ruleX + ruleWidth, y)
    .stroke()
  y += 18

  // === THIS IS TO CERTIFY THAT ===
  doc
    .font('Helvetica')
    .fontSize(8.5)
    .fillColor(COLOR_INK_FAINT)
    .text('THIS IS TO CERTIFY THAT', SIDE_INSET, y, {
      width: CONTENT_WIDTH,
      align: 'center',
      characterSpacing: 3,
    })
  y = doc.y + 12

  // === Participant name ===
  doc
    .font('Times-Italic')
    .fontSize(58)
    .fillColor(COLOR_INK)
    .text(participantName, SIDE_INSET, y, {
      width: CONTENT_WIDTH,
      align: 'center',
    })
  y = doc.y + 22

  // === HAS SUCCESSFULLY COMPLETED ===
  doc
    .font('Helvetica')
    .fontSize(8.5)
    .fillColor(COLOR_INK_FAINT)
    .text('HAS SUCCESSFULLY COMPLETED', SIDE_INSET, y, {
      width: CONTENT_WIDTH,
      align: 'center',
      characterSpacing: 3,
    })
  y = doc.y + 8

  // === Workshop title ===
  doc
    .font('Times-Roman')
    .fontSize(22)
    .fillColor(COLOR_INK)
    .text(webinar.title, SIDE_INSET, y, {
      width: CONTENT_WIDTH,
      align: 'center',
    })
  y = doc.y

  // === Subtitle (optional) ===
  if (webinar.subtitle) {
    y += 4
    doc
      .font('Times-Italic')
      .fontSize(13)
      .fillColor(COLOR_INK_SOFT)
      .text(webinar.subtitle, SIDE_INSET, y, {
        width: CONTENT_WIDTH,
        align: 'center',
      })
    y = doc.y
  }

  // === Description (italic, narrower) ===
  if (webinar.description) {
    y += 14
    const desc = truncate(webinar.description, 360)
    const descSideInset = SIDE_INSET + 70
    doc
      .font('Times-Italic')
      .fontSize(12)
      .fillColor(COLOR_INK_SOFT)
      .text(desc, descSideInset, y, {
        width: PAGE_WIDTH - descSideInset * 2,
        align: 'center',
        lineGap: 3,
      })
  }

  // === Meta row at bottom (Date / Duration / Instructor) ===
  const metaY = PAGE_HEIGHT - BOTTOM_INSET - 38
  const colWidth = CONTENT_WIDTH / 3
  const cells = [
    { label: 'DATE', value: formatDate(webinar.scheduled_at) || '—' },
    {
      label: 'DURATION',
      value: webinar.duration_min ? `${webinar.duration_min} minutes` : '—',
    },
    { label: 'INSTRUCTOR', value: INSTRUCTOR_NAME },
  ]
  for (let i = 0; i < cells.length; i++) {
    const x = SIDE_INSET + i * colWidth
    doc
      .font('Helvetica-Bold')
      .fontSize(7.5)
      .fillColor(COLOR_INK_FAINT)
      .text(cells[i].label, x, metaY, {
        width: colWidth,
        align: 'center',
        characterSpacing: 2,
      })
    doc
      .font('Times-Roman')
      .fontSize(13)
      .fillColor(COLOR_INK)
      .text(cells[i].value, x, metaY + 14, {
        width: colWidth,
        align: 'center',
      })
  }

  // === Footer URL ===
  doc
    .font('Helvetica')
    .fontSize(8)
    .fillColor(COLOR_INK_FAINT)
    .text('PILATESPHYSICS.COM', 0, PAGE_HEIGHT - BOTTOM_INSET + 8, {
      width: PAGE_WIDTH,
      align: 'center',
      characterSpacing: 3,
      lineBreak: false,
    })

  return doc
}
