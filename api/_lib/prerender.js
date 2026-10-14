import { PUBLIC_ROUTES } from './public-routes.js'
import { renderMarkdown } from './markdown.js'
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_IMAGE,
  SITE_NAME,
  absoluteUrl,
  canonicalForPath,
  fullTitle,
} from '../../src/lib/seo.js'
import {
  BLOG_FALLBACK_IMAGE,
  HOME_JSON_LD,
  PAGE_META,
  blogPostUrl,
  blogPostingJsonLd,
  describePost,
  pp101JsonLd,
  pp102JsonLd,
  reformerCourseJsonLd,
} from '../../src/lib/pageMeta.js'

// Server side head injection for the public pages (plan section 7, 3a item 4).
//
// api/render-page.js serves the built SPA shell with the route's title,
// description, canonical, Open Graph tags and JSON-LD already in <head>, and
// for blog posts the article itself in #root, so crawlers and link previews
// that never run JavaScript see the real page. React then renders over #root
// as usual. Every visitor gets the same HTML: no user agent sniffing.
//
// Pure: no Supabase, no fs. The handler passes the shell and the fetchers.

export const BLOG_POST_SELECT =
  'id, slug, title, excerpt, body_html, body_markdown, published_at, updated_at, featured_image_url, featured_image_alt'

const MARK = 'data-head="1"'

export function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// JSON inside a <script> must not be able to close the tag.
export function scriptJson(data) {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
}

/**
 * The same tags src/lib/head.js sets in the browser, as an HTML string.
 * Marked data-head="1" so the client hook adopts and later cleans them up.
 */
export function buildHeadTags({ title, description, canonical, image, type, noindex, jsonLd, path }) {
  const t = escapeHtml(fullTitle(title))
  const d = escapeHtml(description || DEFAULT_DESCRIPTION)
  const c = escapeHtml(absoluteUrl(canonical) || canonicalForPath(path || '/'))
  const i = escapeHtml(absoluteUrl(image) || DEFAULT_IMAGE)
  const tags = [
    `<title>${t}</title>`,
    `<meta name="description" content="${d}" ${MARK}>`,
    `<link rel="canonical" href="${c}" ${MARK}>`,
    `<meta property="og:site_name" content="${escapeHtml(SITE_NAME)}" ${MARK}>`,
    `<meta property="og:title" content="${t}" ${MARK}>`,
    `<meta property="og:description" content="${d}" ${MARK}>`,
    `<meta property="og:image" content="${i}" ${MARK}>`,
    `<meta property="og:url" content="${c}" ${MARK}>`,
    `<meta property="og:type" content="${escapeHtml(type || 'website')}" ${MARK}>`,
    `<meta name="twitter:card" content="summary_large_image" ${MARK}>`,
    `<meta name="twitter:title" content="${t}" ${MARK}>`,
    `<meta name="twitter:description" content="${d}" ${MARK}>`,
    `<meta name="twitter:image" content="${i}" ${MARK}>`,
  ]
  if (noindex) tags.push(`<meta name="robots" content="noindex" ${MARK}>`)
  if (jsonLd) {
    tags.push(`<script type="application/ld+json" data-ssr-jsonld>${scriptJson(jsonLd)}</script>`)
  }
  return tags.join('\n    ')
}

