import { supabaseAdmin } from './_lib/supabase-admin.js'
import { buildSitemap } from './_lib/sitemap.js'

// GET /sitemap.xml (rewritten here by vercel.json)
//
// Static marketing routes come from PUBLIC_ROUTES; blog posts come from the
// database so a publish shows up on the next crawl without a redeploy.
// Substack mirrors (canonical_url set) are listed too: the page exists and
// is linked from /blog, and its canonical tag tells Google who owns it.
export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD')
    return res.status(405).end()
  }

  let posts = []
  try {
    const { data, error } = await supabaseAdmin
      .from('blog_posts')
      .select('slug, published_at, updated_at')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
    if (error) throw error
    posts = data ?? []
  } catch (err) {
    // A sitemap with only the static routes beats a 500 that gets Google to
    // drop the whole file. Log it and ship what we have.
    console.error('sitemap: blog_posts lookup failed', err)
  }

  res.setHeader('Content-Type', 'application/xml; charset=utf-8')
  // Cache at the edge for an hour; stale-while-revalidate keeps it fast.
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400')
  return res.status(200).send(buildSitemap(posts))
}
