// How a workshop price reads wherever it is printed. Both take the object from
// useWorkshopPricing / getWorkshopPricing (src/lib/workshopPricing.js) and
// never compute a price themselves.

// Inline text: "$129" normally, "~~$129~~ $99" during early bird. For the spec
// list and the catalog card, where the price sits in a line of other text.
// Styled inline so it reads the same on ppv2 pages and the older catalog.
export default function WorkshopPrice({ pricing, fallback = null }) {
  if (!pricing.price) return fallback
  if (!pricing.earlyBird) return pricing.price
  return (
    <>
      <s style={{ opacity: 0.55, marginRight: '0.35em' }}>{pricing.fullPrice}</s>
      {pricing.price}
    </>
  )
}

// The hero callout, above the register button. Only exists during early bird:
// outside it the button label carries the price, as it always has, and a price
// block that appeared for no reason would just be clutter. The struck number is
// the point. $99 means nothing without the $129 it replaced.
export function EarlyBirdHeroPrice({ pricing }) {
  if (!pricing.earlyBird) return null
  return (
    <p className="workshop-hero__price">
      <span className="workshop-hero__price-k">Early bird</span>
      <s className="workshop-hero__was">{pricing.fullPrice}</s>
      <span className="workshop-hero__now">{pricing.price}</span>
      <span className="workshop-hero__unit">until {pricing.endsLabel}</span>
    </p>
  )
}
