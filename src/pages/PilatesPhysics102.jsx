import { Link } from 'react-router-dom'
import RegisterCard from '../components/ui/RegisterCard'
import WaitlistForm from '../components/ui/WaitlistForm'
import ArrowSvg from '../components/ui/ArrowSvg'
import { useCurrentWorkshop } from '../hooks/useWorkshops'
import { isRegistrationOpen, formatWorkshopWhen } from '../lib/workshop'
import '../styles/ppv2.css'
import './Workshop.css'

const FRAMEWORK = [
  {
    n: '01',
    label: 'FEEDBACK LOOP',
    title: 'The same loop, two new pieces of equipment.',
    body: 'Intention. Loading. Feedback. The framework that ran through every reformer exercise runs through every cadillac and chair exercise too.',
  },
  {
    n: '02',
    label: 'SPRING MECHANICS',
    title: "Hooke's Law. Supportive vs. resistive.",
    body: 'Springs only pull. They get heavier as they stretch. They can support or resist the intended movement, depending on setup.',
  },
  {
    n: '03',
    label: 'BODY WEIGHT',
    title: 'When body weight enters the equation.',
    body: 'Body weight can affect the difficulty of some exercises on every apparatus, even when springs are in play.',
  },
]

const TOPICS = [
  {
    n: '01',
    label: 'CHAIR MECHANICS',
    title: 'Spring tension on a fixed arc.',
    body: 'How the spring and pedal interact to apply load to the body.',
  },
  {
    n: '02',
    label: 'CADILLAC MECHANICS',
    title: 'Where you anchor changes the load.',
    body: 'How the spring and push-through bar interact to apply load to the body.',
  },
  {
    n: '03',
    label: 'ANGLE OF PULL',
    title: 'From feeling to vector resolution.',
    body: 'Far more important on the chair and cadillac than on the reformer. We go deeper into it here.',
  },
]

const INCLUDED = [
  {
    n: '01',
    label: 'LIVE SESSION',
    title: '2-Hour Live Session',
    body: 'Real-time instruction with live Q&A. Ask questions, get answers, go deeper on the topics that matter to your practice.',
  },
  {
    n: '02',
    label: 'RECORDING',
    title: 'Full Recording',
    body: "Can't attend live? The full recording is shared within 24 hours.",
  },
  {
    n: '03',
    label: 'REFERENCE',
    title: 'Reference Guide',
    body: 'A downloadable PDF covering the key topics from the session. Built for quick reference in the studio.',
  },
]

const FAQ = [
  {
    q: 'Do I need an engineering background?',
    a: 'Not at all. The concepts are explained for movement professionals. No math prerequisites, no jargon without context.',
  },
  {
    q: 'Do I need to have taken Pilates Physics 101?',
    a: (
      <>
        No. 101 and 102 teach the same framework applied to different loading
        scenarios, so you can start with either one. Many people find it easiest
        to meet the concepts on the reformer first in 101, since it's the
        equipment they know <i>very</i> well, but 102 stands on its own if the
        chair and cadillac are where you'd rather begin.
      </>
    ),
  },
  {
    q: 'Where does the workshop take place?',
    a: 'Online, live on Zoom. Join from your studio, your kitchen table, anywhere with a screen. Your Zoom link waits in your workshop portal once you register.',
  },
  {
    q: 'Will there be a recording?',
    a: 'Yes. The full recording is shared within 24 hours of the live session.',
  },
  {
    q: 'Do I need a cadillac and chair in my studio?',
    a: 'No. The workshop is conceptual so the principles apply wherever you teach.',
  },
  {
    q: 'Is this for classical or contemporary instructors?',
    a: "Both. Physics doesn't take sides. A spring behaves the same way regardless of your training lineage.",
  },
  {
    q: "What if I can't make the live session?",
    a: "The workshop recording is included with every registration. You will have access to it for at least 6 months. If you can't attend but have specific questions, you can submit them ahead of time via the Pilates Physics Portal. Of course, a big value of the workshop is the live Q&A, but I understand the difficulties of scheduling.",
  },
]

