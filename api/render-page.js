import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { supabaseAdmin } from './_lib/supabase-admin.js'
import {
  BLOG_POST_SELECT,
  buildHeadTags,
  injectIntoShell,
  normalizePath,
  resolvePage,
} from './_lib/prerender.js'

// GET /api/render-page?path=/about (vercel.json rewrites every public route
// and /blog/:slug here; everything else stays a plain SPA rewrite).
//
// Serves the built shell (dist/app-shell.html, renamed from index.html by the
// Vite config so Vercel does not serve it for "/" before the rewrite runs)
// with the page's head tags injected. See api/_lib/prerender.js.

let cachedShell = null

async function loadShell(req) {
  if (cachedShell) return cachedShell
  try {
    cachedShell = await readFile(path.join(process.cwd(), 'dist', 'app-shell.html'), 'utf8')
    return cachedShell
  } catch (err) {
    // includeFiles should have bundled it; fall back to the static copy this
    // same deployment serves.
    console.error('render-page: dist/app-shell.html not bundled, fetching it', err.message)
  }
  const proto = req.headers['x-forwarded-proto'] || 'https'
  const res = await fetch(`${proto}://${req.headers.host}/app-shell.html`)
  if (!res.ok) throw new Error(`shell fetch ${res.status}`)
  cachedShell = await res.text()
  return cachedShell
}

const fetchers = {
  async post(slug) {
    const { data, error } = await supabaseAdmin
      .from('blog_posts')
      .select(BLOG_POST_SELECT)
      .eq('slug', slug)
      .eq('status', 'published')
      .maybeSingle()
    if (error) throw error
    return data
  },
  // Same query as useCurrentWorkshop in src/hooks/useWorkshops.js.
  async currentWorkshop(seriesPrefix) {
    const { data, error } = await supabaseAdmin
      .from('webinars')
      .select('*')
      .ilike('slug', `${seriesPrefix}-%`)
      .eq('kind', 'webinar')
      .in('status', ['upcoming', 'live'])
      .gt('scheduled_at', new Date().toISOString())
      .order('scheduled_at', { ascending: true })
      .limit(1)
      .maybeSingle()
    if (error) throw error
    return data
  },
  async webinarBySlug(slug) {
    const { data, error } = await supabaseAdmin
      .from('webinars')
      .select('id, slug, title, price_cents, status')
      .eq('slug', slug)
      .maybeSingle()
    if (error) throw error
    return data
  },
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD')
    return res.status(405).end()
  }

  let shell
  try {
    shell = await loadShell(req)
  } catch (err) {
    console.error('render-page: no shell', err)
    return res.status(500).send('Something went wrong. Please refresh the page.')
  }

  const pagePath = normalizePath(req.query?.path)
  let html = shell
  let status = 200
  try {
    const page = await resolvePage(pagePath, fetchers)
    status = page.status
    html = injectIntoShell(shell, {
      headTags: buildHeadTags(page.head),
      bodyHtml: page.bodyHtml,
      seed: page.seed,
    })
  } catch (err) {
    // Never fail a page view over SEO: serve the bare shell.
    console.error('render-page: injection failed for', pagePath, err)
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  // Edge cache per deployment; a blog edit shows up within ten minutes.
  res.setHeader(
    'Cache-Control',
    status === 200
      ? 'public, max-age=0, s-maxage=600, stale-while-revalidate=86400'
      : 'public, max-age=0, s-maxage=60',
  )
  return res.status(status).send(req.method === 'HEAD' ? '' : html)
}
