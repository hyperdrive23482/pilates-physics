import ArrowSvg from '../ui/ArrowSvg'
import { OFFER_PRICE_LABEL, fullPriceLabel, isActiveOffer } from './coursePricing'

// The price and the CTA in the hero, above the fold.
//
// A separate component rather than markup inside CourseSalesBody, for the same
// reason PricingBlock is: that body is shared by the public page and both offer
// states, and a price hardcoded into it would contradict the card beside it the
// moment the variant changed. The body renders whatever node it is handed.
//
// The price only appears once `workshop` has loaded. The button never waits,
// because the body is deliberately rendered before the pricing data arrives and
// a hero with no call to action reads as a broken page. A briefly absent price
// does not.

export default function HeroPricing({ workshop, offer = null, expired = false }) {
  const active = isActiveOffer(offer, expired)
  const full = fullPriceLabel(workshop)

  return (
    <>
      {workshop && (
        <p className="course-hero__price">
          {active ? (
            <>
              {/* The struck price is the whole point of putting this in the
                  hero: $39 means nothing without the number it replaced. */}
              <s className="course-hero__was">{full}</s>
              <span className="course-hero__now">{OFFER_PRICE_LABEL}</span>
            </>
          ) : (
            <span className="course-hero__now">{full}</span>
          )}
          <span className="course-hero__unit">one-time</span>
        </p>
      )}

      <div className="workshop-hero__cta">
        <a href="#buy" className="btn btn--lg">
          {active ? 'Claim your discount' : 'Get instant access'}
          <ArrowSvg />
        </a>
      </div>
    </>
  )
}
