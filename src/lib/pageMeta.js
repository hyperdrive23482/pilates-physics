import { AUTHOR, ORGANIZATION, SITE_NAME, SITE_URL } from './seo.js'
import { workshopJsonLd } from './workshopJsonLd.js'

// Title, description and share image for every public page, in one place.
//
// The pages read their <Head> props from here and api/render-page.js injects
// the same values into the HTML before any JavaScript runs, so a crawler or
// a link preview sees what the browser tab shows. A unit test fails when a
// route in PUBLIC_ROUTES has no entry. Keep this file free of React and
// browser globals; the server imports it.

// Lengths matter here: Google shows roughly 30 to 60 characters of a title
// (" | Pilates Physics" takes 18 of them) and 70 to 160 of a description.
// api/_lib/seo/rules.js flags anything outside those ranges.
export const HOME_DESCRIPTION =
  'Every body meets the spring differently. See why, get the cues to adjust for it, and build every class around the body in front of you.'

export const PP101_DESCRIPTION =
  'Learn the forces in the classes you teach so you can adapt Pilates to each client and progress them over time. Live on Zoom, 2.0 NPCP CECs, recording included.'

export const PP102_DESCRIPTION =
  'Take Pilates Physics beyond the reformer to the chair and cadillac, where force is applied differently. Live on Zoom, 2.0 NPCP CECs, recording included.'

export const REFORMER_DESCRIPTION =
  'An on-demand course on the mechanisms that make your reformer work. Eight modules, one hour, one NPCP CEC, taught by an engineer who designed one.'

export const BLOG_FALLBACK_IMAGE = '/images/homepage/blog-hero.jpg'

export const PAGE_META = {
  '/': {
    title: 'Physics-based Pilates teacher education',
    description: HOME_DESCRIPTION,
    canonical: '/',
  },
  '/about': {
    title: 'About Kaleen Canevari',
    description:
      'Pilates instructor, mechanical engineer and software founder. Kaleen designed reformers at Balanced Body and teaches the physics good teachers already use.',
    image: '/images/about/kaleen-sitting.jpg',
    type: 'profile',
  },
  '/spring-calculator': {
    title: 'Free Pilates Spring Load Calculator',
    description:
      'A red spring is not a single weight. The free Spring Load Calculator shows how Pilates springs really load, so what you see in the body makes sense.',
  },
  '/education': {
    title: 'Six ways to learn the physics of Pilates',
    description:
      'Online workshops, a small-group mentorship, and licensed teacher-training modules. Pick the depth that fits where you are right now.',
  },
  '/how-a-reformer-works': {
    title: 'How a Reformer Works: an on-demand course',
    description: REFORMER_DESCRIPTION,
    image: '/images/homepage/hero-image-5.jpg',
  },
  '/pilates-physics-101': {
    title: 'Pilates Physics 101 Workshop (2 CECs)',
    description: PP101_DESCRIPTION,
    image: '/images/homepage/hero-image-4.jpg',
  },
  '/pilates-physics-102': {
    title: 'Pilates Physics 102 Workshop (2 CECs)',
    description: PP102_DESCRIPTION,
  },
  '/mentorship': {
    title: 'Pilates Teacher Mentorship',
    description:
      'A small-group mentorship for Pilates teachers in their first five years. Weekly group sessions, private time with Kaleen, and feedback on your classes.',
    image: '/images/homepage/hero-image-3.jpg',
  },
  '/scholarship': {
    title: 'Scholarships for Pilates teachers',
    description:
      'Pilates education, within reach. Scholarships for teachers who have been pushed to the edges of this industry and for whom cost has been a barrier to education.',
  },
  '/blog': {
    title: 'Blog: notes on the physics of Pilates',
    description:
      'Short essays on mechanics, teaching, and the forces in the Pilates environment.',
    image: BLOG_FALLBACK_IMAGE,
  },
  '/help': {
    title: 'Help and frequently asked questions',
    description:
      'Answers to common questions about Pilates Physics workshops, courses, NPCP CECs and your account. Send a note and Kaleen will reply within a few days.',
  },
  '/terms': {
    title: 'Terms and Conditions',
    description:
      'The terms that govern use of pilatesphysics.com and its courses, workshops and digital products, operated by PWRHS Pilates LLC.',
  },
  '/privacy': {
    title: 'Privacy Policy',
    description:
      'How PWRHS Pilates LLC collects, uses and protects your personal information when you visit pilatesphysics.com or use our services.',
  },
  '/links': {
    title: 'Links from Kaleen Canevari',
    description:
      'Kaleen Canevari, Pilates instructor and mechanical engineer. Workshops, courses, the free spring calculator and the blog, all in one place.',
  },
}

