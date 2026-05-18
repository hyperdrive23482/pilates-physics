import PDFDocument from 'pdfkit'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const LOGO_BUFFER = readFileSync(
  path.join(__dirname, '../../public/images/logos/black-transparent-logo.png')
)

const SIGNATURE_BUFFER = readFileSync(
  path.join(__dirname, '../../public/images/about/kaleen_signature.png')
)

const FONT_SERIF = readFileSync(
  path.join(__dirname, '../_assets/fonts/SourceSerif4-Regular.ttf')
)
const FONT_SERIF_ITALIC = readFileSync(
  path.join(__dirname, '../_assets/fonts/SourceSerif4-It.ttf')
)
const FONT_SERIF_SEMIBOLD = readFileSync(
  path.join(__dirname, '../_assets/fonts/SourceSerif4-Semibold.ttf')
)
const FONT_MONO_MEDIUM = readFileSync(
  path.join(__dirname, '../_assets/fonts/JetBrainsMono-Medium.ttf')
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

// Date-only columns ('YYYY-MM-DD') represent calendar dates with no
// timezone. Format in UTC so the calendar date doesn't shift when LA is
// behind UTC.
function formatDateOnly(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
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

export function buildCertificate({ workshop, participantName }) {
  const doc = new PDFDocument({
    size: 'LETTER',
    layout: 'landscape',
    margin: 0,
    info: {
      Title: `Certificate of Completion — ${workshop.title}`,
      Author: 'Pilates Physics',
      Subject: 'Certificate of Completion',
    },
  })

  doc.registerFont('Serif', FONT_SERIF)
  doc.registerFont('Serif-Italic', FONT_SERIF_ITALIC)
  doc.registerFont('Serif-Bold', FONT_SERIF_SEMIBOLD)
  doc.registerFont('Mono', FONT_MONO_MEDIUM)

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
    .font('Mono')
    .fontSize(9.5)
    .fillColor(COLOR_INK_SOFT)
    .text('CERTIFICATE OF COMPLETION', SIDE_INSET, y, {
      width: CONTENT_WIDTH,
      align: 'center',
      characterSpacing: 3,
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
    .font('Mono')
    .fontSize(7.5)
    .fillColor(COLOR_INK_FAINT)
    .text('THIS IS TO CERTIFY THAT', SIDE_INSET, y, {
      width: CONTENT_WIDTH,
      align: 'center',
      characterSpacing: 2,
    })
  y = doc.y + 12

  // === Participant name ===
  doc
    .font('Serif-Italic')
    .fontSize(58)
    .fillColor(COLOR_INK)
    .text(participantName, SIDE_INSET, y, {
      width: CONTENT_WIDTH,
      align: 'center',
    })
  y = doc.y + 22

  // === HAS SUCCESSFULLY COMPLETED ===
  doc
    .font('Mono')
    .fontSize(7.5)
    .fillColor(COLOR_INK_FAINT)
    .text('HAS SUCCESSFULLY COMPLETED', SIDE_INSET, y, {
      width: CONTENT_WIDTH,
      align: 'center',
      characterSpacing: 2,
    })
  y = doc.y + 8

  // === Workshop title ===
  doc
    .font('Serif-Bold')
    .fontSize(22)
    .fillColor(COLOR_INK)
    .text(workshop.title, SIDE_INSET, y, {
      width: CONTENT_WIDTH,
      align: 'center',
      characterSpacing: -0.3,
    })
  y = doc.y

  // === Subtitle (optional) ===
  if (workshop.subtitle) {
    y += 4
    doc
      .font('Serif-Italic')
      .fontSize(13)
      .fillColor(COLOR_INK_SOFT)
      .text(workshop.subtitle, SIDE_INSET, y, {
        width: CONTENT_WIDTH,
        align: 'center',
      })
    y = doc.y
  }

  // === Description (italic, narrower) ===
  if (workshop.description) {
    y += 14
    const desc = truncate(workshop.description, 360)
    const descSideInset = SIDE_INSET + 70
    doc
      .font('Serif-Italic')
      .fontSize(12)
      .fillColor(COLOR_INK_SOFT)
      .text(desc, descSideInset, y, {
        width: PAGE_WIDTH - descSideInset * 2,
        align: 'center',
        lineGap: 3,
      })
  }

  // === Meta row at bottom (Date / Duration / Instructor) ===
  const metaY = PAGE_HEIGHT - BOTTOM_INSET - 55
  const colWidth = CONTENT_WIDTH / 3

  // Signature image, centered in the INSTRUCTOR column, above the meta row.
  const sigBoxWidth = 110
  const sigBoxHeight = 28
  const sigX = SIDE_INSET + 2 * colWidth + (colWidth - sigBoxWidth) / 2
  const sigY = metaY - sigBoxHeight - 4
  doc.image(SIGNATURE_BUFFER, sigX, sigY, {
    fit: [sigBoxWidth, sigBoxHeight],
    align: 'center',
    valign: 'bottom',
  })

  const cells = [
    { label: 'DATE', value: formatDate(workshop.scheduled_at) || '—' },
    {
      label: 'DURATION',
      value: workshop.duration_min ? `${workshop.duration_min} minutes` : '—',
    },
    { label: 'INSTRUCTOR', value: INSTRUCTOR_NAME },
  ]
  for (let i = 0; i < cells.length; i++) {
    const x = SIDE_INSET + i * colWidth
    doc
      .font('Mono')
      .fontSize(6.5)
      .fillColor(COLOR_INK_FAINT)
      .text(cells[i].label, x, metaY, {
        width: colWidth,
        align: 'center',
        characterSpacing: 1.5,
      })
    doc
      .font('Serif')
      .fontSize(12)
      .fillColor(COLOR_INK)
      .text(cells[i].value, x, metaY + 14, {
        width: colWidth,
        align: 'center',
      })
  }

  // === Optional NPCP attribution row, below the meta row ===
  const hasNpcp =
    workshop.npcp_cecs != null ||
    workshop.npcp_course_id ||
    workshop.npcp_approval_date
  let footerY = PAGE_HEIGHT - BOTTOM_INSET + 8
  if (hasNpcp) {
    const npcpY = metaY + 36
    const npcpCells = [
      {
        label: 'NPCP CECs',
        value:
          workshop.npcp_cecs != null
            ? Number(workshop.npcp_cecs).toFixed(1)
            : '—',
      },
      {
        label: 'NPCP COURSE ID',
        value: workshop.npcp_course_id || '—',
      },
      {
        label: 'APPROVAL DATE',
        value: formatDateOnly(workshop.npcp_approval_date) || '—',
      },
    ]
    for (let i = 0; i < npcpCells.length; i++) {
      const x = SIDE_INSET + i * colWidth
      doc
        .font('Mono')
        .fontSize(6)
        .fillColor(COLOR_INK_FAINT)
        .text(npcpCells[i].label, x, npcpY, {
          width: colWidth,
          align: 'center',
          characterSpacing: 1.5,
        })
      doc
        .font('Serif')
        .fontSize(10.5)
        .fillColor(COLOR_INK_SOFT)
        .text(npcpCells[i].value, x, npcpY + 11, {
          width: colWidth,
          align: 'center',
        })
    }
    footerY = npcpY + 44
  }

  // === Footer URL ===
  doc
    .font('Mono')
    .fontSize(7)
    .fillColor(COLOR_INK_FAINT)
    .text('PILATESPHYSICS.COM', 0, footerY, {
      width: PAGE_WIDTH,
      align: 'center',
      characterSpacing: 2,
      lineBreak: false,
    })

  return doc
}
