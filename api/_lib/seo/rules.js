// The SEO audit's rules: pure functions over a crawled snapshot of the site.
// Ported from remo's supabase/functions/_shared/seo-rules.ts.
//
// IMPORTS NOTHING, so the same code runs in the API route, the cron and
// node --test.
//
// WHAT A "PAGE" IS HERE. The raw HTML a crawler receives before JavaScript.
// api/render-page.js injects each public page's head (title, description,
// canonical, Open Graph, JSON-LD) and, for blog posts, the article body. Every
// other route arrives as the bare SPA shell: an empty <div id="root"></div>
// under the generic "Pilates Physics" title. So there are three kinds:
//
//   - content:     the body is in the HTML (blog posts). Every rule runs.
//   - head only:   own head, empty body (the static marketing pages). Head,
//                  social and schema rules run; structure rules (h1, alt
//                  text, links) cannot, so they are one info finding.
//   - bare shell:  no head of its own. One site-level error, not fourteen
//                  copies of "title missing".
//
// Every rule carries the plain-language fix and the files that own it, so the
// Recommendations tab can say where to go without a lookup.

// ─── Site knowledge ─────────────────────────────────────────────────────────

/** Pages audited although the sitemap leaves them out on purpose: they must
 *  say noindex, and the audit checks that they do. */
export const NOINDEX_EXPECTED = ['/login', '/signup']

/** Discovered links that are app, auth or transactional routes. Never orphans. */
const NON_CONTENT =
  /^\/(login|signup|forgot-password|set-password|profile|portal|admin|auth|offer|survey|survey-101|subscription-confirmed|springs-101|mentorship\/apply|workshops|courses?|ingest|api)(\/|$)/

const META_SOURCES = ['src/lib/pageMeta.js', 'api/_lib/prerender.js']
const RENDER_SOURCES = ['api/render-page.js', 'api/_lib/prerender.js', 'vercel.json']

/** Which file to open for each route. The Recommendations tab prints these. */
const ROUTE_SOURCES = {
  '/': ['src/pages/Landing.jsx'],
  '/about': ['src/pages/About.jsx'],
  '/spring-calculator': ['src/pages/SpringCalculatorLanding.jsx'],
  '/education': ['src/pages/Education.jsx'],
  '/how-a-reformer-works': ['src/pages/HowAReformerWorks.jsx', 'src/components/course/CourseSalesBody.jsx'],
  '/pilates-physics-101': ['src/pages/PilatesPhysics101.jsx'],
  '/pilates-physics-102': ['src/pages/PilatesPhysics102.jsx'],
  '/mentorship': ['src/pages/Mentorship.jsx'],
  '/scholarship': ['src/pages/ScholarshipApply.jsx'],
  '/blog': ['src/pages/Blog.jsx'],
  '/help': ['src/pages/Help.jsx'],
  '/terms': ['src/pages/Terms.jsx'],
  '/privacy': ['src/pages/Privacy.jsx'],
  '/links': ['src/pages/Links.jsx'],
  '/login': ['src/pages/Login.jsx'],
  '/signup': ['src/pages/Signup.jsx'],
}

export function sourcesFor(path) {
  if (ROUTE_SOURCES[path]) return ROUTE_SOURCES[path]
  if (path?.startsWith('/blog/')) return ['Admin > Blog (the post in the CMS)', 'src/pages/BlogPost.jsx']
  return ['src/App.jsx']
}

// ─── Parsing ────────────────────────────────────────────────────────────────

