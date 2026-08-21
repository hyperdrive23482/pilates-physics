import { useState } from 'react'
import { Link } from 'react-router-dom'
import ArrowSvg from '../components/ui/ArrowSvg'
import { useWorkshops } from '../hooks/useWorkshops'
import '../styles/ppv2.css'
import './Education.css'

const PATHS = [
  {
    n: '01',
    label: 'ONLINE COURSE',
    title: 'The Making of a Reformer',
    sub: 'How your machine works, and why',
    body: 'A behind-the-scenes look at reformer design, from spring specs to all the decisions that impact how a body is loaded.',
    meta: 'Coming soon',
    ctaLabel: null,
  },
  {
    n: '02',
    label: 'LIVE, VIRTUAL WORKSHOP',
    title: 'Pilates Physics 101',
    sub: 'The Reformer',
    body: 'The same settings load every body differently. Learn why, and leave able to reason your way to the right setup for whoever is on the carriage.',
    seriesPrefix: 'PP-101',
    ctaLabel: 'Learn more',
    to: '/pilates-physics-101',
  },
  {
    n: '03',
    label: 'LIVE, VIRTUAL WORKSHOP',
    title: 'Pilates Physics 102',
    sub: 'Chair and Cadillac',
    body: 'The Chair and Cadillac break the reformer mold. See how spring direction, lever length, and body weight combine so you can adapt any exercise on the spot.',
    seriesPrefix: 'PP-102',
    ctaLabel: 'Learn more',
    to: '/pilates-physics-102',
  },
  {
    n: '04',
    label: 'PRIVATE, VIRTUAL',
    title: '1:1 Mentoring',
    sub: 'Your questions, your clients, your equipment',
    body: "Virtual sessions to work through the questions your training never covered, on your equipment, at your pace. Limited slots. $220 per session.",
    meta: 'By inquiry',
    ctaLabel: 'Inquire',
    href: '#inquiry',
  },
  {
    n: '05',
    label: 'ON-SITE OR VIRTUAL',
    title: 'Custom Workshops',
    sub: 'Built for your team',
    body: 'In your studio or online, from 2 to 6 hours, shaped around the topics your instructors need most.',
    meta: 'By inquiry',
    ctaLabel: 'Inquire',
    href: '#inquiry',
  },
  {
    n: '06',
    label: 'FOR TEACHER TRAINING PROGRAMS',
    title: 'Licensed Curriculum Module',
    sub: 'Pilates Physics to empower your graduates',
    body: 'Add a Pilates Physics module to your existing teacher training program. Get a license for lifetime use of custom or off-the-shelf educational content.',
    meta: 'By inquiry',
    ctaLabel: 'Inquire',
    href: '#inquiry',
  },
]

export default function Education() {
  const { workshops } = useWorkshops()
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

  // Cards with a slug pull their status line from live webinars data so the
  // date never goes stale: the upcoming date while registration is open, a
  // waitlist label once the session is complete.
  function cardMeta(path) {
    if (!path.seriesPrefix) return path.meta
    const now = Date.now()
    const next = workshops
      .filter(
        (w) =>
          w.slug?.startsWith(`${path.seriesPrefix}-`) &&
          w.kind === 'webinar' &&
          ['upcoming', 'live'].includes(w.status) &&
          w.scheduled_at &&
          new Date(w.scheduled_at).getTime() > now,
      )
      .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at))[0]
    if (!next) return 'Join the waitlist'
    const date = new Date(next.scheduled_at).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
    return `Next · ${date}`
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
              Online workshops, private mentoring, and licensed teacher-training
              modules. Pick the depth that fits where you are right now.
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
                {p.sub && <p className="fcard__sub italic">{p.sub}</p>}
                <p className="fcard__body">{p.body}</p>
                <div className="fcard__foot">
                  <span>{cardMeta(p)}</span>
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
