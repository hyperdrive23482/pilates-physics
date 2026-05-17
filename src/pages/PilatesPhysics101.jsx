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
    label: 'SPRINGS',
    title: 'Spring Mechanics',
    body: "Hooke's Law for instructors. Why springs get heavier as they stretch, and what that means in practice.",
  },
  {
    n: '02',
    label: 'BODY WEIGHT',
    title: 'Body Weight & Strength',
    body: "When body weight matters, when it doesn't, and why scaling for size isn't only about strength.",
  },
  {
    n: '03',
    label: 'FORCE VECTORS',
    title: 'Force Vectors',
    body: 'Visualize the line of pull and break it down into horizontal and vertical components. No math required.',
  },
  {
    n: '04',
    label: 'FREE BODY DIAGRAMS',
    title: 'Free Body Diagrams',
    body: 'A simple drawing framework for any loading scenario. No calculus required.',
  },
  {
    n: '05',
    label: 'REFORMER',
    title: 'Reformer adjustments',
    body: 'Five adjustment levers besides springs, and why they all come back to how far the spring stretches.',
  },
]

const SPECS = [
  { k: 'Date', v: 'Wednesday, May 20, 2026' },
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
    body: 'A downloadable PDF covering the key topics from the session, built for quick reference in the studio.',
  },
]

