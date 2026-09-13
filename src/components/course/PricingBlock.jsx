import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useCheckout } from '../../hooks/useCheckout'
import ArrowSvg from '../ui/ArrowSvg'
import { OFFER_PRICE_LABEL, fullPriceLabel, isActiveOffer } from './coursePricing'
import '../ui/RegisterCard.css'

// The only part of the course sales page that varies.
//
// Three variants over one form, because the visitor sees three sales pages and
// two of them are the same page:
//
//   public   /how-a-reformer-works        $69, and never mentions a discount
//   active   /offer/reformer?t=X          $39, a countdown, the deadline named
//   expired  /offer/reformer?t=X          $69, and says plainly that it closed
//
// The expired variant does more work than it looks like. It confirms the
// discount was real, confirms the product was never gated behind it, and
// removes any suspicion that $39 was a trick -- which protects $69 rather than
// undermining it. Redirecting it to the public page is the tempting one-line
// version and it throws all of that away: someone clicked a link promising $39
// and landed on a page saying $69 with no explanation, which reads as a bait
// and switch even though nothing dishonest happened.
//
// See docs/how-a-reformer-works-build-plan.md, "Three pricing blocks".

// "2 days, 14 hours, 03 minutes" -- and the point of naming the deadline right
// underneath is that the clock reads as a fact rather than a pressure tactic.
//
// Decoration only. The client clock is a suggestion; enforcement lives in
// api/checkout/create-session.js.
function useCountdown(expiresAt) {
  const target = expiresAt ? new Date(expiresAt).getTime() : null
  const [remaining, setRemaining] = useState(() => (target ? target - Date.now() : 0))

  useEffect(() => {
    if (!target) return undefined
    setRemaining(target - Date.now())
    const id = setInterval(() => setRemaining(target - Date.now()), 1000 * 30)
    return () => clearInterval(id)
  }, [target])

  if (!target || remaining <= 0) return null

  const minutes = Math.floor(remaining / 60000)
  const days = Math.floor(minutes / (60 * 24))
  const hours = Math.floor((minutes % (60 * 24)) / 60)
  const mins = minutes % 60

  const parts = []
  if (days > 0) parts.push(`${days} ${days === 1 ? 'day' : 'days'}`)
  if (days > 0 || hours > 0) parts.push(`${hours} ${hours === 1 ? 'hour' : 'hours'}`)
  parts.push(`${String(mins).padStart(2, '0')} minutes`)
  return parts.join(', ')
}

