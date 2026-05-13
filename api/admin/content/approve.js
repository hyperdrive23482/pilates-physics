import { supabaseAdmin } from '../../_lib/supabase-admin.js'
import { requireAdmin } from '../../_lib/require-admin.js'
import { renderMarkdown } from '../../_lib/markdown.js'
import { createBroadcast, updateBroadcast } from '../../_lib/kit.js'
import { buildEmailHtml } from '../../_lib/content-email.js'

async function reserveUniqueBlogSlug(baseSlug) {
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

    // 1. Resolve a blog slug + create a blog_posts row in scheduled state (or
    //    reuse the one we created on a previous approve that we're re-approving).
    let blogSlug
    let blogPostId = piece.blog_post_id
    if (blogPostId) {
      const { data: existingBlog } = await supabaseAdmin
        .from('blog_posts')
        .select('id, slug')
        .eq('id', blogPostId)
        .maybeSingle()
      if (existingBlog) {
        blogSlug = existingBlog.slug
        // Update body in case content changed, plus reset to scheduled
        await supabaseAdmin
          .from('blog_posts')
          .update({
            title: piece.title,
            excerpt: piece.excerpt ?? null,
            body_markdown: piece.blog_markdown,
            body_html: renderMarkdown(piece.blog_markdown),
            featured_image_url: piece.featured_image_url,
            featured_image_alt: piece.featured_image_alt,
            status: 'scheduled',
            scheduled_for: sendAt.toISOString(),
            published_at: null,
          })
          .eq('id', blogPostId)
      } else {
        blogPostId = null
      }
    }
    if (!blogPostId) {
      const baseSlug = piece.slug || 'untitled'
      blogSlug = await reserveUniqueBlogSlug(baseSlug)
      const { data: blogPost, error: blogErr } = await supabaseAdmin
        .from('blog_posts')
        .insert({
          slug: blogSlug,
          title: piece.title,
          excerpt: piece.excerpt ?? null,
          body_markdown: piece.blog_markdown,
          body_html: renderMarkdown(piece.blog_markdown),
          featured_image_url: piece.featured_image_url,
          featured_image_alt: piece.featured_image_alt,
          status: 'scheduled',
          scheduled_for: sendAt.toISOString(),
        })
        .select()
        .single()
      if (blogErr) throw blogErr
      blogPostId = blogPost.id
    }

    // 2. Build email HTML with the canonical blog link
    const emailHtml = buildEmailHtml({ emailMarkdown: piece.email_markdown, slug: blogSlug })

    // 3. Create OR update the Kit broadcast and add the send_at
    let kitBroadcastId = piece.kit_broadcast_id
    try {
      if (kitBroadcastId) {
        await updateBroadcast(kitBroadcastId, {
          subject: piece.email_subject,
          previewText: piece.email_preview_text ?? null,
          contentHtml: emailHtml,
          sendAt: sendAt.toISOString(),
        })
      } else {
        const broadcast = await createBroadcast({
          subject: piece.email_subject,
          previewText: piece.email_preview_text ?? null,
          contentHtml: emailHtml,
          sendAt: sendAt.toISOString(),
        })
        kitBroadcastId = broadcast?.id ? String(broadcast.id) : null
      }
    } catch (kitErr) {
      console.error('Kit broadcast operation failed:', kitErr)
      // If we just created a fresh blog_posts row in this call, roll it back.
      if (!piece.blog_post_id && blogPostId) {
        await supabaseAdmin.from('blog_posts').delete().eq('id', blogPostId)
      }
      throw kitErr
    }

    // 4. Update content_pieces to scheduled
    const { data: updatedPiece, error: updateErr } = await supabaseAdmin
      .from('content_pieces')
      .update({
        status: 'scheduled',
        scheduled_for: sendAt.toISOString(),
        kit_broadcast_id: kitBroadcastId ? String(kitBroadcastId) : null,
        blog_post_id: blogPostId,
        slug: blogSlug,
      })
      .eq('id', piece_id)
      .select()
      .single()
    if (updateErr) throw updateErr

    return res.status(200).json({
      piece: updatedPiece,
      blog_post_id: blogPostId,
      kit_broadcast_id: kitBroadcastId,
    })
  } catch (err) {
    console.error('content/approve error:', err)
    return res.status(500).json({ error: err.message ?? 'Approve failed' })
  }
}
