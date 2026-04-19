import { Resend } from 'resend'
import fs from 'node:fs/promises'
import path from 'node:path'

export const resend = new Resend(process.env.RESEND_API_KEY)

const FROM = 'Pilates Physics <noreply@mail.pilatesphysics.com>'

const TEMPLATES = {
  magiclink: {
    file: 'magic-link.html',
    subject: 'Your Pilates Physics sign-in link',
  },
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

  const { data, error } = await resend.emails.send({
    from: FROM,
    to,
    subject: meta.subject,
    html,
  })
  if (error) throw new Error(`Resend send failed: ${error.message ?? JSON.stringify(error)}`)
  return data
}
