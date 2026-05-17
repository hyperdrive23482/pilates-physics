import { Link } from 'react-router-dom'
import RegisterCard from '../components/ui/RegisterCard'
import ArrowSvg from '../components/ui/ArrowSvg'
import { useWorkshop } from '../hooks/useWorkshops'
import '../styles/ppv2.css'
import './Workshop.css'

const WHO = [
  {
    n: '01',
    body: 'Have been teaching long enough to notice that the same setup doesn\'t work the same way on every body.',
  },
  {
    n: '02',
    body: <>Want to understand <em>why</em> their adjustments work, not just <em>that</em> they work.</>,
  },
  {
    n: '03',
    body: 'Would rather learn a framework than memorize another chart.',
  },
]

const TOPICS = [
  {
    n: '01',
    label: 'SPRINGS',
    title: 'Spring Mechanics',
    body: 'Why springs get heavier as they stretch, how that differs from weight stacks, and whether they really push and pull (and why).',
  },
  {
    n: '02',
    label: 'EQUIPMENT',
    title: 'Equipment Variables',
    body: 'How gear position, footbar height, and rope length change the force environment — not just the difficulty, but what the body is actually asked to do.',
  },
  {
    n: '03',
    label: 'BODY',
    title: 'Body Mechanics',
    body: 'How limb length, bodyweight, and strength interact with equipment settings. Why the same spring feels different for every client.',
  },
  {
    n: '04',
    label: 'FRAMEWORK',
    title: 'A Transferable Framework',
    body: 'Not a new table to memorize — a way of understanding the loading environment mechanically. Applicable to any exercise, any brand of reformer, any body.',
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
    body: 'A downloadable PDF covering the key topics from the session — built for quick reference in the studio.',
  },
]

const FAQ = [
  {
    q: 'Do I need an engineering background?',
    a: 'Not at all. The concepts are explained for movement professionals — no math prerequisites, no jargon without context.',
  },
  {
    q: 'Will there be a recording?',
    a: 'Yes. The full recording is shared within 24 hours of the live session.',
  },
  {
    q: 'What equipment knowledge do I need?',
    a: 'This course is best for professionals who are certified to teach on a reformer and have active clients or group classes.',
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

export default function PilatesPhysics101() {
  const { workshop } = useWorkshop('PP-101-May-2026')

  return (
    <div className="ppv2 grid-bg" data-section-style="alt">
      {/* ── § 01 Hero ────────────────────────────────────────────────────── */}
      <section className="workshop-hero section-frame">
        <span className="cross tl"></span>
        <span className="cross tr"></span>

        <div className="container">
          <div className="workshop-hero__inner">
            <div className="kicker">§ 01 · Live Workshop · Pilates Physics 101</div>
            <h1 className="workshop-hero__title">
              The physics <span className="italic accent">behind the equipment.</span>
            </h1>
            <p className="workshop-hero__lede">
              A 2-hour live session for Pilates instructors who want to understand
              why their equipment works the way it does — not just what settings to use.
            </p>

            <div className="workshop-hero__cta">
              <a href="#register" className="btn btn--lg">
                Register Now — $99
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
              Connected topics that build a mechanical framework you can apply to
              any exercise, any reformer, any client.
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
            Live. Interactive. Built for <span className="italic accent">working instructors.</span>
          </h2>
          <p className="workshop-cta__lede">
            Whether you've been teaching for a year or ten, this workshop gives you a
            mechanical framework for the questions you already have.
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