export default function PricingBlock({
  workshop,
  // The LIVE $39 window only: { token, deadline, expiresAt }. Never set for a
  // closed window -- see `expired`, which wins over this if both arrive.
  offer = null,
  // A window that has closed. Distinct from `!offer`, which is the public page.
  expired = false,
  // The day a closed window shut, so the expired copy can name it. Separate
  // from `offer` precisely so naming the day cannot imply the price is still $39.
  deadline = null,
  // The server rejected the token at checkout, so the page should re-fetch and
  // re-render. See the 410 in api/checkout/create-session.js.
  onOfferExpired,
}) {
  const slug = workshop?.slug ?? 'how-a-reformer-works'

  // `expired` wins. A closed window must never price at $39 or send a token,
  // however it was rendered: showing the discount next to "your window closed"
  // is the contradiction the expired state exists to prevent. Shared with the
  // hero so the two cannot land on different variants.
  const active = isActiveOffer(offer, expired)

  const { checkout, status, errorMsg, portalUrl, user, signOut, needsLastName } = useCheckout(
    slug,
    { offerToken: active ? offer.token : undefined },
  )

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')

  const countdown = useCountdown(active ? offer.expiresAt : null)

  useEffect(() => {
    if (status === 'offer_expired' && onOfferExpired) onOfferExpired()
  }, [status, onOfferExpired])

  const fullPrice = fullPriceLabel(workshop)
  const price = active ? OFFER_PRICE_LABEL : fullPrice
  const closedOn = deadline ?? offer?.deadline
  const purchasable = Boolean(workshop?.stripe_price_id)
  const loading = status === 'loading'

  function handleSubmit(e) {
    e?.preventDefault()
    checkout({ email, firstName, lastName })
  }

  if (status === 'already_enrolled') {
    return (
      <div className="register-card">
        <h3 className="register-card__title">You already own this course</h3>
        <p className="register-card__body">
          Pick up wherever you left off in your portal.
        </p>
        <Link to={portalUrl} className="btn btn--block">
          Go to the course
          <ArrowSvg />
        </Link>
      </div>
    )
  }

  // No Stripe price wired up yet. Say so honestly rather than showing a buy
  // button that fails at the server.
  if (!purchasable) {
    return (
      <div className="register-card">
        <h3 className="register-card__title">Opening soon</h3>
        <p className="register-card__body">
          The course is finished and the doors open shortly. Check back in a
          few days.
        </p>
      </div>
    )
  }

  return (
    <div className="register-card">
      <div className="register-card__price-row">
        <span className="register-card__price">{price}</span>
        <span className="register-card__price-unit">
          {active ? `instead of ${fullPrice}` : 'one-time'}
        </span>
      </div>

      {active && (
        <p className="course-buy__window">
          {countdown && <span className="course-buy__countdown">{countdown} left</span>}
          <span className="course-buy__deadline">
            Your window closes {offer.deadline}. After that the course is {fullPrice}. Same
            course, same everything.
          </span>
        </p>
      )}

      {expired && (
        <p className="course-buy__closed">
          Your $39 window closed{closedOn ? ` on ${closedOn}` : ''}. The course is {fullPrice}.
          Nothing about it has changed — every module, the calculator, and the inspection
          checklist are all still included, exactly as they were.
        </p>
      )}

      <ul className="course-buy__list">
        <li>8 modules, 1 hour of video</li>
        <li>Certificate worth 1 NPCP CEC on passing</li>
        <li>Instant access, yours to keep</li>
      </ul>

      {user ? (
        <>
          <p className="register-card__user">
            Buying as <strong>{user.email}</strong>
            {' · '}
            <button type="button" onClick={signOut} className="register-card__logout">
              Not you? Log out
            </button>
          </p>
          {needsLastName && (
            <div className="pp-form__field">
              <label className="pp-form__label">Last name</label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                disabled={loading}
                className="pp-form__input"
              />
              <p className="pp-form__help">
                We'll print this on your certificate.
              </p>
            </div>
          )}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="btn btn--block"
          >
            {loading ? 'Redirecting to Stripe…' : `Get instant access. ${price}`}
            {!loading && <ArrowSvg />}
          </button>
        </>
      ) : (
        <form onSubmit={handleSubmit} className="pp-form">
          <div className="pp-form__row">
            <div className="pp-form__field">
              <label className="pp-form__label">First name</label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                disabled={loading}
                className="pp-form__input"
              />
            </div>
            <div className="pp-form__field">
              <label className="pp-form__label">Last name</label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                disabled={loading}
                className="pp-form__input"
              />
            </div>
          </div>
          <div className="pp-form__field">
            <label className="pp-form__label">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className="pp-form__input"
            />
            <p className="pp-form__help">
              This becomes your login. Use the same address at checkout.
            </p>
          </div>
          <button type="submit" disabled={loading} className="btn btn--block">
            {loading ? 'Redirecting to Stripe…' : `Get instant access. ${price}`}
            {!loading && <ArrowSvg />}
          </button>
        </form>
      )}

      {status === 'error' && <p className="pp-form__error">{errorMsg}</p>}

      <p className="register-card__meta">
        Secure checkout via Stripe. Already have an account?{' '}
        <Link to="/login">Log in</Link>.
      </p>
    </div>
  )
}
