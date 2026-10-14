import { PUBLIC_ROUTES, SITE_URL } from './public-routes.js'

// Pure sitemap builder, kept import-free of Supabase so it can be unit
// tested. api/sitemap.xml.js fetches the posts and calls this.

function escapeXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function isoDate(value) {
  if (!value) return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10)
}

function urlEntry({ loc, lastmod, changefreq, priority }) {
  const lines = ['  <url>', `    <loc>${escapeXml(loc)}</loc>`]
  if (lastmod) lines.push(`    <lastmod>${lastmod}</lastmod>`)
  if (changefreq) lines.push(`    <changefreq>${changefreq}</changefreq>`)
  if (priority != null) lines.push(`    <priority>${priority}</priority>`)
  lines.push('  </url>')
  return lines.join('\n')
}

// posts: [{ slug, published_at, updated_at }] for published blog_posts rows.
export function buildSitemap(posts = []) {
  const entries = PUBLIC_ROUTES.map((route) =>
    urlEntry({
      loc: `${SITE_URL}${route}`,
      changefreq: route === '/' || route === '/blog' ? 'weekly' : 'monthly',
      priority: route === '/' ? '1.0' : '0.7',
    }),
  )

  for (const post of posts) {
    if (!post?.slug) continue
    entries.push(
      urlEntry({
        loc: `${SITE_URL}/blog/${encodeURIComponent(post.slug)}`,
        lastmod: isoDate(post.updated_at) ?? isoDate(post.published_at),
        changefreq: 'monthly',
        priority: '0.6',
      }),
    )
  }

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries,
    '</urlset>',
    '',
  ].join('\n')
}