const FAQ = [
  {
    q: "I've never taken a course on Pilates Physics before, where should I start?",
    a: 'Here! Pilates Physics 101 introduces the framework for adapting each exercise, the factors to consider when evaluating the load scenario, and practical examples even the most math-averse Pilates instructor can grasp. After this course you can take Pilates Physics 102: Chair and Cadillac, and Pilates Physics 201: Advanced Loading Concepts.',
  },
  {
    q: 'Do I need an engineering background?',
    a: 'Not at all. The concepts are explained for movement professionals. No math prerequisites, no jargon without context.',
  },
  {
    q: 'Will there be a recording?',
    a: 'Yes. The full recording is shared within 24 hours of the live session.',
  },
  {
    q: 'What equipment does this course focus on?',
    a: 'This course focuses on reformer-based physics. It is best for professionals who are certified to teach on a reformer and have active clients or group classes. Pilates Physics 102 focuses on the chair and cadillac.',
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

function HookesLawDiagram() {
  return (
    <svg className="fcard__diagram" viewBox="0 0 120 120" aria-hidden="true">
      <line x1="22" y1="100" x2="112" y2="100" stroke="currentColor" strokeWidth="1" opacity="0.45" />
      <line x1="22" y1="100" x2="22" y2="14" stroke="currentColor" strokeWidth="1" opacity="0.45" />
      <polygon points="112,100 107,97.5 107,102.5" fill="currentColor" opacity="0.45" />
      <polygon points="22,14 19.5,19 24.5,19" fill="currentColor" opacity="0.45" />
      <line x1="22" y1="86" x2="108" y2="22" stroke="var(--accent)" strokeWidth="1.75" />
      <text className="mono" x="10" y="18" fontSize="9.5" fill="currentColor">F</text>
      <text className="mono" x="108" y="115" fontSize="9.5" fill="currentColor">x</text>
    </svg>
  )
}

function ForceVectorDiagram() {
  return (
    <svg className="fcard__diagram" viewBox="0 0 120 120" aria-hidden="true">
      <defs>
        <marker id="pp101-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 z" fill="var(--accent)" />
        </marker>
      </defs>
      <circle cx="22" cy="98" r="2.5" fill="var(--accent)" />
      <line x1="22" y1="98" x2="100" y2="98" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />
      <line x1="100" y1="98" x2="100" y2="30" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />
      <line x1="22" y1="98" x2="100" y2="30" stroke="var(--accent)" strokeWidth="1.75" markerEnd="url(#pp101-arrow)" />
      <text className="mono" x="55" y="56" fontSize="9.5" fill="var(--accent)">F</text>
      <text className="mono" x="55" y="113" fontSize="9" fill="currentColor" opacity="0.65">Fx</text>
      <text className="mono" x="104" y="68" fontSize="9" fill="currentColor" opacity="0.65">Fy</text>
    </svg>
  )
}

function TopicDiagram({ kind }) {
  if (kind === 'hookes') return <HookesLawDiagram />
  if (kind === 'vector') return <ForceVectorDiagram />
  return null
}

export default function PilatesPhysics101() {
  const { workshop } = useWorkshop('PP-101-May-2026')

  return (
    <div className="ppv2 grid-bg" data-section-style="alt">
      {/* ── § 01 Hero ────────────────────────────────────────────────────── */}
      <section
        className="workshop-hero section-frame"
        style={{ '--workshop-hero-image': "url('/images/homepage/hero-image-4.jpg')" }}
      >
        <span className="cross tl"></span>
        <span className="cross tr"></span>

        <div className="container">
          <div className="workshop-hero__inner">
            <div className="kicker">§ 01 · Pilates Physics 101 Workshop</div>
            <h1 className="workshop-hero__title">
              Physics to <span className="italic accent">adapt and scale</span> Pilates.
            </h1>
            <p className="workshop-hero__lede">
              Understanding the forces in the sessions you teach unlocks adaptability
              for different clients and progression over time.
            </p>

            <div className="workshop-hero__cta">
              <a href="#register" className="btn btn--lg">
                Register Now. $99
                <ArrowSvg />
              </a>
            </div>
            <p className="workshop-hero__meta">
              <span className="workshop-hero__meta-k">Live</span>Wed May 20 · 11am PDT · recording included
            </p>
          </div>
        </div>

        <span className="cross bl"></span>
        <span className="cross br"></span>
      </section>

      {/* ── § 02 Why a physics class for Pilates ─────────────────────────── */}
      <section className="section-pad section--inset workshop-why">
        <div className="container">
          <div className="kicker">§ 02 · Why a physics class for Pilates</div>
          <h2 className="workshop-why__head">
            The same equipment setup doesn't work for <span className="italic accent">everyone.</span>
          </h2>
          <p className="workshop-why__body">
            If you've memorized baseline equipment settings but aren't sure how to
            adjust for the person in front of you, or if you've figured out what
            works but don't know why, this workshop is for you.
          </p>
        </div>
      </section>

      {/* ── § 03 Framework ───────────────────────────────────────────────── */}
      <section className="section-pad section--inset workshop-framework">
        <div className="container">
          <div className="workshop-framework__head-wrap">
            <div className="kicker">§ 03 · The Framework</div>
            <h2 className="workshop-framework__head">
              A three-part lens. For <span className="italic accent">every exercise.</span>
            </h2>
            <p className="workshop-framework__lede">
              Before any physics, a way of looking at any Pilates exercise. The
              framework runs as a loop: set the intention, read the loading, listen
              to the feedback, then adjust.
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
            This loop runs through every exercise we cover.
          </p>
        </div>
      </section>

      {/* ── § 04 Five components of reformer physics ─────────────────────── */}
      <section className="section-pad-l section--inset workshop-topics">
        <div className="container">
          <div className="workshop-topics__head">
            <div className="kicker">§ 04 · What you'll learn</div>
            <h2 className="workshop-topics__title">
              Five mechanical components. One <span className="italic accent">working model.</span>
            </h2>
            <p className="workshop-topics__lede">
              The background physics, broken into the five pieces that determine how
              force shows up in any exercise on the reformer.
            </p>
          </div>

          <div className="workshop-topics__grid">
            {TOPICS.map((t) => (
              <article className="fcard" key={t.n}>
                {t.diagram ? <TopicDiagram kind={t.diagram} /> : null}
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
            Live. Interactive. Built for <span className="italic accent">working instructors.</span>
          </h2>
          <p className="workshop-cta__lede">
            Whether you've been teaching for one year or ten, this workshop gives you a
            mechanical framework for the questions you already have.
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
