import { ORGANIZATION, SITE_URL } from './seo.js'

// Structured data for the branded live-workshop pages (PP-101, PP-102).
//
// Always a Course; adds an Event once useCurrentWorkshop resolves a session
// with a scheduled_at in the future. Both live in one @graph so the page
// carries a single JSON-LD script. Duration and price come from the row when
// present and fall back to the specs the page already shows.

const DEFAULT_DURATION_MIN = 120

function isoAfter(start, minutes) {
  return new Date(new Date(start).getTime() + minutes * 60 * 1000).toISOString()
}

function offerFrom(workshop, url) {
  if (workshop?.price_cents == null) return undefined
  const offer = {
    '@type': 'Offer',
    price: (workshop.price_cents / 100).toFixed(2),
    priceCurrency: 'USD',
    url,
    availability: 'https://schema.org/InStock',
    category: 'Paid',
  }
  if (workshop.early_bird_price_cents != null && workshop.early_bird_ends_at) {
    const ends = new Date(workshop.early_bird_ends_at)
    if (ends.getTime() > Date.now()) {
      offer.price = (workshop.early_bird_price_cents / 100).toFixed(2)
      offer.priceValidUntil = ends.toISOString()
    }
  }
  return offer
}

/**
 * @param {object} opts
 * @param {string} opts.path         Site-relative page path, e.g. "/pilates-physics-101".
 * @param {string} opts.name         Course name.
 * @param {string} opts.description  One or two sentences.
 * @param {string} [opts.image]      Site-relative hero image.
 * @param {object|null} [opts.workshop]  Row from useCurrentWorkshop, or null.
 * @param {number} [opts.cecs]       NPCP CECs, if any.
 */
export function workshopJsonLd({ path, name, description, image, workshop, cecs }) {
  const url = `${SITE_URL}${path}`
  const absImage = image ? `${SITE_URL}${image}` : undefined
  const durationMin = workshop?.duration_min || DEFAULT_DURATION_MIN

  const course = {
    '@type': 'Course',
    '@id': `${url}#course`,
    name,
    description,
    url,
    image: absImage,
    provider: ORGANIZATION,
    hasCourseInstance: {
      '@type': 'CourseInstance',
      courseMode: 'Online',
      courseWorkload: `PT${durationMin}M`,
    },
    offers: offerFrom(workshop, url),
  }
  if (cecs) {
    course.educationalCredentialAwarded = `${cecs} NPCP CEC${cecs === 1 ? '' : 's'}`
  }

  const graph = [course]

  const scheduled = workshop?.scheduled_at ? new Date(workshop.scheduled_at) : null
  if (scheduled && !Number.isNaN(scheduled.getTime()) && scheduled.getTime() > Date.now()) {
    graph.push({
      '@type': 'Event',
      '@id': `${url}#event`,
      name: workshop.title || name,
      description,
      url,
      image: absImage,
      startDate: scheduled.toISOString(),
      endDate: isoAfter(scheduled, durationMin),
      eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode',
      eventStatus:
        workshop.status === 'cancelled'
          ? 'https://schema.org/EventCancelled'
          : 'https://schema.org/EventScheduled',
      location: { '@type': 'VirtualLocation', url },
      organizer: ORGANIZATION,
      performer: { '@type': 'Person', name: 'Kaleen Canevari' },
      offers: offerFrom(workshop, url),
      about: { '@id': course['@id'] },
    })
  }

  return { '@context': 'https://schema.org', '@graph': graph }
}
