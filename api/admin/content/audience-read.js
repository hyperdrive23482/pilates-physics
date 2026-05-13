import { supabaseAdmin } from '../../_lib/supabase-admin.js'
import { requireAdmin } from '../../_lib/require-admin.js'
import { audienceRead } from '../../_lib/anthropic.js'

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
    const { data: personaRows, error } = await supabaseAdmin
      .from('brain_entries')
      .select('id, title, content')
      .eq('type', 'persona')
      .eq('is_active', true)
      .order('created_at', { ascending: true })
    if (error) throw error

    if (!personaRows?.length) {
      return res.status(400).json({
        error: 'No active personas in the brain. Add at least one persona entry.',
      })
    }

    const personas = personaRows.map((p) => ({
      id: p.id,
      name: p.title,
      content: p.content,
    }))

    const { reactions, usage } = await audienceRead({
      personas,
      blogMarkdown: blog_markdown ?? '',
      emailSubject: email_subject ?? '',
      emailPreviewText: email_preview_text ?? '',
      emailMarkdown: email_markdown ?? '',
    })

    return res.status(200).json({ reactions, usage })
  } catch (err) {
    console.error('content/audience-read error:', err)
    return res.status(500).json({ error: err.message ?? 'Audience read failed' })
  }
}
