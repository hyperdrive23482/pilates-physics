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
    title: 'See how a spring actually loads.',
    body: "The physics of Pilates springs in one sitting, instructor to instructor: why a spring builds resistance as it stretches, how to read a manufacturer's spring specs, and illustrated spring lineups for major brands across reformer, tower, and chair, so you can compare them for yourself.",
  },
  {
    n: '02',
    label: 'FREE TOOL',
    title: 'Watch the load change as you stretch.',
    body: 'The Spring Load Calculator. Pick a brand and a spring color, drag to stretch the spring, and read the load at any point in the range. Stack springs together to see what a combination really adds up to. The math is done for you, no mental gymnastics.',
  },
]

const STEPS = [
  { n: '01', body: 'Enter your name and email below.' },
  { n: '02', body: 'We create your free Pilates Physics account and send a sign-in link to your inbox.' },
  { n: '03', body: 'Click the link. Pilates Springs 101 and the calculator are waiting in your portal, forever.' },
]

function ExpandSvg() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
    </svg>
  )
}

// Open the demo video fullscreen. Uses the iOS-only webkitEnterFullscreen on the
// <video> itself, since iOS Safari does not support element.requestFullscreen.
function openVideoFullscreen(e) {
  const video = e.currentTarget.querySelector('video')
  if (!video) return
  if (video.webkitEnterFullscreen) video.webkitEnterFullscreen()
  else if (e.currentTarget.requestFullscreen) e.currentTarget.requestFullscreen()
  else if (video.webkitRequestFullscreen) video.webkitRequestFullscreen()
}

export default function Springs101Landing() {
  const { user, loading: authLoading } = useEnrollment()
  const navigate = useNavigate()
  const [firstName, setFirstName] = useState('')
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
        body: JSON.stringify({ firstName, email, website }),
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
            <div className="kicker">§ 01 · FREE RESOURCE</div>
            <h1 className="springs101-hero__title">
              A red spring is not <span className="italic accent">a single weight.</span>
            </h1>
            <p className="springs101-hero__lede">
              You already read the body in front of you: how it moves, where it strains, what
              your cue changes. But a Pilates spring does not load like a dumbbell, and the
              resistance your client actually meets shapes everything you watch for. Springs 101
              shows you how springs really load, so what you see starts to make sense. Free
              primer, plus an interactive calculator.
            </p>
            <a href="#signup" className="btn btn--lg">
              Get free access <ArrowSvg />
            </a>
          </div>
        </div>

        <span className="cross bl"></span>
        <span className="cross br"></span>
      </section>

      {/* ── § 02 Why it matters (stakes) ─────────────────────────────────── */}
      <section className="section-pad section--inset springs101-why">
        <div className="container">
          <div className="kicker">§ 02 · Why It Matters</div>
          <h2 className="springs101-why__title">
            You read the body. But not <span className="italic accent">the load behind it.</span>
          </h2>
          <p className="springs101-why__body">
            A Pilates spring does not deliver a fixed weight like a gym dumbbell. Its load
            increases as it stretches, so a color you call &ldquo;heavy&rdquo; lands differently
            depending on how far it travels and who is on the carriage.
          </p>
          <p className="springs101-why__body">
            You see the effect of your instruction: the effort, the struggle, the ease. You
            adjust with a new cue or a whole different exercise to get the response you want.
            But the load itself, and how differently it lands from one body to the next, never
            enters the picture. It was not taught as something to factor into your read of the
            body in front of you, so it stays invisible. A teaching tool you never get to use.
          </p>
        </div>
      </section>

      {/* ── § 03 What you get ────────────────────────────────────────────── */}
      <section className="section-pad section--inset springs101-get">
        <div className="container">
          <div className="springs101-get__head">
            <div className="kicker">§ 03 · What You Get</div>
            <h2 className="springs101-get__title">
              Understand the spring, sharpen <span className="italic accent">your eye.</span>
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

      {/* ── § 04 You learned the what, here's the why (empathy + proof) ──── */}
      <section className="section-pad section--inset springs101-guide">
        <div className="container">
          <div className="springs101-guide__head">
            <div className="kicker">§ 04 · You learned the what. Here&rsquo;s the why.</div>
            <h2 className="springs101-guide__title">
              Training hands you the setting. Load is what lets you{' '}
              <span className="italic accent">adapt it.</span>
            </h2>
            <p className="springs101-guide__body">
              The setting you were taught was the right place to start. Certification hands
              every instructor a spring for the exercise, and that baseline is the foundation
              good teaching is built on. Springs 101 adds the layer on top of it: once you
              understand how the spring loads, that starting setting stops being a rule you
              follow and becomes something you can adjust with reason, for the body actually in
              front of you.
            </p>
            <a href="#signup" className="btn btn--lg springs101-guide__cta">
              Get free access <ArrowSvg />
            </a>
          </div>
        </div>
      </section>

      {/* ── § 05 How it works ────────────────────────────────────────────── */}
      <section className="section-pad section--inset springs101-how">
        <div className="container">
          <div className="kicker">§ 05 · How It Works</div>
          <h2 className="springs101-how__title">
            Get access in <span className="italic accent">three steps.</span>
          </h2>
          <div className="springs101-how__grid">
            <button
              type="button"
              className="springs101-how__media"
              onClick={openVideoFullscreen}
              aria-label="Enlarge the Spring Load Calculator demo video to fullscreen"
            >
              <video
                className="springs101-how__video"
                autoPlay
                loop
                muted
                playsInline
                preload="metadata"
                aria-label="Screen recording of the Spring Load Calculator: picking a brand, selecting a spring color, and dragging to read the load."
              >
                <source src="/images/springs101/spring-tool-demo.mp4" type="video/mp4" />
              </video>
              <span className="springs101-how__zoom" aria-hidden="true">
                <ExpandSvg /> Enlarge
              </span>
            </button>
            <div className="springs101-how__list">
              {STEPS.map((s) => (
                <div key={s.n}>
                  <span className="springs101-how__step-n">§ {s.n}</span>
                  <p className="springs101-how__step-body">{s.body}</p>
                </div>
              ))}
            </div>
          </div>
          <p className="springs101-signup__note" style={{ marginTop: '32px' }}>
            No card, no trial, no catch. Just the physics.
          </p>
        </div>
      </section>

      {/* ── § 06 Signup ──────────────────────────────────────────────────── */}
      <section className="section-pad section--inset springs101-signup" id="signup" style={{ scrollMarginTop: '5rem' }}>
        <div className="container container--narrow">
          <div className="kicker">§ 06 · Get Access</div>
          <h2 className="springs101-signup__head">
            Know spring physics, deliver <span className="italic accent">better classes.</span>
          </h2>

          <div className="springs101-signup__body">
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
        </div>
      </section>
    </div>
  )
}
