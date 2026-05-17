import { useState } from 'react'
import { Link } from 'react-router-dom'
import ArrowSvg from '../components/ui/ArrowSvg'
import '../styles/ppv2.css'
import './Education.css'

const PATHS = [
  {
    n: '01',
    label: '2-HOUR LIVE WORKSHOP',
    title: 'Pilates Physics 101',
    body: 'A focused 2-hour live session on the mechanics behind reformer springs and the equipment variables that change how a body is loaded. New to Pilates Physics? Start here.',
    meta: 'Next · May 20, 2026',
    ctaLabel: 'Learn more',
    to: '/pilates-physics-101',
  },
  {
    n: '02',
    label: '2-HOUR LIVE WORKSHOP',
    title: 'Pilates Physics 102: Chair and Cadillac',
    body: 'A focused 2-hour live session on the mechanics of the Wunda Chair and Cadillac — spring orientation, lever arms, and how the same load behaves differently across these two pieces of equipment.',
    meta: 'Next · July 15, 2026',
    ctaLabel: 'Learn more',
    to: '/pilates-physics-102',
  },
  {
    n: '03',
    label: '3-HOUR WORKSHOP',
    title: 'Pilates Physics 201: Advanced Load Analysis',
    body: 'A deeper 3-hour workshop on building free-body diagrams for common Pilates exercises and using physics to progress them in your own teaching.',
    meta: 'Coming soon',
    ctaLabel: null,
  },
  {
    n: '04',
    label: 'PRIVATE',
    title: '1:1 Mentoring',
    body: "One-off or ongoing private mentoring tailored to the questions you have right now — your clients, your studio, your equipment. Limited slots. $180 per session. Includes limited email support.",
    meta: 'By inquiry',
    ctaLabel: 'Inquire',
    href: '#inquiry',
  },
  {
    n: '05',
    label: 'ON-SITE AT YOUR STUDIO',
    title: 'In-person Workshops',
    body: 'Bring Pilates Physics to your studio or training program. Custom-built sessions from 1–6 hours either in-person or virtual.',
    meta: 'By inquiry',
    ctaLabel: 'Inquire',
    href: '#inquiry',
  },
]

export default function Education() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [interest, setInterest] = useState('')
  const [message, setMessage] = useState('')
  const [website, setWebsite] = useState('')
  const [status, setStatus] = useState('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')

    try {
      const res = await fetch('/api/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'inquiry', name, email, interest, message, website }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Something went wrong. Try again.')
      setStatus('success')
    } catch (err) {
      setErrorMsg(err.message || 'Something went wrong. Try again.')
      setStatus('error')
    }
  }

  return (
    <div className="ppv2 grid-bg" data-section-style="alt">
      {/* ── § 01 Hero ────────────────────────────────────────────────────── */}
      <section className="education-hero section-frame">
        <span className="cross tl"></span>
        <span className="cross tr"></span>

        <div className="container">
          <div className="education-hero__inner">
            <div className="kicker">§ 01 · Education</div>
            <h1 className="education-hero__title">
              Five ways to learn the <span className="italic accent">physics of Pilates.</span>
            </h1>
            <p className="education-hero__lede">
              From 2-hour live workshops to private mentoring — pick the depth
              that fits where you are right now.
            </p>
          </div>
        </div>

        <span className="cross bl"></span>
        <span className="cross br"></span>
      </section>

      {/* ── § 02 Paths ───────────────────────────────────────────────────── */}
      <section className="section-pad section--inset education-paths">
        <div className="container">
          <div className="education-paths__head">
            <div className="kicker">§ 02 · Learning Paths</div>
            <h2 className="education-paths__title">
              Choose the <span className="italic accent">depth.</span>
            </h2>
          </div>

          <div className="education-paths__grid">
            {PATHS.map((p) => (
              <article className="fcard" key={p.title}>
                <div className="fcard__head">
                  <span className="fcard__n mono">{p.n}</span>
                  <span className="fcard__dot mono">·</span>
                  <span className="fcard__label mono accent">{p.label}</span>
                </div>
                <h3 className="fcard__title">{p.title}</h3>
                <p className="fcard__body">{p.body}</p>
                <div className="fcard__foot">
                  <span>{p.meta}</span>
                  {p.to ? (
                    <Link to={p.to} className="arrow-link">{p.ctaLabel} →</Link>
                  ) : p.href ? (
                    <a href={p.href} className="arrow-link">{p.ctaLabel} →</a>
                  ) : (
                    <span style={{ color: 'var(--ink-faint)' }}>—</span>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── § 03 Inquiry form ────────────────────────────────────────────── */}
      <section className="section-pad section--inset education-inquiry" id="inquiry" style={{ scrollMarginTop: '5rem' }}>
        <div className="container container--narrow">
          <div className="kicker">§ 03 · Inquire</div>
          <h2 className="education-inquiry__head">
            Inquire about <span className="italic accent">mentoring or in-person workshops.</span>
          </h2>
          <p className="education-inquiry__lede">
            Tell me a little about what you're looking for — your studio, your
            clients, your timeline — and I'll get back to you within a few days.
          </p>

          {status === 'success' ? (
            <div className="education-inquiry__success">
              <p className="education-inquiry__success-head">§ Received</p>
              <p className="education-inquiry__success-body">
                Thanks — your inquiry is on its way. I'll reply within a few days.
                Check your inbox for a confirmation email.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="pp-form">
              <div className="pp-form__field">
                <label className="pp-form__label">Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
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

              <div className="pp-form__field">
                <label className="pp-form__label">I'm interested in</label>
                <select
                  required
                  value={interest}
                  onChange={(e) => setInterest(e.target.value)}
                  disabled={status === 'loading'}
                  className="pp-form__select"
                >
                  <option value="">Select one…</option>
                  <option value="1:1 mentoring">1:1 mentoring</option>
                  <option value="In-person workshop">In-person workshop</option>
                  <option value="Both">Both</option>
                </select>
              </div>

              <div className="pp-form__field">
                <label className="pp-form__label">Tell me more</label>
                <textarea
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={status === 'loading'}
                  maxLength={2000}
                  rows={6}
                  placeholder="What are you looking for? Where are you located? Any timeline?"
                  className="pp-form__textarea"
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
                {status === 'loading' ? 'Sending…' : 'Send inquiry'}
                {status !== 'loading' && <ArrowSvg />}
              </button>

              {status === 'error' && (
                <p className="pp-form__error">{errorMsg}</p>
              )}
            </form>
          )}
        </div>
      </section>
    </div>
  )
}