export default function PilatesPhysics102() {
  const { workshop, loading } = useCurrentWorkshop('PP-102')
  const registrationOpen = isRegistrationOpen(workshop)
  const price = workshop?.price_cents ? `$${(workshop.price_cents / 100).toFixed(0)}` : null
  const dateLong = workshop?.scheduled_at
    ? new Date(workshop.scheduled_at).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : 'To be announced'
  const specs = [
    { k: 'Date', v: dateLong },
    { k: 'Time', v: '11am PDT / 2pm EDT' },
    { k: 'Duration', v: '2 hours' },
    { k: 'Location', v: 'Zoom' },
    { k: 'Format', v: 'Live · recording included' },
    { k: 'NPCP CECs', v: '2.0' },
    { k: 'Price', v: price || 'To be announced' },
  ]
  const ctaLabel = registrationOpen
    ? `Register Now.${price ? ` ${price}` : ''}`
    : 'Join Waitlist'

  return (
    <div className="ppv2 grid-bg" data-section-style="alt">
      {/* ── § 01 Hero ────────────────────────────────────────────────────── */}
      <section className="workshop-hero section-frame">
        <span className="cross tl"></span>
        <span className="cross tr"></span>

        <div className="container">
          <div className="workshop-hero__inner">
            <div className="kicker">§ 01 · Pilates Physics 102 Workshop</div>
            <h1 className="workshop-hero__title">
              Same framework. <span className="italic accent">New geometry.</span>
            </h1>
            <p className="workshop-hero__lede">
              Expand the Pilates Physics framework beyond the reformer to two new
              pieces of equipment that introduce different mechanical applications
              of force.
            </p>

            <div className="workshop-hero__cta">
              <a href="#register" className="btn btn--lg">
                {ctaLabel}
                <ArrowSvg />
              </a>
            </div>
            <p className="workshop-hero__meta">
              <span className="workshop-hero__meta-k">Live</span>
              {workshop?.scheduled_at
                ? `${formatWorkshopWhen(workshop.scheduled_at)} · recording included`
                : 'recording included'}
            </p>
          </div>
        </div>

        <span className="cross bl"></span>
        <span className="cross br"></span>
      </section>

      {/* ── § 02 Why a physics class for the chair and cadillac ──────────── */}
      <section className="section-pad section--inset workshop-why">
        <div className="container">
          <div className="kicker">§ 02 · Why this workshop</div>
          <h2 className="workshop-why__head">
            You can feel the difference between a high hook and a low hook. <span className="italic accent">Now explain it.</span>
          </h2>
          <p className="workshop-why__body">
            If you can teach the same exercise on the cadillac with two different
            anchor heights and feel that they're different, but can't fully say why,
            this workshop is for you. Same on the chair, where a heavy client and a
            light client work very different loads on the same springs.
          </p>
        </div>
      </section>

      {/* ── § 03 Framework ───────────────────────────────────────────────── */}
      <section className="section-pad section--inset workshop-framework">
        <div className="container">
          <div className="workshop-framework__head-wrap">
            <div className="kicker">§ 03 · Built on Pilates Physics 101</div>
            <h2 className="workshop-framework__head">
              Expand your feedback loop to <span className="italic accent">two new apparatus.</span>
            </h2>
            <p className="workshop-framework__lede">
              The same feedback loop, spring mechanics, and body weight analysis from
              Pilates Physics 101 apply to the chair and cadillac.
            </p>
          </div>

          <div className="workshop-framework__grid">
            {FRAMEWORK.map((c) => (
              <article className="fcard" key={c.n}>
                <div className="fcard__head">
                  <span className="fcard__n mono">{c.n}</span>
                  <span className="fcard__dot mono">·</span>
                  <span className="fcard__label mono accent">{c.label}</span>
                </div>
                <h3 className="fcard__title">{c.title}</h3>
                <p className="fcard__body">{c.body}</p>
              </article>
            ))}
          </div>

        </div>
      </section>

      {/* ── § 04 Topics covered ──────────────────────────────────────────── */}
      <section className="section-pad-l section--inset workshop-topics">
        <div className="container">
          <div className="workshop-topics__head">
            <div className="kicker">§ 04 · What you'll learn</div>
            <h2 className="workshop-topics__title">
              Two pieces of equipment, <span className="italic accent">united by physics.</span>
            </h2>
            <p className="workshop-topics__lede">
              The chair and cadillac look and work differently, but they're tied
              together by the basics of spring mechanics and angle of pull.
            </p>
          </div>

          <div className="workshop-topics__grid workshop-topics__grid--cols-3">
            {TOPICS.map((t) => (
              <article className="fcard" key={t.n}>
                <div className="fcard__head">
                  <span className="fcard__n mono">{t.n}</span>
                  <span className="fcard__dot mono">·</span>
                  <span className="fcard__label mono accent">{t.label}</span>
                </div>
                <h3 className="fcard__title">{t.title}</h3>
                <p className="fcard__body">{t.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── § 05 Details + Register ──────────────────────────────────────── */}
      <section className="section-pad section--inset workshop-details">
        <div className="container">
          <div className="workshop-details__grid">
            <div>
              <div className="kicker">§ 05 · Details</div>
              <h2 className="workshop-details__head">The <span className="italic accent">specs.</span></h2>

              <dl className="spec-list">
                {specs.map((s) => (
                  <div className="spec-list__row" key={s.k}>
                    <dt className="spec-list__k">{s.k}</dt>
                    <dd className="spec-list__v">{s.v}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div id="register" className="workshop-details__register">
              {loading ? (
                <p className="workshop-state__msg">Loading registration…</p>
              ) : workshop ? (
                <RegisterCard workshop={workshop} />
              ) : (
                <div className="register-card">
                  <h3 className="register-card__title">Registration opens soon</h3>
                  <p className="register-card__body">
                    Join the waitlist and we'll notify you as soon as registration opens.
                  </p>
                  <WaitlistForm />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── § 06 Instructor ──────────────────────────────────────────────── */}
      <section className="section-pad section--inset workshop-instructor">
        <div className="container">
          <div className="workshop-instructor__grid">
            <div className="meet__photo">
              <div className="meet__photo-tag">
                <span className="meet__photo-tag-id">FIG. 01</span>
                <span>INSTRUCTOR</span>
              </div>
              <img src="/images/about/kaleen-sitting.jpg" alt="Kaleen Canevari" />
            </div>

            <div className="workshop-instructor__body">
              <div className="kicker">§ 06 · Your Instructor</div>
              <h2 className="workshop-instructor__head">
                Meet <span className="italic accent">Kaleen.</span>
              </h2>
              <p className="workshop-instructor__role">Mechanical Engineer · Pilates Instructor</p>

              <p>
                Mechanical engineer first, Pilates instructor since 2014. Kaleen's
                spent over a decade at the intersection of the two: as a design
                engineer at Balanced Body, running an equipment maintenance business
                (The Fit Reformer), and founding a smart Pilates equipment company.
              </p>
              <p>
                Pilates Physics is where she brings that engineering lens to
                instructor education, making the mechanics behind the equipment
                accessible to every working instructor.
              </p>

              <Link to="/about" className="arrow-link">More about Kaleen →</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── § 07 What's included ─────────────────────────────────────────── */}
      <section className="section-pad section--inset workshop-included">
        <div className="container">
          <div className="kicker">§ 07 · What's included</div>
          <h2 className="workshop-included__head">
            Every registration <span className="italic accent">includes.</span>
          </h2>

          <div className="workshop-included__grid">
            {INCLUDED.map((c) => (
              <article className="fcard" key={c.n}>
                <div className="fcard__head">
                  <span className="fcard__n mono">{c.n}</span>
                  <span className="fcard__dot mono">·</span>
                  <span className="fcard__label mono accent">{c.label}</span>
                </div>
                <h3 className="fcard__title">{c.title}</h3>
                <p className="fcard__body">{c.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── § 08 FAQ ─────────────────────────────────────────────────────── */}
      <section className="section-pad section--inset workshop-faq">
        <div className="container container--narrow">
          <div className="kicker">§ 08 · Common questions</div>
          <h2 className="workshop-faq__head">
            Frequently <span className="italic accent">asked.</span>
          </h2>

          <div className="workshop-faq__list">
            {FAQ.map((item, i) => (
              <details className="workshop-faq__item" key={i}>
                <summary className="workshop-faq__summary">
                  <span className="workshop-faq__n">Q.{String(i + 1).padStart(2, '0')}</span>
                  <h3 className="workshop-faq__q">{item.q}</h3>
                  <span className="workshop-faq__toggle" aria-hidden="true">+</span>
                </summary>
                <div className="workshop-faq__answer">
                  <p className="workshop-faq__a">{item.a}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── § 09 Final CTA ───────────────────────────────────────────────── */}
      <section className="workshop-cta section--inset">
        <div className="container container--narrow">
          <div className="kicker">§ 09 · Register</div>
          <h2 className="workshop-cta__head">
            The framework you already have. <span className="italic accent">On the rest of the apparatus.</span>
          </h2>
          <p className="workshop-cta__lede">
            One focused session. The 101 framework, extended to the cadillac and the
            chair.{' '}
            {registrationOpen
              ? 'Reserve your seat.'
              : "Join the waitlist and we'll let you know the next time it runs."}
          </p>
          <a href="#register" className="btn btn--lg">
            {ctaLabel}
            <ArrowSvg />
          </a>
        </div>
      </section>
    </div>
  )
}
