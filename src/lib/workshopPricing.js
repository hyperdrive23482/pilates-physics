import { useEffect, useState } from 'react'
import { isEarlyBirdActive, formatEarlyBirdEnd } from '../../api/_lib/early-bird.js'

// One source for every price a workshop page prints.
//
// The hero, the spec list, the register card and the catalog all show a price,
// and during early bird each of them has to show the same two numbers. Deriving
// them separately is how a page ends up with $99 in the hero and $129 on the
// button. The early bird predicate is the server's own (api/_lib/early-bird.js),
// so the page and the checkout cannot disagree about whether it is on either.

export function formatPrice(cents) {
  return cents ? `$${(cents / 100).toFixed(0)}` : null
}

// {
//   earlyBird   true while the early bird price applies
//   price       what the buyer pays now, e.g. '$99' (null when unpriced)
//   fullPrice   the regular price, e.g. '$129' (null when unpriced)
//   endsLabel   'Sep 30, 11:59pm PT' during early bird, else ''
// }
//
// `ended` forces full price after the server has said the window closed, for
// the case where the viewer's clock runs behind the server's.
export function getWorkshopPricing(workshop, { now = new Date(), ended = false } = {}) {
  const fullPrice = formatPrice(workshop?.price_cents)
  const earlyBird = !ended && Boolean(fullPrice) && isEarlyBirdActive(workshop, now)

  return {
    earlyBird,
    price: earlyBird ? formatPrice(workshop.early_bird_price_cents) ?? '$0' : fullPrice,
    fullPrice,
    endsLabel: earlyBird ? formatEarlyBirdEnd(workshop.early_bird_ends_at) : '',
  }
}

// setTimeout overflows past 2^31-1 ms (about 24.8 days) and fires at once.
const MAX_TIMEOUT = 2 ** 31 - 1

// getWorkshopPricing, re-rendered the moment early bird ends, so a tab left
// open overnight flips to full price without a reload. No countdown: this only
// wakes once, at the deadline.
export function useWorkshopPricing(workshop, { ended = false } = {}) {
  const [tick, setTick] = useState(0)
  const pricing = getWorkshopPricing(workshop, { ended })
  const endsAt = pricing.earlyBird ? workshop.early_bird_ends_at : null

  useEffect(() => {
    if (!endsAt) return undefined
    const ms = new Date(endsAt).getTime() - Date.now() + 1000
    // A deadline more than ~24 days out wakes early and re-arms, which is
    // harmless: the re-render recomputes and schedules the rest.
    const id = setTimeout(() => setTick((t) => t + 1), Math.min(Math.max(ms, 0), MAX_TIMEOUT))
    return () => clearTimeout(id)
  }, [endsAt, tick])

  return pricing
}
