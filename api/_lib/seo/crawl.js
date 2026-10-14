import { parsePage } from './rules.js'

// The SEO audit's crawler: turns an origin into the site snapshot rules.js
// reads. Ported from remo's supabase/functions/_shared/seo-crawl.ts.
//
// READ-ONLY. Every request is a GET (or a HEAD, for og:image reachability),
// and it always targets the production origin, even from stage: the findings
// are only actionable against prod.
//
// What it fetches, in order:
//   1. /robots.txt and /sitemap.xml.
//   2. Every on-host sitemap URL plus EXTRA_PATHS, at CONCURRENCY.
//   3. Internal links found in those pages and not yet fetched, up to
//      MAX_PAGES in total, so an unlisted page surfaces as an orphan.
//   4. One HEAD per distinct og:image URL.
//
// Redirects are followed by hand so the chain is recorded.

/** Pages audited even though the sitemap leaves them out on purpose. */
export const EXTRA_PATHS = ['/login', '/signup']

const CONCURRENCY = 4
const MAX_PAGES = 80
const PAGE_TIMEOUT_MS = 10_000
const HEAD_TIMEOUT_MS = 8_000
const MAX_HOPS = 6
const USER_AGENT = 'pilatesphysics-seo-audit/1.0 (+https://pilatesphysics.com)'

async function fetchWithChain(url) {
  const chain = []
  let current = url
  for (let hop = 0; hop < MAX_HOPS; hop++) {
    let res
    try {
      res = await fetch(current, {
        redirect: 'manual',
        headers: { 'User-Agent': USER_AGENT, Accept: 'text/html,application/xhtml+xml' },
        signal: AbortSignal.timeout(PAGE_TIMEOUT_MS),
      })
    } catch (e) {
      return { res: null, chain, error: e instanceof Error ? e.message : String(e) }
    }
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get('location')
      await res.body?.cancel().catch(() => {})
      if (!loc) return { res, chain }
      current = new URL(loc, current).toString()
      chain.push(`${res.status} → ${current}`)
      continue
    }
    return { res, chain }
  }
  return { res: null, chain, error: 'too many redirects' }
}

async function fetchPage(origin, path, source) {
  const t0 = performance.now()
  const { res, chain, error } = await fetchWithChain(`${origin}${path}`)
  if (!res) {
    return { path, status: 0, redirects: chain, ms: performance.now() - t0, bytes: 0, contentType: null, xRobotsTag: null, html: null, error, source, parsed: null }
  }
  const contentType = res.headers.get('content-type')
  const xRobotsTag = res.headers.get('x-robots-tag')
  const text = await res.text().catch(() => '')
  const ms = performance.now() - t0
  const isHtml = (contentType ?? '').includes('html')
  const html = res.status === 200 && isHtml ? text : null
  return {
    path,
    status: res.status,
    redirects: chain,
    ms,
    bytes: Buffer.byteLength(text),
    contentType,
    xRobotsTag,
    html,
    source,
    parsed: html ? parsePage(html, origin, path) : null,
  }
}

async function mapLimit(items, limit, fn) {
  const out = new Array(items.length)
  let next = 0
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const i = next++
        out[i] = await fn(items[i])
      }
    }),
  )
  return out
}

/** The body, or null when the URL is missing or answers with the SPA shell
 *  (an un-rewritten /robots.txt or /sitemap.xml falls through to the app). */
async function fetchText(url, looksRight) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT }, signal: AbortSignal.timeout(PAGE_TIMEOUT_MS) })
    if (!res.ok) return null
    const text = await res.text()
    return looksRight(text) ? text : null
  } catch {
    return null
  }
}

const isRobots = (t) => !/^\s*<(!doctype|html)/i.test(t)
const isSitemap = (t) => /<(urlset|sitemapindex)[\s>]/i.test(t)

export function normalisePath(p) {
  let out = p.split('#')[0].split('?')[0]
  if (out.length > 1 && out.endsWith('/')) out = out.slice(0, -1)
  return out || '/'
}

/** Root-relative on-host paths and off-host URLs from a sitemap document. */
export function sitemapLocs(xml, origin) {
  const host = new URL(origin).host
  const urls = xml ? [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1]) : []
  const paths = []
  const offHost = []
  for (const u of urls) {
    try {
      const parsed = new URL(u)
      if (parsed.host === host) paths.push(normalisePath(decodeURIComponent(parsed.pathname)))
      else offHost.push(u)
    } catch {
      offHost.push(u)
    }
  }
  return { urls, paths, offHost }
}

export async function crawlSite(origin, opts = {}) {
  const base = origin.replace(/\/$/, '')
  const maxPages = opts.maxPages ?? MAX_PAGES

  const [robotsTxt, sitemapXml] = await Promise.all([
    fetchText(`${base}/robots.txt`, isRobots),
    fetchText(`${base}/sitemap.xml`, isSitemap),
  ])
  const { urls, paths, offHost } = sitemapLocs(sitemapXml, base)

  const seen = new Set()
  const queue = []
  const enqueue = (path, source) => {
    if (seen.has(path) || seen.size >= maxPages) return
    seen.add(path)
    queue.push({ path, source })
  }
  for (const p of paths) enqueue(p, 'sitemap')
  for (const p of EXTRA_PATHS) enqueue(p, 'extra')

  const pages = []
  // Breadth-first: fetch what is queued, then whatever those pages linked to
  // that we have not seen, until the queue empties or the cap is hit.
  while (queue.length) {
    const batch = queue.splice(0, queue.length)
    const results = await mapLimit(batch, CONCURRENCY, (item) => fetchPage(base, item.path, item.source))
    pages.push(...results)
    for (const page of results) {
      for (const link of page.parsed?.internalLinks ?? []) enqueue(normalisePath(link), 'link')
    }
  }

  const imageChecks = {}
  const images = new Set(pages.map((p) => p.parsed?.ogImage).filter(Boolean))
  await mapLimit([...images], CONCURRENCY, async (u) => {
    const abs = u.startsWith('http') ? u : `${base}${u.startsWith('/') ? '' : '/'}${u}`
    try {
      const r = await fetch(abs, { method: 'HEAD', headers: { 'User-Agent': USER_AGENT }, signal: AbortSignal.timeout(HEAD_TIMEOUT_MS) })
      await r.body?.cancel().catch(() => {})
      imageChecks[u] = { status: r.status, contentType: r.headers.get('content-type') }
    } catch {
      imageChecks[u] = { status: 0, contentType: null }
    }
  })

  return {
    origin: base,
    robotsTxt,
    sitemap: { ok: sitemapXml !== null, urls, paths, offHost },
    pages,
    imageChecks,
  }
}
