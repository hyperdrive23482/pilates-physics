import { supabaseAdmin } from '../../_lib/supabase-admin.js'
import { requireAdmin } from '../../_lib/require-admin.js'
import { renderMarkdown } from '../../_lib/markdown.js'
import { createBroadcast } from '../../_lib/kit.js'

const SITE_BASE = process.env.SITE_BASE_URL ?? 'https://pilatesphysics.com'

function ensureSlugUniqueOnBlog(baseSlug) {
  // Caller is expected to call this and use the returned slug.
  return async () => {
    let slug = baseSlug
    let n = 2
    while (true) {
      const { data: existing } = await supabaseAdmin
        .from('blog_posts')
        .select('id')
        .eq('slug', slug)
        .maybeSingle()
      if (!existing) return slug
      slug = `${baseSlug}-${n++}`
      if (n > 200) return slug
    }
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const admin = await requireAdmin(req, res)
  if (!admin) return

  const { piece_id, scheduled_for } = req.body ?? {}
  if (!piece_id) return res.status(400).json({ error: 'piece_id required' })
  if (!scheduled_for) return res.status(400).json({ error: 'scheduled_for required (ISO timestamp)' })

  const sendAt = new Date(scheduled_for)
  if (Number.isNaN(sendAt.getTime())) {
    return res.status(400).json({ error: 'scheduled_for must be a valid timestamp' })
  }

  try {
    const { data: piece, error: pieceErr } = await supabaseAdmin
      .from('content_pieces')
      .select('*')
      .eq('id', piece_id)
      .maybeSingle()
    if (pieceErr) throw pieceErr
    if (!piece) return res.status(404).json({ error: 'piece not found' })

    if (!piece.blog_markdown || !piece.email_markdown || !piece.email_subject) {
      return res.status(400).json({ error: 'piece is missing blog or email content' })
    }
    if (piece.status === 'published') {
      return res.status(409).json({ error: 'piece already published' })
    }

    // 1. Reserve a unique blog slug
    const baseSlug = piece.slug || 'untitled'
    const reserveSlug = ensureSlugUniqueOnBlog(baseSlug)
    const blogSlug = await reserveSlug()

    // 2. Insert blog_posts row in scheduled state
    const bodyHtml = renderMarkdown(piece.blog_markdown)
    const { data: blogPost, error: blogErr } = await supabaseAdmin
      .from('blog_posts')
      .insert({
        slug: blogSlug,
        title: piece.title,
        excerpt: null,
        body_markdown: piece.blog_markdown,
        body_html: bodyHtml,
        status: 'scheduled',
        scheduled_for: sendAt.toISOString(),
      })
      .select()
      .single()
    if (blogErr) throw blogErr

    // 3. Build email HTML (markdown body + auto-appended link to blog)
    const blogUrl = `${SITE_BASE}/blog/${blogSlug}`
    const emailMarkdownWithLink = piece.email_markdown.includes(blogUrl)
      ? piece.email_markdown
      : `${piece.email_markdown}\n\n[Read the full post →](${blogUrl})`
    const emailHtml = renderMarkdown(emailMarkdownWithLink)

    // 4. Create Kit broadcast (Kit handles native scheduled send)
    let kitBroadcastId = null
    try {
      const broadcast = await createBroadcast({
        subject: piece.email_subject,
        contentHtml: emailHtml,
        sendAt: sendAt.toISOString(),
      })
      kitBroadcastId = broadcast?.id ?? null
    } catch (kitErr) {
      // If Kit fails, roll back the blog_posts insert so we don't end up half-scheduled
      console.error('Kit broadcast creation failed:', kitErr)
      await supabaseAdmin.from('blog_posts').delete().eq('id', blogPost.id)
      throw kitErr
    }

    // 5. Update content_pieces to scheduled
    const { data: updatedPiece, error: updateErr } = await supabaseAdmin
      .from('content_pieces')
      .update({
        status: 'scheduled',
        scheduled_for: sendAt.toISOString(),
        kit_broadcast_id: kitBroadcastId ? String(kitBroadcastId) : null,
        blog_post_id: blogPost.id,
        slug: blogSlug,
      })
      .eq('id', piece_id)
      .select()
      .single()
    if (updateErr) throw updateErr

    return res.status(200).json({
      piece: updatedPiece,
      blog_post: blogPost,
      kit_broadcast_id: kitBroadcastId,
    })
  } catch (err) {
    console.error('content/approve error:', err)
    return res.status(500).json({ error: err.message ?? 'Approve failed' })
  }
}
