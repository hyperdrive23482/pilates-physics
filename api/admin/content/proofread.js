import { requireAdmin } from '../../_lib/require-admin.js'
import { proofreadContent } from '../../_lib/anthropic.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const admin = await requireAdmin(req, res)
  if (!admin) return

  const {
    blog_markdown,
    email_subject,
    email_preview_text,
    email_markdown,
  } = req.body ?? {}

  if (typeof blog_markdown !== 'string' && typeof email_markdown !== 'string') {
    return res.status(400).json({ error: 'blog_markdown or email_markdown required' })
  }

  try {
    const { issues, usage } = await proofreadContent({
      blogMarkdown: blog_markdown ?? '',
      emailSubject: email_subject ?? '',
      emailPreviewText: email_preview_text ?? '',
      emailMarkdown: email_markdown ?? '',
    })
    return res.status(200).json({ issues, usage })
  } catch (err) {
    console.error('content/proofread error:', err)
    return res.status(500).json({ error: err.message ?? 'Proofread failed' })
  }
}
