import { useEffect } from 'react'

// Per-page <head> management without a dependency.
//
// index.html ships one global <title>; this hook overwrites it per route and
// upserts the meta and link tags Google and social cards read. Everything it
// adds carries data-head="1" so unmount removes only what this page set and
// the next page starts clean. Elements the shell already owns (the favicon
// links, viewport) are never touched.
//
// Today this runs client side only, so crawlers that do not execute JS see
// the shell. That is the open prerendering decision in the analytics plan;
// nothing here changes when it lands, the same values just get injected
// server side too.

export const SITE_NAME = 'Pilates Physics'
export const SITE_URL = 'https://pilatesphysics.com'
export const DEFAULT_DESCRIPTION =
  'Physics-based Pilates education from Kaleen Canevari, mechanical engineer and Pilates instructor. Understand the forces in every exercise and personalize every class.'
export const DEFAULT_IMAGE = `${SITE_URL}/images/homepage/hero-image.jpg`

const MARK = 'data-head'

function absolute(url) {
  if (!url) return null
  if (/^https?:\/\//i.test(url)) return url
  return `${SITE_URL}${url.startsWith('/') ? '' : '/'}${url}`
}

function upsert(selector, create, attrs) {
  let el = document.head.querySelector(selector)
  if (!el) {
    el = create()
    el.setAttribute(MARK, '1')
    document.head.appendChild(el)
  }
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v)
  return el
}

function metaByName(name, content) {
  return upsert(
    `meta[name="${name}"]`,
    () => {
      const m = document.createElement('meta')
      m.setAttribute('name', name)
      return m
    },
    { content },
  )
}

function metaByProperty(property, content) {
  return upsert(
    `meta[property="${property}"]`,
    () => {
      const m = document.createElement('meta')
      m.setAttribute('property', property)
      return m
    },
    { content },
  )
}

function link(rel, href) {
  return upsert(
    `link[rel="${rel}"]`,
    () => {
      const l = document.createElement('link')
      l.setAttribute('rel', rel)
      return l
    },
    { href },
  )
}

export function fullTitle(title) {
  if (!title) return SITE_NAME
  return title.endsWith(SITE_NAME) ? title : `${title} | ${SITE_NAME}`
}

/**
 * Set the document head for the current page.
 *
 * @param {object} opts
 * @param {string} [opts.title]        Page title; " | Pilates Physics" is appended.
 * @param {string} [opts.description]  Meta description, also used for og/twitter.
 * @param {string} [opts.canonical]    Absolute or site-relative canonical URL.
 *                                     Defaults to the current path on the site.
 * @param {string} [opts.image]        Absolute or site-relative og:image.
 * @param {string} [opts.type]         og:type, default "website".
 * @param {boolean} [opts.noindex]     Emit <meta name="robots" content="noindex">.
 */
export function useHead({ title, description, canonical, image, type, noindex } = {}) {
  useEffect(() => {
    const previousTitle = document.title
    const resolvedTitle = fullTitle(title)
    const resolvedDescription = description || DEFAULT_DESCRIPTION
    const path = window.location.pathname
    const resolvedCanonical = absolute(canonical) || `${SITE_URL}${path === '/' ? '/' : path.replace(/\/$/, '')}`
    const resolvedImage = absolute(image) || DEFAULT_IMAGE

    document.title = resolvedTitle
    const els = [
      metaByName('description', resolvedDescription),
      link('canonical', resolvedCanonical),
      metaByProperty('og:site_name', SITE_NAME),
      metaByProperty('og:title', resolvedTitle),
      metaByProperty('og:description', resolvedDescription),
      metaByProperty('og:image', resolvedImage),
      metaByProperty('og:url', resolvedCanonical),
      metaByProperty('og:type', type || 'website'),
      metaByName('twitter:card', 'summary_large_image'),
      metaByName('twitter:title', resolvedTitle),
      metaByName('twitter:description', resolvedDescription),
      metaByName('twitter:image', resolvedImage),
    ]
    if (noindex) els.push(metaByName('robots', 'noindex'))

    return () => {
      document.title = previousTitle
      for (const el of els) {
        if (el.getAttribute(MARK) === '1' && el.parentNode) el.parentNode.removeChild(el)
      }
    }
  }, [title, description, canonical, image, type, noindex])
}

/**
 * Inject a JSON-LD script for the current page. Pass null to emit nothing.
 * Re-serialises when the data changes (e.g. once a post or workshop loads).
 */
export function useJsonLd(data) {
  const json = data ? JSON.stringify(data) : null
  useEffect(() => {
    if (!json) return undefined
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.setAttribute(MARK, '1')
    script.text = json
    document.head.appendChild(script)
    return () => {
      if (script.parentNode) script.parentNode.removeChild(script)
    }
  }, [json])
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