function formatDate(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

/**
 * Static markup for a post, using BlogPost.jsx's classes so the page looks
 * close to right before React takes over. The body is the stored body_html,
 * the same HTML BlogPost.jsx renders with dangerouslySetInnerHTML.
 */
export function renderArticleHtml(post) {
  const parts = [
    '<article class="ppv2 grid-bg">',
    '<header class="blog-post__header"><div class="container container--narrow">',
    '<a href="/blog" class="blog-post__back">← The Pilates Physics Blog</a>',
    `<h1 class="blog-post__title">${escapeHtml(post.title || '')}</h1>`,
    `<p class="blog-post__date">${escapeHtml(formatDate(post.published_at))}</p>`,
    '</div></header>',
  ]
  if (post.featured_image_url) {
    parts.push(
      '<div class="blog-post__feature"><div class="container container--narrow"><div class="meet__photo">',
      `<img src="${escapeHtml(post.featured_image_url)}" alt="${escapeHtml(post.featured_image_alt || '')}">`,
      '</div></div></div>',
    )
  }
  parts.push(
    '<section class="blog-post__body"><div class="container container--narrow">',
    `<div class="blog-body">${post.body_html || renderMarkdown(post.body_markdown || '')}</div>`,
    '</div></section>',
    '</article>',
  )
  return parts.join('')
}

/**
 * Put the tags into the shell. Replaces the shell's own <title>, fills #root
 * when there is a body, and embeds `seed` for the page to read on first
 * render. Returns the shell untouched if it is not the shape we expect.
 */
export function injectIntoShell(shell, { headTags, bodyHtml, seed }) {
  if (!/<title>[^<]*<\/title>/.test(shell) || !shell.includes('<div id="root"></div>')) {
    return shell
  }
  let html = shell.replace(/<title>[^<]*<\/title>/, () => headTags)
  if (seed) {
    html = html.replace(
      '</head>',
      () => `  <script id="pp-prerender" type="application/json">${scriptJson(seed)}</script>\n  </head>`,
    )
  }
  if (bodyHtml) {
    html = html.replace('<div id="root"></div>', () => `<div id="root">${bodyHtml}</div>`)
  }
  return html
}

export function normalizePath(raw) {
  if (typeof raw !== 'string' || !raw.startsWith('/')) return '/'
  const p = raw.split(/[?#]/)[0]
  return p.length > 1 ? p.replace(/\/+$/, '') : '/'
}

/**
 * Work out what to inject for a path.
 *
 * @param {string} path
 * @param {object} fetchers  { post(slug), currentWorkshop(seriesPrefix), webinarBySlug(slug) }
 *   Each resolves to a row or null and may throw; a failed fetch costs only
 *   the data it would have added, never the page.
 * @returns {Promise<{status:number, head:object, bodyHtml?:string, seed?:object}>}
 */
export async function resolvePage(path, fetchers) {
  const blog = path.match(/^\/blog\/([^/]+)$/)
  if (blog) {
    const slug = decodeURIComponent(blog[1])
    let post = null
    let failed = false
    try {
      post = await fetchers.post(slug)
    } catch (err) {
      console.error('render-page: post lookup failed', err)
      failed = true
    }
    if (!post) {
      // A lookup failure renders the plain shell and lets the browser retry;
      // only a confirmed miss is a 404.
      if (failed) return { status: 200, head: { path } }
      return { status: 404, head: { title: 'Post not found', noindex: true, path } }
    }
    const url = blogPostUrl(slug)
    return {
      status: 200,
      head: {
        path,
        title: post.title,
        description: describePost(post),
        canonical: url,
        image: post.featured_image_url || BLOG_FALLBACK_IMAGE,
        type: 'article',
        jsonLd: blogPostingJsonLd(post, url),
      },
      bodyHtml: renderArticleHtml(post),
      seed: { post },
    }
  }

  const meta = PAGE_META[path]
  if (!meta || !PUBLIC_ROUTES.includes(path)) return { status: 200, head: { path } }

  const head = { ...meta, path }
  const safely = async (fn) => {
    try {
      return await fn()
    } catch (err) {
      console.error(`render-page: ${path} lookup failed`, err)
      return null
    }
  }
  if (path === '/') head.jsonLd = HOME_JSON_LD
  if (path === '/pilates-physics-101') head.jsonLd = pp101JsonLd(await safely(() => fetchers.currentWorkshop('PP-101')))
  if (path === '/pilates-physics-102') head.jsonLd = pp102JsonLd(await safely(() => fetchers.currentWorkshop('PP-102')))
  if (path === '/how-a-reformer-works') {
    head.jsonLd = reformerCourseJsonLd(await safely(() => fetchers.webinarBySlug('how-a-reformer-works')))
  }
  return { status: 200, head }
}
