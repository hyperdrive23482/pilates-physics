import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useCheckout } from '../../hooks/useCheckout'
import { isRegistrationOpen } from '../../lib/workshop'
import { useWorkshopPricing } from '../../lib/workshopPricing'
import WaitlistForm from './WaitlistForm'
import ArrowSvg from './ArrowSvg'
import './RegisterCard.css'

export default function RegisterCard({ workshop }) {
  // Set once the server has refused an early bird checkout because the window
  // closed. Forces full price even if this viewer's clock still says early
  // bird, so the card and the next checkout agree with the server.
  const [earlyBirdEnded, setEarlyBirdEnded] = useState(false)
  const pricing = useWorkshopPricing(workshop, { ended: earlyBirdEnded })

  // The request itself lives in useCheckout, shared with the course pricing
  // block so the two cannot drift apart. This component owns only the form.
  const { checkout, status, errorMsg, portalUrl, user, signOut, needsLastName } =
    useCheckout(workshop.slug, { expectEarlyBird: pricing.earlyBird })
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')

  useEffect(() => {
    if (status === 'early_bird_ended') setEarlyBirdEnded(true)
  }, [status])

  const price = pricing.price ?? 'Free'

  const registrationOpen = isRegistrationOpen(workshop)

  if (!registrationOpen) {
    return (
      <div className="register-card">
        <h3 className="register-card__title">Registration opens soon</h3>
        <p className="register-card__body">
          Join the waitlist and we'll notify you as soon as registration opens.
        </p>
        <WaitlistForm />
        <p className="register-card__meta">No spam. Unsubscribe anytime.</p>
      </div>
    )
  }

  function handleSubmit(e) {
    e?.preventDefault()
    checkout({ email, firstName, lastName })
  }

  if (status === 'already_enrolled') {
    return (
      <div className="register-card">
        <h3 className="register-card__title">You're already registered</h3>
        <p className="register-card__body">
          Head to your portal to access this workshop.
        </p>
        <Link to={portalUrl} className="btn btn--block">
          Go to your portal
          <ArrowSvg />
        </Link>
      </div>
    )
  }

  return (
    <div className="register-card">
      <div className="register-card__price-row">
        {pricing.earlyBird && <s className="register-card__was">{pricing.fullPrice}</s>}
        <span className="register-card__price">{price}</span>
        <span className="register-card__price-unit">
          {pricing.earlyBird ? 'early bird' : 'one-time'}
        </span>
      </div>

      {pricing.earlyBird && (
        <p className="register-card__early-bird">
          Early bird ends {pricing.endsLabel}. Then {pricing.fullPrice}.
        </p>
      )}

      {/* The window closed between page load and the click. Say so, rather
          than letting the price change under them without a word. */}
      {status === 'early_bird_ended' && (
        <p className="register-card__early-bird">
          Early bird pricing just ended. The workshop is now {price}.
        </p>
      )}

      {user ? (
        <>
          <p className="register-card__user">
            Registering as <strong>{user.email}</strong>
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
                disabled={status === 'loading'}
                className="pp-form__input"
              />
              <p className="pp-form__help">
                We'll add this to your certificate of completion.
              </p>
            </div>
          )}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={status === 'loading'}
            className="btn btn--block"
          >
            {status === 'loading' ? 'Redirecting to Stripe…' : `Register. ${price}`}
            {status !== 'loading' && <ArrowSvg />}
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
                disabled={status === 'loading'}
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
                disabled={status === 'loading'}
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
              disabled={status === 'loading'}
              className="pp-form__input"
            />
            <p className="pp-form__help">
              Use this email for your account — please use the same email during payment.
            </p>
          </div>
          <button
            type="submit"
            disabled={status === 'loading'}
            className="btn btn--block"
          >
            {status === 'loading' ? 'Redirecting to Stripe…' : `Register. ${price}`}
            {status !== 'loading' && <ArrowSvg />}
          </button>
        </form>
      )}

      {status === 'error' && (
        <p className="pp-form__error">{errorMsg}</p>
      )}

      <p className="register-card__meta">
        Secure checkout via Stripe. Already registered?{' '}
        <Link to="/login">Log in</Link>.
      </p>
    </div>
  )
}
