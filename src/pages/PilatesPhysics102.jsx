import { Link } from 'react-router-dom'
import RegisterCard from '../components/ui/RegisterCard'
import ArrowSvg from '../components/ui/ArrowSvg'
import { useWorkshop } from '../hooks/useWorkshops'
import '../styles/ppv2.css'
import './Workshop.css'

const WHO = [
  {
    n: '01',
    body: 'Teach (or want to teach) on the Chair and Cadillac and want a clearer mental model of what the springs are actually doing.',
  },
  {
    n: '02',
    body: <>Have noticed that <em>where</em> the spring attaches changes everything — and want to know <em>why</em>.</>,
  },
  {
    n: '03',
    body: 'Already understand reformer mechanics and want to extend that thinking to the rest of the apparatus.',
  },
]

const TOPICS = [
  {
    n: '01',
    label: 'CHAIR SPRINGS',
    title: 'Chair Spring Mechanics',
    body: 'Where the springs attach on a Wunda or Combo Chair, how the pedal travel changes the spring length, and what that means for the load through the exercise.',
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
    title: 'Body Position & Lever Arms',
    body: 'How the relationship between the body, the spring, and the apparatus determines the actual load on a joint — and why small position changes produce big mechanical changes.',
  },
  {
    n: '04',
    label: 'FRAMEWORK',
    title: 'A Transferable Framework',
    body: 'How the same physics principles that explain the reformer also explain the Chair and Cadillac. One mental model, applied across the apparatus.',
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
    body: 'A downloadable PDF covering the key topics from the session — built for quick reference in the studio.',
  },
]

const FAQ = [
  {
    q: 'Do I need an engineering background?',
    a: 'Not at all. The concepts are explained for movement professionals — no math prerequisites, no jargon without context.',
  },
  {
    q: 'Do I need to have taken Pilates Physics 101?',
    a: "No. 102 stands on its own. If you have taken 101, you'll recognize the framework being extended to new equipment; if you haven't, you'll still walk away with a clear mental model for the Chair and Cadillac.",
  },
  {
    q: 'Will there be a recording?',
    a: 'Yes. The full recording is shared within 24 hours of the live session.',
  },
  {
    q: 'What equipment knowledge do I need?',
    a: "This course is best for professionals who are certified to teach Pilates and have at least some exposure to the Chair and/or Cadillac. You don't need to teach on them daily — just enough familiarity to follow along.",
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
            <div className="kicker">§ 01 · Live Workshop · Pilates Physics 102</div>
            <h1 className="workshop-hero__title">
              The physics of the <span className="italic accent">Chair and Cadillac.</span>
            </h1>
            <p className="workshop-hero__lede">
              A 2-hour live session for Pilates instructors who want to understand
              what changes when the body moves from the reformer to the Chair or the
              Cadillac — and why the same spring feels nothing alike on each.
            </p>

            <div className="workshop-hero__cta">
              <a href="#register" className="btn btn--lg">
                Register Now — $99
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

      {/* ── § 02 Who it's for ────────────────────────────────────────────── */}
      <section className="section-pad section--inset workshop-who">
        <div className="container">
          <div className="kicker">§ 02 · Who it's for</div>
          <h2 className="workshop-who__head">
            For Pilates instructors <span className="italic accent">who…</span>
          </h2>

          <div className="workshop-who__grid">
            {WHO.map((c) => (
              <article className="fcard" key={c.n}>
                <div className="fcard__head">
                  <span className="fcard__n mono">{c.n}</span>
                  <span className="fcard__dot mono">·</span>
                  <span className="fcard__label mono accent">WHO</span>
                </div>
                <p className="fcard__body">{c.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── § 03 Topics covered ──────────────────────────────────────────── */}
      <section className="section-pad-l section--inset workshop-topics">
        <div className="container">
          <div className="workshop-topics__head">
            <div className="kicker">§ 03 · What you'll learn</div>
            <h2 className="workshop-topics__title">
              Four topics, one <span className="italic accent">mental model.</span>
            </h2>
            <p className="workshop-topics__lede">
              Connected topics that extend the Pilates Physics framework to the
              Chair and Cadillac — two pieces of equipment that load the body very
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

      {/* ── § 04 Details + Register ──────────────────────────────────────── */}
      <section className="section-pad section--inset workshop-details">
        <div className="container">
          <div className="workshop-details__grid">
            <div>
              <div className="kicker">§ 04 · Details</div>
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

      {/* ── § 05 Instructor ──────────────────────────────────────────────── */}
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
              <div className="kicker">§ 05 · Your Instructor</div>
              <h2 className="workshop-instructor__head">
                Meet <span className="italic accent">Kaleen.</span>
              </h2>
              <p className="workshop-instructor__role">Mechanical Engineer · Pilates Instructor</p>

              <p>
                Kaleen studied mechanical engineering before stepping on a reformer.
                In 2013 she joined Balanced Body as a design engineer, and started
                teaching Pilates in 2014. She's spent over a decade at the intersection
                of engineering and movement — designing equipment, running a Pilates
                equipment maintenance business, and founding a connected Pilates
                equipment company.
              </p>
              <p>
                Pilates Physics is where she brings that engineering lens to
                instructor education — making the mechanics behind the equipment
                accessible to every working instructor.
              </p>

              <Link to="/about" className="arrow-link">More about Kaleen →</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── § 06 What's included ─────────────────────────────────────────── */}
      <section className="section-pad section--inset workshop-included">
        <div className="container">
          <div className="kicker">§ 06 · What's included</div>
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

      {/* ── § 07 FAQ ─────────────────────────────────────────────────────── */}
      <section className="section-pad section--inset workshop-faq">
        <div className="container container--narrow">
          <div className="kicker">§ 07 · Common questions</div>
          <h2 className="workshop-faq__head">
            Frequently <span className="italic accent">asked.</span>
          </h2>

          <div className="workshop-faq__list">
            {FAQ.map((item, i) => (
              <div className="workshop-faq__item" key={i}>
                <div className="workshop-faq__n">Q.{String(i + 1).padStart(2, '0')}</div>
                <div>
                  <h3 className="workshop-faq__q">{item.q}</h3>
                  <p className="workshop-faq__a">{item.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── § 08 Final CTA ───────────────────────────────────────────────── */}
      <section className="workshop-cta section--inset">
        <div className="container container--narrow">
          <div className="kicker">§ 08 · Register</div>
          <h2 className="workshop-cta__head">
            Extend your framework to the <span className="italic accent">Chair and Cadillac.</span>
          </h2>
          <p className="workshop-cta__lede">
            One focused session. One mental model across the apparatus. Reserve your seat —
            registration is open now.
          </p>
          <a href="#register" className="btn btn--lg">
            Register Now — $99
            <ArrowSvg />
          </a>
        </div>
      </section>
    </div>
  )
}