const attr = (tag, name) => {
  const m = new RegExp(`\\s${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i').exec(tag)
  return m ? (m[2] ?? m[3] ?? m[4] ?? '') : null
}

const decode = (s) =>
  s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim()

/** Every object in a JSON-LD block, @graph members included. */
export function jsonLdNodes(block) {
  const out = []
  const visit = (o) => {
    if (Array.isArray(o)) return o.forEach(visit)
    if (!o || typeof o !== 'object') return
    if (Array.isArray(o['@graph'])) o['@graph'].forEach(visit)
    if (o['@type']) out.push(o)
  }
  visit(block)
  return out
}

/**
 * Regex extraction rather than a DOM parser: fast, dependency free, and the
 * head of an HTML document is regular enough for this to be exact in practice.
 */
export function parsePage(html, origin, path) {
  const metaTags = html.match(/<meta\b[^>]*>/gi) ?? []
  const linkTags = html.match(/<link\b[^>]*>/gi) ?? []
  const meta = (key, by) => {
    for (const t of metaTags) {
      if ((attr(t, by) ?? '').toLowerCase() === key) {
        const c = attr(t, 'content')
        return c === null ? null : decode(c)
      }
    }
    return null
  }
  const link = (rel) => {
    for (const t of linkTags) {
      if ((attr(t, 'rel') ?? '').toLowerCase().split(/\s+/).includes(rel)) {
        const h = attr(t, 'href')
        return h === null ? null : decode(h)
      }
    }
    return null
  }

  const titleRaw = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1]
  const title = titleRaw === undefined ? null : decode(titleRaw)

  const headings = [...html.matchAll(/<h([1-6])\b/gi)].map((m) => Number(m[1]))

  const ldBlocks = [
    ...html.matchAll(/<script[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi),
  ]
  const blocks = []
  const types = []
  for (const m of ldBlocks) {
    try {
      const obj = JSON.parse(m[1])
      blocks.push(obj)
      for (const node of jsonLdNodes(obj)) if (typeof node['@type'] === 'string') types.push(node['@type'])
    } catch {
      /* unparsed: count - parsed */
    }
  }

  const imgs = html.match(/<img\b[^>]*>/gi) ?? []
  const withoutAlt = imgs.filter((t) => attr(t, 'alt') === null).length

  const links = new Set()
  for (const a of html.match(/<a\b[^>]*>/gi) ?? []) {
    const href = attr(a, 'href')
    if (!href) continue
    let p = null
    if (href.startsWith('/') && !href.startsWith('//')) p = href
    else if (href.startsWith(origin + '/') || href === origin) p = href.slice(origin.length) || '/'
    if (p === null) continue
    p = p.split('#')[0].split('?')[0]
    if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1)
    if (p && !/\.[a-z0-9]{2,5}$/i.test(p)) links.add(p || '/')
  }

  const rootEmpty = /<div\s+id=["']root["']\s*>\s*<\/div>/i.test(html)
  const canonical = link('canonical')

  return {
    title,
    description: meta('description', 'name'),
    canonical,
    ogTitle: meta('og:title', 'property'),
    ogDescription: meta('og:description', 'property'),
    ogImage: meta('og:image', 'property'),
    ogUrl: meta('og:url', 'property'),
    twitterCard: meta('twitter:card', 'name'),
    robotsMeta: meta('robots', 'name'),
    viewport: meta('viewport', 'name'),
    headings,
    h1Count: headings.filter((h) => h === 1).length,
    jsonLd: { count: ldBlocks.length, parsed: blocks.length, types, blocks },
    images: { total: imgs.length, withoutAlt },
    internalLinks: [...links].sort(),
    isShell: rootEmpty && headings.length === 0,
    // The bare shell carries no canonical; render-page always emits one.
    hasOwnHead: canonical !== null,
    path,
  }
}

// ─── Rules ──────────────────────────────────────────────────────────────────

const isNoindex = (p) => /noindex/i.test(p.parsed?.robotsMeta ?? '') || /noindex/i.test(p.xRobotsTag ?? '')

/** Pages we expect Google to index: 200, no noindex, not an app route. */
const isIndexable = (p) =>
  p.status === 200 && !isNoindex(p) && !NOINDEX_EXPECTED.includes(p.path) && !NON_CONTENT.test(p.path)

const finding = (ruleId, severity, path, title, detail, fix, sourceFiles, evidence) => ({
  ruleId,
  severity,
  path,
  title,
  detail,
  fix,
  sourceFiles: [...new Set(sourceFiles)],
  evidence,
})

const TITLE_MIN = 30
const TITLE_MAX = 60
const DESC_MIN = 70
const DESC_MAX = 160

const REQUIRED_FIELDS = {
  BlogPosting: ['headline', 'datePublished', 'author', 'mainEntityOfPage'],
  Course: ['name', 'description', 'provider'],
  Event: ['name', 'startDate', 'location', 'eventAttendanceMode'],
}

/**
 * Every rule, in the order findings are emitted. Site-level rules first so the
 * one fix that explains most per-page gaps sits at the top of the list.
 */
export function runRules(site) {
  const out = []
  const pages = site.pages
  const home = pages.find((p) => p.path === '/')
  const ok = pages.filter((p) => p.status === 200 && p.parsed)

  // ── robots.txt and sitemap ──
  if (site.robotsTxt === null) {
    out.push(finding('robots.missing', 'error', null, 'robots.txt is missing or unreachable',
      'Crawlers fall back to "crawl everything", and the sitemap is never announced.',
      'Restore public/robots.txt with a Sitemap: line.', ['public/robots.txt']))
  } else {
    if (!/^\s*Sitemap:/im.test(site.robotsTxt)) {
      out.push(finding('robots.no_sitemap', 'warn', null, 'robots.txt does not declare the sitemap',
        'Google can still find /sitemap.xml by convention, but Bing and others rely on the Sitemap: line.',
        'Add "Sitemap: https://pilatesphysics.com/sitemap.xml" to public/robots.txt.', ['public/robots.txt']))
    }
    if (/^\s*User-agent:\s*\*\s*[\r\n]+(?:[^\r\n]*[\r\n]+)*?\s*Disallow:\s*\/\s*$/im.test(site.robotsTxt)) {
      out.push(finding('robots.blocks_all', 'error', null, 'robots.txt blocks all crawling',
        'A bare "Disallow: /" under "User-agent: *" keeps every crawler out of the whole site.',
        'Remove or narrow the Disallow.', ['public/robots.txt']))
    }
  }

  if (!site.sitemap.ok) {
    out.push(finding('sitemap.unreachable', 'error', null, 'sitemap.xml is missing or unreachable',
      '/sitemap.xml is served by api/sitemap.xml.js through a rewrite in vercel.json.',
      'Check the function logs in Vercel and the /sitemap.xml rewrite.', ['api/sitemap.xml.js', 'vercel.json']))
  }
  if (site.sitemap.offHost.length) {
    out.push(finding('sitemap.offhost', 'error', null, `${site.sitemap.offHost.length} sitemap URL(s) point off-host`,
      `Every <loc> should be on ${site.origin}. Off-host: ${site.sitemap.offHost.join(', ')}.`,
      'SITE_URL in api/_lib/public-routes.js must match the production host.',
      ['api/_lib/public-routes.js', 'api/_lib/sitemap.js'], { offHost: site.sitemap.offHost }))
  }

  // ── crawl: status, redirects, speed, weight ──
  for (const p of pages) {
    if (p.status !== 200) {
      const listed = p.source === 'sitemap'
      // A blog 404 the render function answered on purpose is still a
      // broken link or a stale sitemap entry, so it stays a finding.
      out.push(finding('crawl.status', listed ? 'error' : 'warn', p.path,
        `${p.path} answered ${p.status || 'a fetch error'}`,
        `${listed ? 'This URL is in the sitemap, so Google will keep requesting it. ' : 'This URL is linked from the site. '}${p.error ?? ''}`.trim(),
        listed ? 'Fix the route, or unpublish it so it leaves the sitemap.' : 'Fix or remove the link.',
        listed ? ['api/_lib/public-routes.js', ...sourcesFor(p.path)] : sourcesFor(p.path),
        { status: p.status, redirects: p.redirects, error: p.error }))
      continue
    }
    if (p.redirects.length) {
      out.push(finding('crawl.redirect', 'warn', p.path, `${p.path} redirects before answering`,
        `Chain: ${p.redirects.join(' → ')}. Links and the sitemap should point at the final URL.`,
        'Update the link or sitemap entry to the final URL.', sourcesFor(p.path), { redirects: p.redirects }))
    }
    if (p.ms > 1500) {
      out.push(finding('crawl.slow', 'warn', p.path, `${p.path} took ${Math.round(p.ms)} ms to respond`,
        'Over 1.5 s for the HTML alone, before any asset loads. A cold render function or a slow database read are the usual causes.',
        'Check the render-page function duration in Vercel.', RENDER_SOURCES, { ms: p.ms }))
    }
    if (p.bytes > 300_000) {
      out.push(finding('crawl.heavy', 'info', p.path, `${p.path} is ${Math.round(p.bytes / 1024)} kB of HTML`,
        'Large documents slow the first byte-to-paint for crawlers and readers alike.',
        'Trim inlined content or split the page.', sourcesFor(p.path), { bytes: p.bytes }))
    }
  }

  // ── shells: the finding behind most of the rest ──
  const bareShells = ok.filter((p) => p.parsed.isShell && !p.parsed.hasOwnHead)
  const indexableBare = bareShells.filter(isIndexable)
  if (indexableBare.length) {
    out.push(finding('prerender.shell', 'error', null,
      `${indexableBare.length} indexable page(s) ship the bare SPA shell: no title, description or canonical of their own`,
      `A crawler that does not run JavaScript sees an empty page titled "Pilates Physics" on: ${indexableBare.map((p) => p.path).join(', ')}.`,
      'Add the route to PUBLIC_ROUTES and PAGE_META, and to the render-page rewrite in vercel.json, so its head is injected server side.',
      [...RENDER_SOURCES, ...META_SOURCES, 'api/_lib/public-routes.js'], { paths: indexableBare.map((p) => p.path) }))
  }
  const headOnly = ok.filter((p) => p.parsed.isShell && p.parsed.hasOwnHead && isIndexable(p))
  if (headOnly.length) {
    out.push(finding('prerender.body_empty', 'info', null,
      `${headOnly.length} page(s) carry their own head but an empty body until JavaScript runs`,
      `Google renders JavaScript and sees the full page; crawlers and AI agents that do not see only the head on: ${headOnly.map((p) => p.path).join(', ')}. Headings, alt text and internal links on these pages cannot be checked from raw HTML.`,
      'Acceptable for now. If a page should rank on its body text, render a static summary into #root in api/_lib/prerender.js the way blog posts are.',
      RENDER_SOURCES, { paths: headOnly.map((p) => p.path) }))
  }
  for (const p of bareShells.filter((s) => NOINDEX_EXPECTED.includes(s.path) && !isNoindex(s))) {
    out.push(finding('noindex.not_in_raw_html', 'warn', p.path, `${p.path} is meant to be noindex, but the raw HTML does not say so`,
      'The page sets robots=noindex from JavaScript. A crawler that does not run it sees an indexable page titled "Pilates Physics".',
      'Serve the noindex as an X-Robots-Tag header from vercel.json for this path, as /offer/* already does.',
      ['vercel.json', ...sourcesFor(p.path)]))
  }

  // ── viewport (index.html, so once) ──
  const vp = home?.parsed?.viewport ?? ok[0]?.parsed?.viewport ?? null
  if (vp) {
    const noZoom = /user-scalable\s*=\s*(no|0)/i.test(vp)
    const maxScale = /maximum-scale\s*=\s*([\d.]+)/i.exec(vp)
    if (noZoom || (maxScale && Number(maxScale[1]) < 5)) {
      out.push(finding('viewport.no_zoom', 'warn', null, 'The viewport meta disables pinch-zoom',
        `"${vp}". Lighthouse fails this under both SEO and accessibility, and it is a mobile-usability signal.`,
        'Drop user-scalable=no and maximum-scale from the viewport meta in index.html.', ['index.html'], { viewport: vp }))
    }
  }

  // ── per-page head, social, structure, schema ──
  const withHead = ok.filter((p) => p.parsed.hasOwnHead)
  const titles = new Map()
  const descriptions = new Map()

  for (const p of withHead) {
    const d = p.parsed
    const src = sourcesFor(p.path)
    const metaSrc = p.path.startsWith('/blog/') ? src : [...src, ...META_SOURCES]
    const selfUrl = `${site.origin}${p.path === '/' ? '/' : p.path}`
    const indexable = isIndexable(p)

    if (indexable) {
      if (d.title) titles.set(d.title, [...(titles.get(d.title) ?? []), p.path])
      if (d.description) descriptions.set(d.description, [...(descriptions.get(d.description) ?? []), p.path])
    }

    // head
    if (!d.title) {
      out.push(finding('head.title_missing', 'error', p.path, `${p.path} has no <title>`,
        'The title is the headline in every search result.', 'Set the title in PAGE_META.', metaSrc))
    } else if (d.title.length < TITLE_MIN || d.title.length > TITLE_MAX) {
      out.push(finding('head.title_length', 'warn', p.path, `${p.path} title is ${d.title.length} characters`,
        `"${d.title}". Google shows roughly ${TITLE_MIN} to ${TITLE_MAX}; longer is cut, shorter wastes the slot. " | Pilates Physics" is 18 of them.`,
        'Rewrite the title to fit.', metaSrc, { title: d.title }))
    }
    if (!d.description) {
      out.push(finding('head.description_missing', 'error', p.path, `${p.path} has no meta description`,
        'Google writes its own snippet when there is none, and it is rarely the one you would pick.',
        p.path.startsWith('/blog/') ? 'Give the post an excerpt.' : 'Set the description in PAGE_META.', metaSrc))
    } else if (d.description.length < DESC_MIN || d.description.length > DESC_MAX) {
      out.push(finding('head.description_length', 'warn', p.path, `${p.path} description is ${d.description.length} characters`,
        `Google shows roughly ${DESC_MIN} to ${DESC_MAX}.`,
        p.path.startsWith('/blog/') ? 'Rewrite the post excerpt to fit.' : 'Rewrite the description to fit.', metaSrc,
        { description: d.description }))
    }
    if (indexable) {
      if (!d.canonical.startsWith(site.origin)) {
        out.push(finding('head.canonical_offhost', 'error', p.path, `${p.path} canonical points off-host`,
          `Canonical is ${d.canonical}; the page lives on ${site.origin}.`,
          'Point the canonical at this site.', metaSrc, { canonical: d.canonical }))
      } else if (d.canonical.replace(/\/$/, '') !== selfUrl.replace(/\/$/, '')) {
        out.push(finding('head.canonical_mismatch', 'warn', p.path, `${p.path} canonical points at a different page`,
          `Canonical is ${d.canonical}. That tells Google this page is a copy of that one.`,
          'Point the canonical at the page itself unless it really is a duplicate.', metaSrc, { canonical: d.canonical }))
      }
    } else if (isNoindex(p) && p.source === 'sitemap') {
      out.push(finding('noindex.in_sitemap', 'error', p.path, `${p.path} is in the sitemap but marked noindex`,
        'The sitemap asks Google to index it and the page tells Google not to.',
        'Remove it from PUBLIC_ROUTES or drop the noindex.', ['api/_lib/public-routes.js', ...src]))
    }

    // social
    const missingOg = [
      ['og:title', d.ogTitle],
      ['og:description', d.ogDescription],
      ['og:url', d.ogUrl],
    ]
      .filter(([, v]) => !v)
      .map(([k]) => k)
    if (missingOg.length) {
      out.push(finding('social.og_missing', 'warn', p.path, `${p.path} is missing ${missingOg.join(', ')}`,
        'Messaging apps and social sites read these to build the link preview.',
        'buildHeadTags in api/_lib/prerender.js emits all three; check the page reached it.', metaSrc, { missing: missingOg }))
    }
    if (!d.ogImage) {
      out.push(finding('social.og_image_missing', 'warn', p.path, `${p.path} has no og:image`,
        'A pasted link unfurls with no picture.', 'Set image in PAGE_META, or a featured image on the post.', metaSrc))
    } else {
      const check = site.imageChecks[d.ogImage]
      if (check && (check.status !== 200 || !(check.contentType ?? '').startsWith('image/'))) {
        out.push(finding('social.og_image_unreachable', 'error', p.path, `${p.path} og:image does not resolve to an image`,
          `${d.ogImage} answered ${check.status} ${check.contentType ?? ''}.`, 'Fix the image path.', metaSrc,
          { ogImage: d.ogImage, ...check }))
      }
    }

    // schema
    if (d.jsonLd.count > d.jsonLd.parsed) {
      out.push(finding('schema.invalid_json', 'error', p.path, `${p.path} has ${d.jsonLd.count - d.jsonLd.parsed} JSON-LD block(s) that do not parse`,
        'Invalid structured data is ignored, and Search Console reports it as an error.',
        'Check the JSON-LD builders in src/lib/pageMeta.js.', META_SOURCES))
    }
    for (const block of d.jsonLd.blocks) {
      for (const node of jsonLdNodes(block)) {
        const required = REQUIRED_FIELDS[node['@type']]
        if (!required) continue
        const missing = required.filter((k) => !node[k])
        if (missing.length) {
          out.push(finding(`schema.${node['@type'].toLowerCase()}_fields`, 'warn', p.path,
            `${p.path} ${node['@type']} is missing ${missing.join(', ')}`,
            `Google needs these to show the page as a ${node['@type']} result.`,
            'Fill them in the builder in src/lib/pageMeta.js (or src/lib/workshopJsonLd.js).',
            ['src/lib/pageMeta.js', 'src/lib/workshopJsonLd.js'], { missing }))
        }
      }
    }

    // structure only means something on rendered content
    if (!d.isShell) {
      if (d.h1Count === 0) {
        out.push(finding('structure.h1_missing', 'warn', p.path, `${p.path} has no <h1>`,
          'Every page needs one top-level heading that says what it is.', 'Add an h1.', src))
      } else if (d.h1Count > 1) {
        out.push(finding('structure.h1_multiple', 'warn', p.path, `${p.path} has ${d.h1Count} <h1> elements`,
          'More than one h1 blurs what the page is about. In a blog post, a "# " heading in the markdown is an h1.',
          'Demote the extras to h2.', src, { h1Count: d.h1Count }))
      }
      for (let i = 1; i < d.headings.length; i++) {
        if (d.headings[i] > d.headings[i - 1] + 1) {
          out.push(finding('structure.heading_order', 'info', p.path, `${p.path} skips a heading level`,
            `An h${d.headings[i - 1]} is followed by an h${d.headings[i]}. Screen readers and Lighthouse flag the jump.`,
            'Use the next level down.', src, { headings: d.headings }))
          break
        }
      }
      if (d.images.withoutAlt > 0) {
        out.push(finding('structure.img_alt', 'warn', p.path, `${p.path} has ${d.images.withoutAlt} image(s) without alt text`,
          'Alt text is what image search and screen readers get.', 'Add alt text to each image, or alt="" for decoration.',
          src, d.images))
      }
      if (d.internalLinks.length === 0) {
        out.push(finding('structure.no_internal_links', 'info', p.path, `${p.path} links to no other page`,
          'Crawlers move by links; a dead end is a page that passes nothing on.', 'Link to related pages.', src))
      }
    }
  }

  // ── duplicates across the indexable pages ──
  for (const [title, paths] of titles) {
    if (paths.length > 1) {
      out.push(finding('head.duplicate_title', 'error', null, `${paths.length} pages share the title "${title.slice(0, 60)}"`,
        `${paths.join(', ')}. Google treats them as competing for the same query.`, 'Give each page its own title.',
        META_SOURCES, { title, paths }))
    }
  }
  for (const [description, paths] of descriptions) {
    if (paths.length > 1) {
      out.push(finding('head.duplicate_description', 'warn', null, `${paths.length} pages share one description`,
        `${paths.join(', ')}.`, 'Give each page its own description.', META_SOURCES, { description, paths }))
    }
  }

  // ── sitemap coverage ──
  const listed = new Set(site.sitemap.paths)
  const orphans = ok.filter(
    (p) => p.source === 'link' && isIndexable(p) && !listed.has(p.path) && !NOINDEX_EXPECTED.includes(p.path),
  )
  if (orphans.length) {
    out.push(finding('sitemap.orphan', 'warn', null, `${orphans.length} indexable page(s) are linked but not in the sitemap`,
      `${orphans.map((p) => p.path).join(', ')}. Google will likely find them anyway; listing them says they matter and gives a lastmod.`,
      'Add them to PUBLIC_ROUTES, or to EXCLUDED_ROUTE_PATTERNS with a noindex if they should stay out.',
      ['api/_lib/public-routes.js'], { paths: orphans.map((p) => p.path) }))
  }

  return out
}

// ─── PageSpeed Insights ─────────────────────────────────────────────────────

const LH_SEO = ['viewport', 'document-title', 'meta-description', 'http-status-code', 'link-text', 'crawlable-anchors', 'is-crawlable', 'robots-txt', 'image-alt', 'hreflang', 'canonical', 'font-size', 'structured-data', 'tap-targets']
const LH_A11Y = ['meta-viewport', 'color-contrast', 'image-alt', 'heading-order', 'link-name', 'button-name', 'html-has-lang', 'document-title', 'label', 'aria-allowed-attr', 'target-size']

/**
 * Findings from one PageSpeed run. Lighthouse renders JavaScript first, so its
 * SEO score says little about what a non-rendering crawler sees; its failed
 * audits are listed as info so nothing it caught is lost.
 */
export function psiFindings(path, psi) {
  const out = []
  const cats = psi.lighthouseResult?.categories ?? {}
  const audits = psi.lighthouseResult?.audits ?? {}
  const score = (k) => (cats[k]?.score == null ? null : Math.round(cats[k].score * 100))
  const num = (id) => (typeof audits[id]?.numericValue === 'number' ? audits[id].numericValue : null)
  const src = ['index.html', 'src/index.css', ...sourcesFor(path)]

  const perf = score('performance')
  if (perf !== null && perf < 90) {
    out.push(finding('psi.performance', perf < 50 ? 'error' : 'warn', path, `${path} mobile performance score ${perf}`,
      `Lab run. LCP ${audits['largest-contentful-paint']?.displayValue ?? '?'}, TBT ${audits['total-blocking-time']?.displayValue ?? '?'}, CLS ${audits['cumulative-layout-shift']?.displayValue ?? '?'}.`,
      'See the LCP and blocking findings below; the single 500 kB+ JavaScript bundle and the hero images are the usual suspects.',
      src, { performance: perf }))
  }
  const lcp = num('largest-contentful-paint')
  if (lcp !== null && lcp > 2500) {
    out.push(finding('psi.lcp', lcp > 4000 ? 'error' : 'warn', path, `${path} LCP is ${(lcp / 1000).toFixed(1)} s on mobile`,
      'Google\'s "good" threshold is 2.5 s. The largest element is usually the hero image or the first text block waiting on a web font.',
      'Preload the LCP image, give hero images explicit dimensions, and split the JavaScript bundle by route.', src, { lcp }))
  }
  const cls = num('cumulative-layout-shift')
  if (cls !== null && cls > 0.1) {
    out.push(finding('psi.cls', cls > 0.25 ? 'error' : 'warn', path, `${path} layout shift is ${cls.toFixed(2)}`,
      'Content moves after first paint. Threshold 0.1.', 'Reserve space for images, embeds and fonts.', src, { cls }))
  }
  const tbt = num('total-blocking-time')
  if (tbt !== null && tbt > 200) {
    out.push(finding('psi.tbt', tbt > 600 ? 'error' : 'warn', path, `${path} blocks the main thread for ${Math.round(tbt)} ms`,
      'Long tasks during load delay interaction. Threshold 200 ms.', 'Lazy-load routes in src/App.jsx so the entry chunk shrinks.',
      ['src/App.jsx', 'src/main.jsx'], { tbt }))
  }
  const a11y = score('accessibility')
  if (a11y !== null && a11y < 90) {
    out.push(finding('psi.accessibility', 'warn', path, `${path} accessibility score ${a11y}`, 'Below 90.',
      'See the audit list below.', src, { accessibility: a11y }))
  }
  const failed = (ids) =>
    Object.entries(audits)
      .filter(([id, a]) => ids.includes(id) && a.score !== null && a.score < 1 && a.scoreDisplayMode !== 'informative')
      .map(([id, a]) => ({ id, title: a.title ?? id }))
  for (const f of failed(LH_A11Y)) {
    out.push(finding(`psi.a11y.${f.id}`, 'info', path, `${path}: ${f.title}`, 'Failed Lighthouse accessibility audit.', 'Fix per the audit.', src))
  }
  for (const f of failed(LH_SEO)) {
    out.push(finding(`psi.seo.${f.id}`, 'info', path, `${path}: ${f.title}`, 'Failed Lighthouse SEO audit (rendered DOM).', 'Fix per the audit.', src))
  }
  return out
}

/** The summary the Audit tab shows per PSI page, so the UI never has to know
 *  the PSI response shape. */
export function psiSummary(psi) {
  const cats = psi.lighthouseResult?.categories ?? {}
  const audits = psi.lighthouseResult?.audits ?? {}
  const scores = {}
  for (const [k, v] of Object.entries(cats)) scores[k] = v.score == null ? null : Math.round(v.score * 100)
  const lab = {}
  for (const id of ['largest-contentful-paint', 'cumulative-layout-shift', 'total-blocking-time', 'first-contentful-paint', 'speed-index', 'interaction-to-next-paint']) {
    if (audits[id]?.displayValue) lab[id] = audits[id].displayValue
  }
  const field = psi.loadingExperience?.metrics ?? null
  return {
    scores,
    lab,
    field: field && Object.keys(field).length ? field : null,
    overall: psi.loadingExperience?.overall_category ?? null,
  }
}
