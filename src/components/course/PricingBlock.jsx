import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCheckout } from '../../hooks/useCheckout'
import ArrowSvg from '../ui/ArrowSvg'
import '../ui/RegisterCard.css'

// The only part of the course sales page that varies.
//
// The public page shows one number and never mentions a discount. The offer
// plan adds two more variants against this same body: an active $39 window
// with a countdown, and an expired one that says so plainly rather than
// silently reverting. Keeping the body and the price separate now is what
// makes that a new component rather than a second copy of the whole page.
//
// See docs/making-of-a-reformer-build-plan.md, "Three pricing blocks".

export default function PricingBlock({ workshop }) {
  const slug = workshop?.slug ?? 'making-of-a-reformer'
  const { checkout, status, errorMsg, portalUrl, user, signOut, needsLastName } =
    useCheckout(slug)

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')

  const price = workshop?.price_cents ? `$${(workshop.price_cents / 100).toFixed(0)}` : '$69'
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
        <span className="register-card__price-unit">one-time</span>
      </div>

      <ul className="course-buy__list">
        <li>8 modules, about an hour of video</li>
        <li>1 NPCP CEC on passing the quiz</li>
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
