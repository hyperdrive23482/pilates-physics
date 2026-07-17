import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import ArrowSvg from '../components/ui/ArrowSvg'
import { useEnrollment } from '../hooks/useEnrollment'
import { supabase } from '../lib/supabase'
import '../styles/ppv2.css'
import './Springs101Landing.css'

const GET = [
  {
    n: '01',
    label: 'FREE PRIMER',
    title: 'Springs 101',
    body: 'The physics of Pilates springs in one sitting: the F = kx + b model, starting tension versus rate, why colors are not a language, and illustrated spring lineups for every major brand across reformer, tower, and chair.',
  },
  {
    n: '02',
    label: 'FREE TOOL',
    title: 'The Spring Load Calculator',
    body: 'The same interactive comparison tool workshop students use. Pick a brand, stack springs, and drag through the stroke to read the load at any point. Every brand, every spring, side by side.',
  },
]

const STEPS = [
  { n: '01', body: 'Enter your name and email below.' },
  { n: '02', body: 'We create your free Pilates Physics account and send a sign-in link to your inbox.' },
  { n: '03', body: 'Click the link. Springs 101 and the calculator are waiting in your portal, forever.' },
]

export default function Springs101Landing() {
  const { user, loading: authLoading } = useEnrollment()
  const navigate = useNavigate()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [website, setWebsite] = useState('')
  const [status, setStatus] = useState('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [result, setResult] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')

    try {
      const res = await fetch('/api/springs101', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, email, website }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Something went wrong. Try again.')
      setResult(data)
      setStatus('success')
    } catch (err) {
      setErrorMsg(err.message || 'Something went wrong. Try again.')
      setStatus('error')
    }
  }

  async function handleClaim() {
    setStatus('loading')
    setErrorMsg('')

    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData?.session?.access_token
      if (!token) throw new Error('Your session expired. Please log in again.')
      const res = await fetch('/api/springs101', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Something went wrong. Try again.')
      navigate('/portal/springs-101')
    } catch (err) {
      setErrorMsg(err.message || 'Something went wrong. Try again.')
      setStatus('error')
    }
  }

  return (
    <div className="ppv2 grid-bg" data-section-style="alt">
      {/* ── § 01 Hero ────────────────────────────────────────────────────── */}
      <section className="springs101-hero section-frame">
        <span className="cross tl"></span>
        <span className="cross tr"></span>

        <div className="container">
          <div className="springs101-hero__inner">
            <div className="kicker">§ 01 · Free Mini Course</div>
            <h1 className="springs101-hero__title">
              A red spring is not a thing. <span className="italic accent">Not really.</span>
            </h1>
            <p className="springs101-hero__lede">
              A spring is not one weight. It gets heavier the more you stretch it, and every
              manufacturer builds theirs differently. Get the free Springs 101 primer and the
              interactive Spring Load Calculator, and see for yourself.
            </p>
            <a href="#signup" className="btn btn--lg">
              Get free access <ArrowSvg />
            </a>
          </div>
        </div>

        <span className="cross bl"></span>
        <span className="cross br"></span>
      </section>

      {/* ── § 02 What you get ────────────────────────────────────────────── */}
      <section className="section-pad section--inset springs101-get">
        <div className="container">
          <div className="springs101-get__head">
            <div className="kicker">§ 02 · What You Get</div>
            <h2 className="springs101-get__title">
              Two free resources. <span className="italic accent">One account.</span>
            </h2>
          </div>

          <div className="springs101-get__grid">
            {GET.map((g) => (
              <article className="fcard" key={g.title}>
                <div className="fcard__head">
                  <span className="fcard__n mono">{g.n}</span>
                  <span className="fcard__dot mono">·</span>
                  <span className="fcard__label mono accent">{g.label}</span>
                </div>
                <h3 className="fcard__title">{g.title}</h3>
                <p className="fcard__body">{g.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── § 03 How it works ────────────────────────────────────────────── */}
      <section className="section-pad section--inset springs101-how">
        <div className="container">
          <div className="kicker">§ 03 · How It Works</div>
          <div className="springs101-how__list">
            {STEPS.map((s) => (
              <div key={s.n}>
                <span className="springs101-how__step-n">§ {s.n}</span>
                <p className="springs101-how__step-body">{s.body}</p>
              </div>
            ))}
          </div>
          <p className="springs101-signup__note" style={{ marginTop: '32px' }}>
            No card, no trial, no catch. Just the physics.
          </p>
        </div>
      </section>

      {/* ── § 04 Signup ──────────────────────────────────────────────────── */}
      <section className="section-pad section--inset springs101-signup" id="signup" style={{ scrollMarginTop: '5rem' }}>
        <div className="container container--narrow">
          <div className="kicker">§ 04 · Get Access</div>
          <h2 className="springs101-signup__head">
            Start reading springs <span className="italic accent">like an engineer.</span>
          </h2>

          {!authLoading && user ? (
            /* Logged-in claim: one click, no email round trip */
            <div>
              <p className="springs101-signup__lede">
                You are signed in as {user.email}. One click adds Springs 101 and the Spring
                Load Calculator to your portal.
              </p>
              <button
                type="button"
                onClick={handleClaim}
                disabled={status === 'loading'}
                className="btn btn--block btn--lg"
              >
                {status === 'loading' ? 'Adding to your portal…' : 'Add to my portal'}
                {status !== 'loading' && <ArrowSvg />}
              </button>
              {status === 'error' && <p className="pp-form__error">{errorMsg}</p>}
            </div>
          ) : status === 'success' ? (
            <div className="springs101-signup__success">
              <p className="springs101-signup__success-head">§ Check your inbox</p>
              <p className="springs101-signup__success-body">
                {result?.emailSent
                  ? `Your sign-in link is on its way to ${email.trim()}. Click it and Springs 101 will be waiting in your portal.`
                  : `Your access is ready. Head to the login page and request an email sign-in link for ${email.trim()}.`}
              </p>
              {result?.userState === 'returning' && (
                <p className="springs101-signup__note">
                  Looks like you already have an account. The same link signs you in.
                </p>
              )}
              <p className="springs101-signup__note">
                Already have a password? <Link to="/login">Log in</Link>
              </p>
            </div>
          ) : (
            <>
              <p className="springs101-signup__lede">
                Enter your info and we will set up your free account with both resources.
              </p>
              <form onSubmit={handleSubmit} className="pp-form">
                <div className="pp-form__field">
                  <label className="pp-form__label">First name</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    disabled={status === 'loading'}
                    maxLength={200}
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
                    maxLength={200}
                    className="pp-form__input"
                  />
                </div>

                <div className="pp-form__field">
                  <label className="pp-form__label">Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={status === 'loading'}
                    maxLength={320}
                    className="pp-form__input"
                  />
                </div>

                <input
                  type="text"
                  name="website"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  style={{ display: 'none' }}
                />

                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="btn btn--block btn--lg"
                >
                  {status === 'loading' ? 'Creating your access…' : 'Get free access'}
                  {status !== 'loading' && <ArrowSvg />}
                </button>

                {status === 'error' && <p className="pp-form__error">{errorMsg}</p>}
              </form>
            </>
          )}
        </div>
      </section>
    </div>
  )
}
