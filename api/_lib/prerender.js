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

// Static body for the marketing pages that matter most to search and to AI
// agents that never run JavaScript: the h1 the page renders, a few paragraphs
// on what it offers, and plain links onward. React renders over it as usual.
// The classes are the pages' own so the first paint looks close to right.
// /terms, /privacy and /links are left to the SPA on purpose.
const STATIC_BODIES = {
  '/': {
    h1: 'The same spring setting isn\u2019t the same workout.',
    paragraphs: [
      'Every body meets the spring differently. See why, get the cues to adjust for it, and build every class around the body in front of you. No math background required.',
      'Pilates Physics is physics-based education for Pilates teachers from Kaleen Canevari, a mechanical engineer and Pilates instructor who designed a reformer. The live workshops and on-demand course explain the forces inside every exercise so you can adapt and progress the method for each client, instead of memorizing one setting for everyone.',
    ],
    links: [
      ['/spring-calculator', 'Free Spring Load Calculator'],
      ['/pilates-physics-101', 'Pilates Physics 101 workshop'],
      ['/how-a-reformer-works', 'How a Reformer Works course'],
      ['/blog', 'The blog'],
      ['/about', 'About Kaleen'],
    ],
  },
  '/spring-calculator': {
    kicker: '\u00a7 01 \u00b7 Free resource',
    h1: 'A red spring is not a single weight.',
    paragraphs: [
      'You already read the body in front of you: how it moves, where it strains, what your cue changes. But a Pilates spring does not load like a dumbbell, and the resistance your client actually meets shapes everything you watch for. The free Spring Load Calculator shows you how springs really load, so what you see starts to make sense.',
      'How spring load changes as the carriage moves: a spring\u2019s force grows with how far it is stretched. At the start of a stroke the carriage sits near the stopper and the spring is close to its resting length, so the load is light. As the carriage travels out the spring stretches and the load climbs, and it is heaviest at full extension. A tall client who pushes the carriage further works a heavier red spring than a shorter client on the same setting, which is why the same color is not the same workout.',
      'Pick a brand, choose a spring color, and drag through the stroke to read the load at any point. Springs from six brands are included, because a red spring on one reformer is not a red spring on another.',
    ],
    links: [
      ['/blog/comparing-springs-across-brands', 'Comparing reformer springs across brands'],
      ['/blog/balanced-body-duro-springs-measured', 'I measured Balanced Body\u2019s new Duro springs'],
      ['/pilates-physics-101', 'Pilates Physics 101 workshop'],
    ],
  },
  '/how-a-reformer-works': {
    kicker: '\u00a7 01 \u00b7 On-demand course',
    h1: 'You own more machine than you are using.',
    paragraphs: [
      'How a Reformer Works is an on-demand course on the mechanisms that make your reformer work, taught by an engineer and Pilates instructor who designed one. Eight modules, about one hour, brand agnostic, and worth one NPCP continuing education credit.',
      'Adjust the gear bar and two other things quietly move. The course walks through the springs, the carriage and wheels, the footbar and gear bar, the ropes and pulleys, the headrest and shoulder blocks, and how a change to one part of the machine changes the load and geometry of the others. The point is to give you another option to offer when your teaching intent is not landing.',
      'One payment, lifetime access, nothing expires. Scholarships are available.',
    ],
    links: [
      ['/pilates-physics-101', 'Pilates Physics 101 workshop'],
      ['/spring-calculator', 'Free Spring Load Calculator'],
      ['/scholarship', 'Scholarships'],
    ],
  },
  '/pilates-physics-101': {
    kicker: '\u00a7 01 \u00b7 Pilates Physics 101 Workshop',
    h1: 'Physics to adapt and scale Pilates.',
    paragraphs: [
      'Understanding the forces in the sessions you teach unlocks adaptability for different clients and progression over time. Pilates Physics 101 is a live, two-hour workshop on Zoom with the recording included, approved for 2.0 NPCP continuing education credits.',
      'The same equipment setup doesn\u2019t work for everyone. If you have memorized baseline equipment settings but are not sure how to adjust for the person in front of you, or if you have figured out what works but do not know why, this workshop is for you. It covers how springs, levers and body position change the load in an exercise, with a feedback loop you can use in your next class.',
    ],
    links: [
      ['/pilates-physics-102', 'Pilates Physics 102: the chair and cadillac'],
      ['/how-a-reformer-works', 'How a Reformer Works course'],
      ['/spring-calculator', 'Free Spring Load Calculator'],
      ['/scholarship', 'Scholarships'],
    ],
  },
  '/pilates-physics-102': {
    kicker: '\u00a7 01 \u00b7 Pilates Physics 102 Workshop',
    h1: 'Same framework. New geometry.',
    paragraphs: [
      'Expand the Pilates Physics framework beyond the reformer to two new pieces of equipment that introduce different mechanical applications of force: the chair and the cadillac. A live, two-hour workshop on Zoom with the recording included, approved for 2.0 NPCP continuing education credits.',
      'You can feel the difference between a high hook and a low hook. Now explain it. If you can teach the same exercise on the cadillac with two anchor heights and feel that they are different but cannot fully say why, this workshop is for you. Same on the chair, where a heavy client and a light client work very different loads on the same springs. Built on Pilates Physics 101.',
    ],
    links: [
      ['/pilates-physics-101', 'Pilates Physics 101 workshop'],
      ['/how-a-reformer-works', 'How a Reformer Works course'],
      ['/scholarship', 'Scholarships'],
    ],
  },
  '/help': {
    h1: 'How can we help?',
    paragraphs: [
      'Answers to common questions about Pilates Physics workshops, courses and your account. If you do not see what you are looking for, send a note through the form on this page and Kaleen will reply within a few days.',
      'Do Pilates Physics workshops count for NPCP continuing education credits? Yes. Pilates Physics 101 and Pilates Physics 102 are each approved for 2.0 NPCP CECs, and the How a Reformer Works course is approved for 1.0 NPCP CEC. Attend live or watch the recording, then request your certificate from your portal.',
      'Purchased workshops, Zoom links and recordings live in your portal. Recordings are posted a few days after each live session. All sales are final.',
    ],
    links: [
      ['/pilates-physics-101', 'Pilates Physics 101'],
      ['/pilates-physics-102', 'Pilates Physics 102'],
      ['/how-a-reformer-works', 'How a Reformer Works'],
      ['/terms', 'Terms and Conditions'],
    ],
  },
}

export function renderStaticHtml(path) {
  const b = STATIC_BODIES[path]
  if (!b) return undefined
  const parts = ['<main class="ppv2 grid-bg"><section class="section-frame"><div class="container container--narrow">']
  if (b.kicker) parts.push(`<div class="kicker">${escapeHtml(b.kicker)}</div>`)
  parts.push(`<h1 class="workshop-hero__title">${escapeHtml(b.h1)}</h1>`)
  for (const p of b.paragraphs) parts.push(`<p class="workshop-hero__lede">${escapeHtml(p)}</p>`)
  if (b.links?.length) {
    parts.push('<nav aria-label="Related pages"><ul>')
    for (const [href, label] of b.links) {
      parts.push(`<li><a href="${escapeHtml(href)}">${escapeHtml(label)}</a></li>`)
    }
    parts.push('</ul></nav>')
  }
  parts.push('</div></section></main>')
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
  return { status: 200, head, bodyHtml: renderStaticHtml(path) }
}
