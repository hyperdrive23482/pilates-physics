import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useEnrollment } from '../../hooks/useEnrollment'
import { supabase } from '../../lib/supabase'
import { isRegistrationOpen } from '../../lib/workshop'
import WaitlistForm from './WaitlistForm'
import ArrowSvg from './ArrowSvg'
import './RegisterCard.css'

export default function RegisterCard({ workshop }) {
  const { user, signOut } = useEnrollment()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const price = workshop.price_cents
    ? `$${(workshop.price_cents / 100).toFixed(0)}`
    : 'Free'

  const registrationOpen = isRegistrationOpen(workshop)

  // A logged-in buyer whose account has no last name (e.g. a first-name-only
  // Springs 101 signup). Prompt for it so their certificate of completion is
  // accurate; provisioning backfills the blank last_name from what they enter.
  const needsLastName = Boolean(user) && !String(user?.user_metadata?.last_name ?? '').trim()

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

  async function handleSubmit(e) {
    e?.preventDefault()
    if (needsLastName && !lastName.trim()) {
      setStatus('error')
      setErrorMsg('Please add your last name so we can print it on your certificate.')
      return
    }
    setStatus('loading')
    setErrorMsg('')

    try {
      const headers = { 'Content-Type': 'application/json' }
      if (user) {
        const { data } = await supabase.auth.getSession()
        const token = data.session?.access_token
        if (token) headers.Authorization = `Bearer ${token}`
      }

      const body = user
        ? (needsLastName ? { slug: workshop.slug, lastName } : { slug: workshop.slug })
        : { slug: workshop.slug, email, firstName, lastName }

      const res = await fetch('/api/checkout/create-session', {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      })

      if (res.status === 409) {
        const data = await res.json()
        setStatus('already_enrolled')
        setErrorMsg(data.portalUrl || `/portal/${workshop.slug}`)
        return
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `Request failed (${res.status})`)
      }

      const { url } = await res.json()
      window.location.href = url
    } catch (err) {
      setErrorMsg(err.message || 'Something went wrong. Try again.')
      setStatus('error')
    }
  }

  if (status === 'already_enrolled') {
    return (
      <div className="register-card">
        <h3 className="register-card__title">You're already registered</h3>
        <p className="register-card__body">
          Head to your portal to access this workshop.
        </p>
        <Link to={errorMsg} className="btn btn--block">
          Go to your portal
          <ArrowSvg />
        </Link>
      </div>
    )
  }

  return (
    <div className="register-card">
      <div className="register-card__price-row">
        <span className="register-card__price">{price}</span>
        <span className="register-card__price-unit">one-time</span>
      </div>

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
            {status === 'loading' ? 'Redirecting to Stripe…' : `Register — ${price}`}
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
            {status === 'loading' ? 'Redirecting to Stripe…' : `Register — ${price}`}
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
