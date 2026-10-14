// Site-wide SEO constants and helpers, free of React and browser globals so
// the server side head injection (api/render-page.js) imports the same values
// the pages use. src/lib/head.js re-exports these for the pages.

export const SITE_NAME = 'Pilates Physics'
export const SITE_URL = 'https://pilatesphysics.com'
export const DEFAULT_DESCRIPTION =
  'Physics-based Pilates education from Kaleen Canevari, mechanical engineer and Pilates instructor. Understand the forces in every exercise and personalize every class.'
export const DEFAULT_IMAGE = `${SITE_URL}/images/homepage/hero-image.jpg`

export function absoluteUrl(url) {
  if (!url) return null
  if (/^https?:\/\//i.test(url)) return url
  return `${SITE_URL}${url.startsWith('/') ? '' : '/'}${url}`
}

export function canonicalForPath(path) {
  return `${SITE_URL}${path === '/' ? '/' : path.replace(/\/$/, '')}`
}

export function fullTitle(title) {
  if (!title) return SITE_NAME
  return title.endsWith(SITE_NAME) ? title : `${title} | ${SITE_NAME}`
}

// Shared structured-data fragments.
export const ORGANIZATION = {
  '@type': 'Organization',
  '@id': `${SITE_URL}/#organization`,
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/images/logos/yellow-bg-logo.jpg`,
  founder: { '@type': 'Person', name: 'Kaleen Canevari' },
}

export const AUTHOR = {
  '@type': 'Person',
  name: 'Kaleen Canevari',
  url: `${SITE_URL}/about`,
}
