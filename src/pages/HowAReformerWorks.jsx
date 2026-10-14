import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import CourseSalesBody from '../components/course/CourseSalesBody'
import PricingBlock from '../components/course/PricingBlock'
import HeroPricing from '../components/course/HeroPricing'
import Head from '../components/Head'
import JsonLd from '../components/JsonLd'
import { ORGANIZATION, SITE_URL } from '../lib/head'
import '../styles/ppv2.css'
import './Workshop.css'

const SLUG = 'how-a-reformer-works'
const PAGE_URL = `${SITE_URL}/${SLUG}`
const HERO_IMAGE = '/images/homepage/hero-image-5.jpg'
const DESCRIPTION =
  'An on-demand course on the mechanisms that make your reformer magical. Eight modules, one hour, one NPCP CEC. Taught by an engineer and Pilates instructor who designed one.'

// Course structured data. The price rides in from the webinars row once it
// loads; until then the Course is emitted without an Offer, which is valid.
function courseJsonLd(workshop) {
  const course = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    '@id': `${PAGE_URL}#course`,
    name: workshop?.title || 'How a Reformer Works',
    description: DESCRIPTION,
    url: PAGE_URL,
    image: `${SITE_URL}${HERO_IMAGE}`,
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
      url: PAGE_URL,
      category: 'Paid',
    }
  }
  return course
}

/**
 * The public sales page. $69, and it never mentions a discount.
 *
 * The body and the price are separate components on purpose. The offer plan
 * renders this same body at $39 behind a token, with a countdown, and again
 * in an expired state. Three pages to a visitor, one page to maintain.
 *
 * Resolved by slug rather than through useCurrentWorkshop, which keys off the
 * PP-101 and PP-102 series prefixes and has no meaning for a course.
 */
export default function HowAReformerWorks() {
  const [workshop, setWorkshop] = useState(null)

  useEffect(() => {
    let cancelled = false
    supabase
      .from('webinars')
      .select('id, slug, title, subtitle, price_cents, status, stripe_price_id, npcp_cecs')
      .eq('slug', SLUG)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!cancelled && !error) setWorkshop(data)
      })
    return () => {
      cancelled = true
    }
  }, [])

  // The body renders immediately; only the pricing block waits on the row.
  // A visitor should never watch a sales page load.
  return (
    <>
      <Head
        title="How a Reformer Works: an on-demand course"
        description={DESCRIPTION}
        image={HERO_IMAGE}
      />
      <JsonLd data={courseJsonLd(workshop)} />
      <CourseSalesBody
        heroPricing={<HeroPricing workshop={workshop} />}
        pricing={<PricingBlock workshop={workshop} />}
        showScholarship
      />
    </>
  )
}
