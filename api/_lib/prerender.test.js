import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { PUBLIC_ROUTES } from './public-routes.js'
import { PAGE_META } from '../../src/lib/pageMeta.js'
import {
  buildHeadTags,
  injectIntoShell,
  normalizePath,
  resolvePage,
  scriptJson,
} from './prerender.js'

const here = path.dirname(fileURLToPath(import.meta.url))
const vercel = JSON.parse(readFileSync(path.join(here, '..', '..', 'vercel.json'), 'utf8'))

const SHELL = `<!doctype html>
<html lang="en">
  <head>
    <title>Pilates Physics</title>
    <script type="module" crossorigin src="/assets/index.js"></script>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`

const noFetch = {
  post: async () => null,
  currentWorkshop: async () => null,
  webinarBySlug: async () => null,
}

test('every public route has head metadata', () => {
  const missing = PUBLIC_ROUTES.filter((r) => !PAGE_META[r]?.title || !PAGE_META[r]?.description)
  assert.deepEqual(missing, [])
})

test('vercel.json sends exactly the public routes and blog posts to render-page', () => {
  const toRender = vercel.rewrites.filter((r) => r.destination.startsWith('/api/render-page'))
  const listed = new Set()
  for (const r of toRender) {
    if (r.source === '/') listed.add('/')
    const m = r.source.match(/^\/:page\(([^)]+)\)$/)
    if (m) for (const p of m[1].split('|')) listed.add(`/${p}`)
  }
  assert.deepEqual([...listed].sort(), [...PUBLIC_ROUTES].sort())
  assert.ok(toRender.some((r) => r.source === '/blog/:slug'))
  const catchAll = vercel.rewrites.at(-1)
  assert.equal(catchAll.destination, '/app-shell.html', 'the SPA catch-all must stay last')
})

test('head tags escape values and carry the client hook marker', () => {
  const html = buildHeadTags({ title: 'A "quoted" <title>', description: 'x & y', path: '/about' })
  assert.match(html, /<title>A &quot;quoted&quot; &lt;title&gt; \| Pilates Physics<\/title>/)
  assert.match(html, /content="x &amp; y" data-head="1"/)
  assert.match(html, /<link rel="canonical" href="https:\/\/pilatesphysics.com\/about" data-head="1">/)
  assert.doesNotMatch(html, /robots/)
})

test('JSON in a script tag cannot close it', () => {
  assert.equal(scriptJson({ a: '</script>' }), '{"a":"\\u003c/script>"}')
})

test('injectIntoShell replaces the title, fills root and embeds the seed', () => {
  const out = injectIntoShell(SHELL, {
    headTags: '<title>T</title>',
    bodyHtml: '<article>hi</article>',
    seed: { post: { slug: 's', title: '</script><b>' } },
  })
  assert.equal((out.match(/<title>/g) || []).length, 1)
  assert.match(out, /<title>T<\/title>/)
  assert.match(out, /<div id="root"><article>hi<\/article><\/div>/)
  assert.match(out, /<script id="pp-prerender" type="application\/json">.*\\u003c\/script>/)
  assert.ok(out.indexOf('pp-prerender') < out.indexOf('</head>'))
})

test('injectIntoShell leaves an unexpected shell alone', () => {
  assert.equal(injectIntoShell('<html></html>', { headTags: '<title>T</title>' }), '<html></html>')
})

test('$ patterns in content are not treated as replacement tokens', () => {
  const out = injectIntoShell(SHELL, { headTags: '<title>$& costs $1</title>', bodyHtml: "$'" })
  assert.match(out, /<title>\$& costs \$1<\/title>/)
  assert.match(out, /<div id="root">\$'<\/div>/)
})

test('normalizePath trims trailing slashes and rejects junk', () => {
  assert.equal(normalizePath('/about/'), '/about')
  assert.equal(normalizePath('/'), '/')
  assert.equal(normalizePath(undefined), '/')
  assert.equal(normalizePath('https://evil.example'), '/')
})

test('a published post gets its own canonical, BlogPosting and article body', async () => {
  const post = {
    slug: 'springs',
    title: 'Springs',
    excerpt: 'About springs.',
    body_html: '<p>Body</p>',
    published_at: '2026-01-02T00:00:00Z',
    canonical_url: 'https://kaleen.substack.com/p/springs',
  }
  const page = await resolvePage('/blog/springs', { ...noFetch, post: async () => post })
  assert.equal(page.status, 200)
  assert.equal(page.head.canonical, 'https://pilatesphysics.com/blog/springs')
  assert.equal(page.head.jsonLd['@type'], 'BlogPosting')
  assert.equal(page.head.jsonLd.mainEntityOfPage['@id'], 'https://pilatesphysics.com/blog/springs')
  assert.match(page.bodyHtml, /<h1 class="blog-post__title">Springs<\/h1>/)
  assert.match(page.bodyHtml, /January 2, 2026/)
  assert.match(page.bodyHtml, /<p>Body<\/p>/)
  assert.equal(page.seed.post, post)
})

test('an unknown post is a noindex 404; a failed lookup is a plain 200', async () => {
  const missing = await resolvePage('/blog/nope', noFetch)
  assert.equal(missing.status, 404)
  assert.equal(missing.head.noindex, true)

  const failing = await resolvePage('/blog/nope', {
    ...noFetch,
    post: async () => {
      throw new Error('db down')
    },
  })
  assert.equal(failing.status, 200)
  assert.equal(failing.head.noindex, undefined)
})

test('static pages take PAGE_META and the workshop pages add their JSON-LD', async () => {
  const home = await resolvePage('/', noFetch)
  assert.equal(home.head.title, PAGE_META['/'].title)
  assert.ok(home.head.jsonLd['@graph'])

  const future = new Date(Date.now() + 7 * 864e5).toISOString()
  const pp101 = await resolvePage('/pilates-physics-101', {
    ...noFetch,
    currentWorkshop: async (prefix) => {
      assert.equal(prefix, 'PP-101')
      return { title: 'PP-101 Nov', scheduled_at: future, price_cents: 9900, status: 'upcoming' }
    },
  })
  const types = pp101.head.jsonLd['@graph'].map((n) => n['@type'])
  assert.deepEqual(types, ['Course', 'Event'])

  const reformer = await resolvePage('/how-a-reformer-works', {
    ...noFetch,
    webinarBySlug: async () => {
      throw new Error('db down')
    },
  })
  assert.equal(reformer.head.jsonLd['@type'], 'Course')
  assert.equal(reformer.head.jsonLd.offers, undefined)
})

test('a path outside the public list gets the bare defaults', async () => {
  const page = await resolvePage('/portal', noFetch)
  assert.deepEqual(page, { status: 200, head: { path: '/portal' } })
})
