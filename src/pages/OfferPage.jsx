import { useCallback, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import CourseSalesBody from '../components/course/CourseSalesBody'
import PricingBlock from '../components/course/PricingBlock'
import HeroPricing from '../components/course/HeroPricing'
import { fullPriceLabel } from '../components/course/coursePricing'
import ArrowSvg from '../components/ui/ArrowSvg'
import '../styles/ppv2.css'
import './Workshop.css'

/**
 * /offer/reformer?t=TOKEN
 *
 * The same sales body as the public page, with a different pricing block. One
 * route, four states, and the server decides which -- see api/offer.js. If the
 * URL carried the state, someone would bookmark the active one, open it on
 * Saturday, and the redirect logic would have to exist anyway.
 *
 * This page must not be indexed. `X-Robots-Tag: noindex` is set on /offer/(.*)
 * in vercel.json and again by the API route; the public page shows $69 and only
 * $69, and if a $39 page is ever indexed then $69 stops reading as real.
 */
export default function OfferPage() {
  const [params] = useSearchParams()
  const token = params.get('t')

  const [data, setData] = useState(null)
  const [loadError, setLoadError] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/offer${token ? `?t=${encodeURIComponent(token)}` : ''}`)
      if (!res.ok) throw new Error(`offer lookup failed (${res.status})`)
      setData(await res.json())
    } catch (err) {
      console.error(err)
      setLoadError(true)
    }
  }, [token])

  useEffect(() => {
    load()
  }, [load])

  // The body renders immediately and only the pricing block waits on the
  // response. Nobody should watch a sales page load.
  let pricing = null

  if (loadError) {
    pricing = (
      <RecoveryCard
        note="Something went wrong finding your discount link. Enter the address you subscribed with and we'll send it again."
        fullPrice={fullPriceLabel(null)}
      />
    )
  } else if (!data) {
    pricing = null
  } else if (data.state === 'redeemed') {
    pricing = (
      <div className="register-card">
        <h3 className="register-card__title">You already own this course</h3>
        <p className="register-card__body">Pick up wherever you left off in your portal.</p>
        <Link to={data.portalUrl} className="btn btn--block">
          Go to the course
          <ArrowSvg />
        </Link>
      </div>
    )
  } else if (data.state === 'unknown') {
    pricing = <RecoveryCard reason={data.reason} fullPrice={fullPriceLabel(data.workshop)} />
  } else if (data.state === 'expired') {
    pricing = (
      <PricingBlock workshop={data.workshop} expired deadline={data.deadline} />
    )
  } else {
    pricing = (
      <PricingBlock
        workshop={data.workshop}
        offer={{ token: data.token, deadline: data.deadline, expiresAt: data.expiresAt }}
        // The window shut between page load and clicking buy. Re-fetch so the
        // expired block explains it, rather than dropping them to $69 at Stripe
        // with no warning.
        onOfferExpired={load}
      />
    )
  }

  // The hero mirrors the card's variant off the same response, so the two can
  // never show different prices on one screen.
  const heroPricing = (
    <HeroPricing
      workshop={data?.workshop}
      offer={
        data?.state === 'active'
          ? { token: data.token, deadline: data.deadline, expiresAt: data.expiresAt }
          : null
      }
      expired={data?.state === 'expired'}
    />
  )

  return <CourseSalesBody heroPricing={heroPricing} pricing={pricing} />
}

// Why the link did not work, in the visitor's terms. `unrecognized_token` is
// the one that matters: the link WAS real, so an expired window is the most
// likely explanation and the copy has to say so rather than blaming Gmail.
const BODY = {
  missing_token:
    "This link is missing the part that identifies you, so we cannot tell which discount window is yours. Some email apps trim it. Enter the address you subscribed with and we'll send the link again.",
  unrecognized_token:
    "We could not match this link to a discount window. Either your email app trimmed it, or the window it belonged to has already closed. Enter the address you subscribed with and we'll send your link if it is still open.",
}

/**
 * The recovery form.
 *
 * IT NEVER SHOWS THE OFFER. It asks the server to mail the link, and the server
 * answers identically whether or not the address was found. Rendering $39 for
 * any address typed into a public page is the coupon code that not using a
 * Stripe coupon was supposed to eliminate.
 *
 * The copy names the discount on purpose. Someone lands here holding a broken
 * link they were told was worth $39, and "let's find your link" does not tell
 * them they are in the right place -- it reads like a generic error and they
 * leave. Naming it costs nothing that matters: the page is noindex, it is
 * linked from nowhere, and the form grants no access, it only sends mail to an
 * address that already had an offer.
 *
 * IT MUST NEVER LEAVE EXPIRY UNSAID. The server cannot tell this visitor their
 * window closed, because it does not know who they are -- but it can stop
 * implying the only possible cause is a mangled link. A card that blames the
 * email client, followed by a confirmation that promises mail, sends someone
 * whose window simply ran out away believing the site is broken and still owes
 * them $39. So the body names a closed window as a live possibility, and the
 * confirmation says what silence means.
 */
function RecoveryCard({ note, reason, fullPrice = '$69' }) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle')
  const [message, setMessage] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus('loading')
    try {
      const res = await fetch('/api/offer/recover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        setMessage(body.error || 'That address did not look right. Try again?')
        setStatus('error')
        return
      }
      setMessage(body.message)
      setStatus('sent')
    } catch {
      setMessage('Something went wrong. Try again in a moment.')
      setStatus('error')
    }
  }

  if (status === 'sent') {
    return (
      <div className="register-card">
        <h3 className="register-card__title">Check your inbox</h3>
        <p className="register-card__body">{message}</p>
        <p className="register-card__body">
          If nothing arrives in a few minutes, it means one of two things: a typo in
          the address, or a window that has already closed. A closed window is not a
          broken link. The course is {fullPrice}, and nothing about it has changed.
          Every module, the calculator, and the inspection checklist are all still
          included, exactly as they were.
        </p>
        <Link to="/how-a-reformer-works" className="btn btn--block">
          See the course
          <ArrowSvg />
        </Link>
      </div>
    )
  }

  return (
    <div className="register-card">
      <h3 className="register-card__title">Let's find your custom link for a discount</h3>
      <p className="register-card__body">{note ?? BODY[reason] ?? BODY.missing_token}</p>
      <form onSubmit={handleSubmit} className="pp-form">
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
        </div>
        <button type="submit" disabled={status === 'loading'} className="btn btn--block">
          {status === 'loading' ? 'Sending…' : 'Email me my discount link'}
          {status !== 'loading' && <ArrowSvg />}
        </button>
      </form>
      {status === 'error' && <p className="pp-form__error">{message}</p>}
      <p className="register-card__meta">
        Already bought it? <Link to="/login">Log in</Link>.
      </p>
    </div>
  )
}
