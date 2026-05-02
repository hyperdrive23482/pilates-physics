import { existsSync } from 'node:fs'
import puppeteer from 'puppeteer-core'
import chromium from '@sparticuz/chromium'
import { renderCertificateHtml } from './render-certificate-html.js'

// AWS_LAMBDA_FUNCTION_NAME is set in Vercel's serverless runtime (AWS Lambda
// under the hood) but NOT during `vercel dev`. The @sparticuz/chromium binary
// is Linux-only, so locally we hunt for an installed Chrome or Edge.
const isServerless = !!process.env.AWS_LAMBDA_FUNCTION_NAME

function findLocalExecutable() {
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    return process.env.PUPPETEER_EXECUTABLE_PATH
  }
  // `vercel dev` on Windows often runs the function through a Linux layer
  // (WSL interop), so we probe Linux paths AND Windows paths exposed via
  // /mnt/c. Edge ships with Windows 11 and is a reliable last resort.
  const candidates = {
    win32: [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
      'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    ],
    linux: [
      '/opt/google/chrome/chrome',
      '/usr/bin/google-chrome',
      '/usr/bin/chromium',
      '/usr/bin/chromium-browser',
      '/mnt/c/Program Files/Google/Chrome/Application/chrome.exe',
      '/mnt/c/Program Files (x86)/Google/Chrome/Application/chrome.exe',
      '/mnt/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
      '/mnt/c/Program Files/Microsoft/Edge/Application/msedge.exe',
    ],
    darwin: [
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    ],
  }[process.platform] ?? []
  return candidates.find((p) => existsSync(p))
}

export async function buildCertificate({ webinar, participantName }) {
  const html = renderCertificateHtml({ webinar, participantName })

  let launchOpts
  if (isServerless) {
    launchOpts = {
      args: chromium.args,
      defaultViewport: { width: 1056, height: 816, deviceScaleFactor: 2 },
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    }
  } else {
    const executablePath = findLocalExecutable()
    if (!executablePath) {
      throw new Error(
        'No local Chrome/Edge found for PDF rendering. Set PUPPETEER_EXECUTABLE_PATH ' +
          'to a Chromium-based browser, or test via a Vercel preview deployment.'
      )
    }
    launchOpts = {
      executablePath,
      defaultViewport: { width: 1056, height: 816, deviceScaleFactor: 2 },
      headless: true,
    }
  }

  const browser = await puppeteer.launch(launchOpts)

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
