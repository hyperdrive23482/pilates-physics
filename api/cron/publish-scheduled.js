import { supabaseAdmin } from '../_lib/supabase-admin.js'
import { renderMarkdown } from '../_lib/markdown.js'

// Vercel Cron: GET /api/cron/publish-scheduled
//
// Flips blog_posts.status from 'scheduled' to 'published' once their
// scheduled_for time has arrived. Email side is handled natively by Kit
// via the broadcast's send_at timestamp.
export default async function handler(req, res) {
  // Verify the cron secret. Vercel sends this header when CRON_SECRET is set.
  const auth = req.headers.authorization
  const expected = process.env.CRON_SECRET
  if (expected) {
    if (auth !== `Bearer ${expected}`) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
  }

  try {
    const now = new Date().toISOString()

    // 1. Promote blog_posts from scheduled → published
    const { data: due, error: dueErr } = await supabaseAdmin
      .from('blog_posts')
      .select('id, slug, body_markdown, body_html, scheduled_for')
      .eq('status', 'scheduled')
      .lte('scheduled_for', now)
    if (dueErr) throw dueErr

    const publishedIds = []
    for (const post of due ?? []) {
      const html = post.body_html || renderMarkdown(post.body_markdown)
      const { error: updErr } = await supabaseAdmin
        .from('blog_posts')
        .update({
          status: 'published',
          published_at: now,
          body_html: html,
        })
        .eq('id', post.id)
        .eq('status', 'scheduled') // guard against double-publish race
      if (updErr) {
        console.error(`Failed to publish blog ${post.id}:`, updErr)
        continue
      }
      publishedIds.push(post.id)
    }

    // 2. Sync content_pieces whose blog_post just went live
    if (publishedIds.length > 0) {
      const { error: syncErr } = await supabaseAdmin
        .from('content_pieces')
        .update({
          status: 'published',
          published_at: now,
        })
        .in('blog_post_id', publishedIds)
        .eq('status', 'scheduled')
      if (syncErr) {
        console.error('Failed to sync content_pieces:', syncErr)
      }
    }

    return res.status(200).json({
      published_count: publishedIds.length,
      published_ids: publishedIds,
    })
  } catch (err) {
    console.error('publish-scheduled error:', err)
    return res.status(500).json({ error: err.message ?? 'Internal error' })
  }
}
