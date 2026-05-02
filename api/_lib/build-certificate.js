import puppeteer from 'puppeteer-core'
import chromium from '@sparticuz/chromium'
import { renderCertificateHtml } from './render-certificate-html.js'

/**
 * Build a Certificate of Completion PDF by rendering an HTML template
 * with headless Chromium.
 *
 * @param {object} args
 * @param {object} args.webinar  - { title, subtitle, description, scheduled_at, duration_min }
 * @param {string} args.participantName - display name for the participant
 * @returns {Promise<Buffer>} the PDF bytes
 */
export async function buildCertificate({ webinar, participantName }) {
  const html = renderCertificateHtml({ webinar, participantName })

  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: { width: 1056, height: 816, deviceScaleFactor: 2 },
    executablePath: await chromium.executablePath(),
    headless: chromium.headless,
  })

  try {
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })
    // Ensure web fonts are fully loaded before snapshotting.
    await page.evaluateHandle('document.fonts.ready')

    return await page.pdf({
      format: 'Letter',
      landscape: true,
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    })
  } finally {
    await browser.close()
  }
}
