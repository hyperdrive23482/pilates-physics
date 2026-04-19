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
