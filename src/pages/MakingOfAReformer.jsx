import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import CourseSalesBody from '../components/course/CourseSalesBody'
import PricingBlock from '../components/course/PricingBlock'
import '../styles/ppv2.css'
import './Workshop.css'

const SLUG = 'making-of-a-reformer'

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
export default function MakingOfAReformer() {
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
  return <CourseSalesBody pricing={<PricingBlock workshop={workshop} />} />
}
