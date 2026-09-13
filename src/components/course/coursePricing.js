// One source for the two price labels the course page shows.
//
// The hero and the buy card both print a price, on the same screen, and they
// must never disagree. Deriving the number twice is how they eventually do:
// someone edits one call site, the other keeps the old shape, and the page
// contradicts itself in the place a visitor is deciding whether $69 is real.

export const OFFER_PRICE_LABEL = '$39'

export function fullPriceLabel(workshop) {
  return workshop?.price_cents ? `$${(workshop.price_cents / 100).toFixed(0)}` : '$69'
}

// A closed window prices at full price and sends no token, however it was
// rendered. Shared with PricingBlock so the hero and the card cannot disagree
// about which variant they are in either.
export function isActiveOffer(offer, expired) {
  return Boolean(offer?.token) && !expired
}