export const HOME_JSON_LD = {
  '@context': 'https://schema.org',
  '@graph': [
    { ...ORGANIZATION, description: HOME_DESCRIPTION, sameAs: ['https://www.instagram.com/kaleenc_'] },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      publisher: { '@id': ORGANIZATION['@id'] },
    },
  ],
}

// How a Reformer Works. The price rides in from the webinars row once it
// loads; until then the Course is emitted without an Offer, which is valid.
export function reformerCourseJsonLd(workshop) {
  const pageUrl = `${SITE_URL}/how-a-reformer-works`
  const course = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    '@id': `${pageUrl}#course`,
    name: workshop?.title || 'How a Reformer Works',
    description: REFORMER_DESCRIPTION,
    url: pageUrl,
    image: `${SITE_URL}${PAGE_META['/how-a-reformer-works'].image}`,
    provider: ORGANIZATION,
    hasCourseInstance: {
      '@type': 'CourseInstance',
      courseMode: 'Online',
      courseWorkload: 'PT1H',
    },
  }
  if (workshop?.price_cents != null) {
    course.offers = {
      '@type': 'Offer',
      price: (workshop.price_cents / 100).toFixed(2),
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      url: pageUrl,
      category: 'Paid',
    }
  }
  return course
}

// The branded live-workshop pages. workshop is the current session row from
// useCurrentWorkshop (or the same query server side), or null.
export function pp101JsonLd(workshop) {
  return workshopJsonLd({
    path: '/pilates-physics-101',
    name: 'Pilates Physics 101',
    description: PP101_DESCRIPTION,
    image: PAGE_META['/pilates-physics-101'].image,
    workshop,
    cecs: 2,
  })
}

export function pp102JsonLd(workshop) {
  return workshopJsonLd({
    path: '/pilates-physics-102',
    name: 'Pilates Physics 102',
    description: PP102_DESCRIPTION,
    workshop,
    cecs: 2,
  })
}

// Plain-text description for a blog post's meta tags: the excerpt when the
// post has one, otherwise the first paragraph of the markdown with its syntax
// stripped.
export function describePost(post) {
  if (post?.excerpt) return post.excerpt.trim()
  const firstPara = (post?.body_markdown || '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .find((p) => p && !p.startsWith('#') && !p.startsWith('!['))
  if (!firstPara) return undefined
  return firstPara
    .replace(/[*_`>]/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/\s+/g, ' ')
    .slice(0, 160)
}

export function blogPostUrl(slug) {
  return `${SITE_URL}/blog/${slug}`
}

// Every post claims its own URL, the Substack mirrors included: Kaleen chose
// on 2026-10-14 to rank the posts here rather than on Substack. canonical_url
// is kept on the rows as a record of where a post first appeared.
export function blogPostingJsonLd(post, pageUrl) {
  if (!post) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    '@id': `${pageUrl}#article`,
    headline: post.title,
    description: describePost(post),
    image: post.featured_image_url || undefined,
    datePublished: post.published_at || undefined,
    dateModified: post.updated_at || post.published_at || undefined,
    author: AUTHOR,
    publisher: ORGANIZATION,
    mainEntityOfPage: { '@type': 'WebPage', '@id': pageUrl },
    url: pageUrl,
  }
}
