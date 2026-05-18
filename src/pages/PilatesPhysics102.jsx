import { Link } from 'react-router-dom'
import RegisterCard from '../components/ui/RegisterCard'
import ArrowSvg from '../components/ui/ArrowSvg'
import { useWorkshop } from '../hooks/useWorkshops'
import '../styles/ppv2.css'
import './Workshop.css'

const FRAMEWORK = [
  {
    n: '01',
    label: 'INTENTION',
    title: 'Why are you teaching this exercise?',
    body: 'What outcome are you actually aiming for. Stability, max load, coordination, flexibility, warm-up, breath. The same exercise can emphasize different purposes.',
  },
  {
    n: '02',
    label: 'LOADING',
    title: 'What forces is the client experiencing?',
    body: 'Where are the loads coming from? Body weight, spring tension, equipment adjustments. The loads have to support the intent.',
  },
  {
    n: '03',
    label: 'FEEDBACK',
    title: 'What do you see, what do they say?',
    body: 'Visual cues from the body, verbal cues from the client. Observing without asking is guessing.',
  },
]

const TOPICS = [
  {
    n: '01',
    label: 'CHAIR SPRINGS',
    title: 'Chair Spring Mechanics',
    body: 'Where the springs attach on a Wunda or Combo Chair, how pedal travel changes the spring length, and what that means for the load through the exercise.',
  },
  {
    n: '02',
    label: 'CADILLAC',
    title: 'Cadillac Spring Geometry',
    body: 'Why the same spring on a different hook is a different exercise. How attachment height and angle change the direction and magnitude of force the body has to manage.',
  },
  {
    n: '03',
    label: 'LEVERS',
    title: 'Body Position and Lever Arms',
    body: 'How the relationship between the body, the spring, and the apparatus determines the actual load on a joint. Small position changes produce large mechanical changes.',
  },
  {
    n: '04',
    label: 'FRAMEWORK',
    title: 'A Transferable Framework',
    body: 'The same physics principles that explain the reformer also explain the Chair and Cadillac. One mental model, applied across the apparatus.',
  },
]

const SPECS = [
  { k: 'Date', v: 'Wednesday, July 15, 2026' },
  { k: 'Time', v: '11am PDT / 2pm EDT' },
  { k: 'Duration', v: '2 hours' },
  { k: 'Format', v: 'Live via Zoom · recording included' },
  { k: 'Price', v: '$99' },
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
    a: "No. 102 stands on its own. If you have taken 101, you'll recognize the framework being extended to new equipment. If you haven't, you'll still walk away with a clear mental model for the Chair and Cadillac.",
  },
  {
    q: 'Will there be a recording?',
    a: 'Yes. The full recording is shared within 24 hours of the live session.',
  },
  {
    q: 'What equipment knowledge do I need?',
    a: "This course is best for professionals who are certified to teach Pilates and have at least some exposure to the Chair and/or Cadillac. You don't need to teach on them daily, just enough familiarity to follow along.",
  },
  {
    q: 'Is this for classical or contemporary instructors?',
    a: "Both. Physics doesn't take sides. A spring behaves the same way regardless of your training lineage.",
  },
  {
    q: "What if I can't make the live session?",
    a: 'The recording is included with every registration. You can submit questions ahead of time. Of course, a big value of the workshop is the live Q&A, but I understand the difficulties of scheduling.',
  },
]

export default function PilatesPhysics102() {
  const { workshop } = useWorkshop('PP-102-July-2026')

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
              Physics for the <span className="italic accent">Chair and Cadillac.</span>
            </h1>
            <p className="workshop-hero__lede">
              The same spring on a different hook is a different exercise. This workshop
              builds the mental model for what changes when the body moves from the
              reformer to the Chair or the Cadillac.
            </p>

            <div className="workshop-hero__cta">
              <a href="#register" className="btn btn--lg">
                Register Now. $99
                <ArrowSvg />
              </a>
            </div>
            <p className="workshop-hero__meta">
              <span className="workshop-hero__meta-k">Live</span>Wed Jul 15 · 11am PDT · recording included
            </p>
          </div>
        </div>

        <span className="cross bl"></span>
        <span className="cross br"></span>
      </section>

      {/* ── § 02 Why a physics class for the Chair and Cadillac ──────────── */}
      <section className="section-pad section--inset workshop-why">
        <div className="container">
          <div className="kicker">§ 02 · Why a physics class for the Chair and Cadillac</div>
          <h2 className="workshop-why__head">
            What works on the reformer doesn't always transfer to <span className="italic accent">the rest of the apparatus.</span>
          </h2>
          <p className="workshop-why__body">
            If you can read load on the reformer but feel less certain on the Chair, or
            if you can teach the Cadillac but can't fully explain why a high hook and a
            low hook feel so different, this workshop is for you.
          </p>
        </div>
      </section>

      {/* ── § 03 Framework ───────────────────────────────────────────────── */}
      <section className="section-pad section--inset workshop-framework">
        <div className="container">
          <div className="workshop-framework__head-wrap">
            <div className="kicker">§ 03 · The Framework</div>
            <h2 className="workshop-framework__head">
              The same lens. <span className="italic accent">On the Chair and Cadillac.</span>
            </h2>
            <p className="workshop-framework__lede">
              Before any physics, a way of looking at any Pilates exercise on any
              apparatus. The framework runs as a loop: set the intention, read the
              loading, listen to the feedback, then adjust.
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

          <p className="workshop-framework__close mono">
            The apparatus changes. The lens stays the same.
          </p>
        </div>
      </section>

      {/* ── § 04 Topics covered ──────────────────────────────────────────── */}
      <section className="section-pad-l section--inset workshop-topics">
        <div className="container">
          <div className="workshop-topics__head">
            <div className="kicker">§ 04 · What you'll learn</div>
            <h2 className="workshop-topics__title">
              Four topics. One <span className="italic accent">transferable model.</span>
            </h2>
            <p className="workshop-topics__lede">
              Connected topics that extend the Pilates Physics framework to the Chair
              and the Cadillac. Two pieces of equipment that load the body very
              differently from the reformer.
            </p>
          </div>

          <div className="workshop-topics__grid">
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
                {SPECS.map((s) => (
                  <div className="spec-list__row" key={s.k}>
                    <dt className="spec-list__k">{s.k}</dt>
                    <dd className="spec-list__v">{s.v}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div id="register" className="workshop-details__register">
              {workshop ? (
                <RegisterCard workshop={workshop} />
              ) : (
                <p className="workshop-state__msg">Loading registration…</p>
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
            Extend your framework to the <span className="italic accent">Chair and Cadillac.</span>
          </h2>
          <p className="workshop-cta__lede">
            One focused session. One mental model across the apparatus. Reserve your
            seat. Registration is open now.
          </p>
          <a href="#register" className="btn btn--lg">
            Register Now. $99
            <ArrowSvg />
          </a>
        </div>
      </section>
    </div>
  )
}
