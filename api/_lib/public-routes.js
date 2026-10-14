// The single source of truth for which routes are public, indexable pages.
//
// Feeds the sitemap today and, later, the SEO crawl seed and CONTENT_PATHS.
// A unit test (public-routes.test.js) reads src/App.jsx and fails when a
// route is added there without being either listed here or matched by an
// exclusion below, so the two cannot drift.

export const SITE_URL = 'https://pilatesphysics.com'

// Static marketing routes, in roughly the order a crawler should care.
export const PUBLIC_ROUTES = [
  '/',
  '/about',
  '/spring-calculator',
  '/education',
  '/how-a-reformer-works',
  '/pilates-physics-101',
  '/pilates-physics-102',
  '/mentorship',
  '/scholarship',
  '/blog',
  '/help',
  '/terms',
  '/privacy',
  '/links',
]

// Routes that are deliberately not in the sitemap: gated, transactional,
// auth, or legacy redirects. A route in App.jsx must be in PUBLIC_ROUTES or
// match one of these.
export const EXCLUDED_ROUTE_PATTERNS = [
  /^\/offer(\/|$)/,
  /^\/portal(\/|$)/,
  /^\/admin(\/|$)/,
  /^\/auth(\/|$)/,
  /^\/survey(\/|$)/,
  /^\/survey-101$/,
  /^\/workshops(\/|$)/, // generic sales page by slug; the branded pages are listed
  /^\/courses?(\/|$)/, // legacy redirects
  /^\/login$/,
  /^\/signup$/,
  /^\/forgot-password$/,
  /^\/set-password$/,
  /^\/profile$/,
  /^\/subscription-confirmed$/,
  /^\/springs-101$/, // redirects to /spring-calculator
  /^\/mentorship\/apply$/, // application form, not a landing page
  /^\/blog\/:slug$/, // blog posts are enumerated from the database
]

export function isExcludedRoute(path) {
  return EXCLUDED_ROUTE_PATTERNS.some((re) => re.test(path))
}
