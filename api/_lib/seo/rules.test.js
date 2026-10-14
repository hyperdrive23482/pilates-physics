import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildHeadTags, injectIntoShell, renderArticleHtml } from '../prerender.js'
import { HOME_JSON_LD, PAGE_META, blogPostingJsonLd } from '../../../src/lib/pageMeta.js'
import { jsonLdNodes, parsePage, psiFindings, runRules } from './rules.js'

// Fixtures are built with the real head injection (api/_lib/prerender.js), so
// these tests pin the audit to what the site actually serves.

const ORIGIN = 'https://pilatesphysics.com'

const SHELL = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Pilates Physics</title>
    <script type="module" crossorigin src="/assets/index.js"></script>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`

const staticPage = (path, extra = {}) =>
  injectIntoShell(SHELL, { headTags: buildHeadTags({ ...PAGE_META[path], path, ...extra }) })

const POST = {
  slug: 'springs',
  title: 'Why a red spring is not one weight',
  excerpt: 'Spring load changes through the range of motion, and that changes what the client feels at each point of the exercise.',
  body_html: '<h2>Hooke</h2><p>Text <a href="/spring-calculator">calculator</a></p><img src="/a.png">',
  published_at: '2026-03-10T00:00:00Z',
  featured_image_url: 'https://cdn.example/feature.jpg',
  featured_image_alt: 'A spring',
}
const postHtml = () => {
  const url = `${ORIGIN}/blog/springs`
  return injectIntoShell(SHELL, {
    headTags: buildHeadTags({
      path: '/blog/springs',
      title: POST.title,
      description: POST.excerpt,
      canonical: url,
      image: POST.featured_image_url,
      type: 'article',
      jsonLd: blogPostingJsonLd(POST, url),
    }),
    bodyHtml: renderArticleHtml(POST),
  })
}

function page(path, html, over = {}) {
  const status = over.status ?? (html ? 200 : 404)
  return {
    path,
    status,
    redirects: [],
    ms: 40,
    bytes: html?.length ?? 0,
    contentType: 'text/html',
    xRobotsTag: null,
    html,
    source: 'sitemap',
    ...over,
    parsed: html && status === 200 ? parsePage(html, ORIGIN, path) : null,
  }
}

function site(pages, over = {}) {
  return {
    origin: ORIGIN,
    robotsTxt: `User-agent: *\nAllow: /\nSitemap: ${ORIGIN}/sitemap.xml\n`,
    sitemap: {
      ok: true,
      urls: pages.filter((p) => p.source === 'sitemap').map((p) => ORIGIN + p.path),
      paths: pages.filter((p) => p.source === 'sitemap').map((p) => p.path),
      offHost: [],
    },
    pages,
    imageChecks: {},
    ...over,
  }
}

const ids = (fs) => fs.map((f) => f.ruleId)

test('parsePage tells the three kinds of page apart', () => {
  const bare = parsePage(SHELL, ORIGIN, '/login')
  assert.equal(bare.isShell, true)
  assert.equal(bare.hasOwnHead, false)

  const head = parsePage(staticPage('/about'), ORIGIN, '/about')
  assert.equal(head.isShell, true)
  assert.equal(head.hasOwnHead, true)
  assert.equal(head.title, 'About Kaleen Canevari | Pilates Physics')
  assert.equal(head.canonical, `${ORIGIN}/about`)

  const post = parsePage(postHtml(), ORIGIN, '/blog/springs')
  assert.equal(post.isShell, false)
  assert.equal(post.h1Count, 1)
  assert.deepEqual(post.jsonLd.types, ['BlogPosting'])
  assert.deepEqual(post.internalLinks, ['/blog', '/spring-calculator'])
  assert.deepEqual(post.images, { total: 2, withoutAlt: 1 })
})

test('jsonLdNodes reads @graph members', () => {
  assert.deepEqual(jsonLdNodes(HOME_JSON_LD).map((n) => n['@type']), ['Organization', 'WebSite'])
})

test('a bare shell on an indexable route is one site-level error', () => {
  const out = runRules(site([page('/about', SHELL), page('/education', SHELL)]))
  const shell = out.find((f) => f.ruleId === 'prerender.shell')
  assert.ok(shell)
  assert.equal(shell.path, null)
  assert.deepEqual(shell.evidence.paths, ['/about', '/education'])
  assert.ok(!ids(out).includes('head.title_missing'), 'bare shells must not also produce per-page head findings')
})

test('head-only pages get head rules and one info about the empty body', () => {
  const out = runRules(site([page('/', staticPage('/', { jsonLd: HOME_JSON_LD })), page('/about', staticPage('/about'))]))
  assert.ok(!ids(out).includes('prerender.shell'))
  const body = out.find((f) => f.ruleId === 'prerender.body_empty')
  assert.equal(body.severity, 'info')
  assert.deepEqual(body.evidence.paths, ['/', '/about'])
  assert.ok(!ids(out).includes('structure.h1_missing'), 'structure rules cannot run on an empty body')
  assert.ok(!ids(out).includes('head.canonical_mismatch'))
})

test('the home title is flagged for length', () => {
  const out = runRules(site([page('/', staticPage('/'))]))
  const t = out.find((f) => f.ruleId === 'head.title_length')
  assert.equal(t?.path, '/')
})

test('a blog post gets structure and schema rules', () => {
  const out = runRules(site([page('/blog/springs', postHtml())]))
  assert.ok(ids(out).includes('structure.img_alt'))
  assert.ok(ids(out).includes('structure.heading_order') === false, 'h1 then h2 is fine')
  assert.ok(!ids(out).some((id) => id.startsWith('schema.')))
})

test('a canonical pointing at Substack is a mismatch', () => {
  const html = injectIntoShell(SHELL, {
    headTags: buildHeadTags({ path: '/blog/x', title: 'A post title that is long enough', description: POST.excerpt, canonical: 'https://kaleen.substack.com/p/x' }),
  })
  const out = runRules(site([page('/blog/x', html)]))
  assert.ok(ids(out).includes('head.canonical_offhost'))
})

test('missing Event fields are named', () => {
  const graph = { '@context': 'https://schema.org', '@graph': [{ '@type': 'Event', name: 'PP 101' }] }
  const out = runRules(site([page('/pilates-physics-101', staticPage('/pilates-physics-101', { jsonLd: graph }))]))
  const f = out.find((x) => x.ruleId === 'schema.event_fields')
  assert.deepEqual(f.evidence.missing, ['startDate', 'location', 'eventAttendanceMode'])
})

test('a noindex-by-design page served as a bare shell is flagged; an X-Robots-Tag clears it', () => {
  const flagged = runRules(site([page('/login', SHELL, { source: 'extra' })]))
  assert.ok(ids(flagged).includes('noindex.not_in_raw_html'))
  const fixed = runRules(site([page('/login', SHELL, { source: 'extra', xRobotsTag: 'noindex' })]))
  assert.ok(!ids(fixed).includes('noindex.not_in_raw_html'))
})

test('robots, sitemap, status and orphans', () => {
  const out = runRules(
    site(
      [
        page('/about', staticPage('/about')),
        page('/blog/gone', null, { status: 404 }),
        page('/help', staticPage('/help'), { source: 'link' }),
        page('/portal', SHELL, { source: 'link' }),
      ],
      { robotsTxt: 'User-agent: *\nDisallow: /\n' },
    ),
  )
  assert.ok(ids(out).includes('robots.no_sitemap'))
  assert.ok(ids(out).includes('robots.blocks_all'))
  assert.equal(out.find((f) => f.ruleId === 'crawl.status').severity, 'error')
  const orphan = out.find((f) => f.ruleId === 'sitemap.orphan')
  assert.deepEqual(orphan.evidence.paths, ['/help'], 'app routes are never orphans')
})

test('duplicate titles across indexable pages', () => {
  const html = staticPage('/about')
  const out = runRules(site([page('/about', html), page('/terms', html.replace('/about"', '/terms"'))]))
  assert.ok(ids(out).includes('head.duplicate_title'))
})

test('PageSpeed findings from a lab result', () => {
  const out = psiFindings('/', {
    lighthouseResult: {
      categories: { performance: { score: 0.42 }, accessibility: { score: 0.95 } },
      audits: {
        'largest-contentful-paint': { numericValue: 5200, displayValue: '5.2 s' },
        'total-blocking-time': { numericValue: 150 },
        'image-alt': { score: 0, title: 'Images lack alt' },
      },
    },
  })
  assert.deepEqual(ids(out), ['psi.performance', 'psi.lcp', 'psi.a11y.image-alt', 'psi.seo.image-alt'])
  assert.equal(out[0].severity, 'error')
})
