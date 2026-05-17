import { Link } from 'react-router-dom'
import InteractiveSpringDiagram from '../components/ui/InteractiveSpringDiagram'
import './Landing.css'

// ─── Framework cards — INTENTION / LOADING / FEEDBACK ────────────────────────
const FRAMEWORK_DATA = [
  { n: '01', label: 'INTENTION', q: 'Why are you teaching this exercise?' },
  { n: '02', label: 'LOADING', q: 'What forces is the client actually experiencing?' },
  { n: '03', label: 'FEEDBACK', q: 'What verbal + visual signals are you getting back?' },
]

const TESTIMONIALS = [
  {
    handle: 'playpilatescompany',
    quote: 'Really glad I found your account! Another thing totally absent from my teacher training…',
  },
  {
    handle: 'eduardogperez68',
    quote:
      '@kaleenc_ you are a natural teacher. This is what needs to be added to instructor education. Truly understanding the science to make better teaching decisions.',
  },
  {
    handle: 'cttcpilatesandmore',
    quote: 'So glad to have this explained in an understandable way.',
  },
  {
    handle: 'reformerstudio.nyc',
    quote: 'Changed how I write programming. Spring choice isn\'t a vibe anymore — it\'s a load decision.',
  },
]

const ArrowSvg = () => (
  <svg width="14" height="10" viewBox="0 0 14 10" fill="none" aria-hidden="true">
    <path d="M1 5h12m-4-4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
  </svg>
)

// ─── Landing page ─────────────────────────────────────────────────────────────
export default function Landing() {
  return (
    <div className="ppv2 grid-bg" data-section-style="alt">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="hero section-frame">
        <span className="cross tl"></span>
        <span className="cross tr"></span>

        <div className="container container--wide hero__inner">
          <div className="hero__grid">
            <div className="hero__copy">
              <h1 className="hero__title">
                Pilates<br />
                through the<br />
                <span className="italic accent">physics lens.</span>
              </h1>

              <p className="hero__lede">
                Live workshops that teach easy, science-based principles
                even the most math-averse instructor can grasp.
              </p>

              <div className="hero__cta">
                <Link to="/pilates-physics-101" className="btn">
                  Register Now
                  <ArrowSvg />
                </Link>
                <div className="hero__meta mono">
                  <div><span className="hero__meta-k">What</span> Pilates Physics 101 Workshop</div>
                  <div><span className="hero__meta-k">When</span> Wed May 20 11am PDT</div>
                  <div><span className="hero__meta-k">Where</span> Live, online · recording included</div>
                </div>
              </div>
            </div>

            <div className="hero__visual">
              <figure className="spring-chart">
                <figcaption className="spring-chart__cap">
                  <span className="spring-chart__cap-id">FIG. 01</span>
                  <span>Spring force vs extension</span>
                </figcaption>
                <div className="spring-chart__body">
                  <InteractiveSpringDiagram />
                </div>
                <div className="spring-chart__hint">
                  <span className="spring-chart__hint-dot" aria-hidden="true"></span>
                  Drag the spring to feel how resistance scales across the range of motion.
                </div>
              </figure>
            </div>
          </div>
        </div>

        <span className="cross bl"></span>
        <span className="cross br"></span>
      </section>

      {/* ── § 01 Premise — "Memorizing isn't understanding" ─────────────── */}
      <section className="section-pad understanding section--inset">
        <div className="container">
          <div className="understanding__grid">
            <div className="understanding__left">
              <div className="eyebrow">§ 01 · Premise</div>
              <h2 className="understanding__head">
                Memorizing settings isn't the same as <span className="italic accent">understanding them.</span>
              </h2>
            </div>
            <div className="understanding__right">
              <p>
                Most Pilates training gives you a table: this exercise, this spring setting,
                this position. The table works — until you're in front of a client whose
                proportions, strength, or history don't match the model the table was built
                around. Then you guess. You adjust by feel. You wonder, quietly, whether you
                actually understand what you're doing.
              </p>
              <p>
                That gap — between knowing <em>what</em> to do and knowing <em>why</em> it works —
                is exactly where this workshop lives. It won't replace your training. It
                will make everything in your training make sense.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── § 02 Framework — Intention / Loading / Feedback ─────────────── */}
      <section className="section-pad-l framework section--inset">
        <div className="container">
          <div className="framework__head">
            <div>
              <div className="kicker">§ 02 · A three-part lens</div>
              <h2 className="framework__title">
                <span>Three</span><br />
                <span className="italic accent">components.</span>
              </h2>
              <p className="framework__lede">
                Most teaching focuses on <strong>intention</strong> and <strong>feedback</strong>.
                <span className="italic accent"> Loading is the missing one.</span> Pilates Physics
                focuses there so you can ensure your intent is landing and know how to adjust if not.
              </p>
            </div>
          </div>

          <div className="framework__cards">
            {FRAMEWORK_DATA.map((c) => (
              <article className="fcard" key={c.n}>
                <div className="fcard__head">
                  <span className="fcard__n mono">{c.n}</span>
                  <span className="fcard__dot mono">·</span>
                  <span className="fcard__label mono accent">{c.label}</span>
                </div>
                <h3 className="fcard__q">{c.q}</h3>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── § 03 Meet Kaleen ─────────────────────────────────────────────── */}
      <section className="section-pad meet section--inset">
        <div className="container">
          <div className="meet__grid">
            <div className="meet__photo">
              <div className="meet__photo-tag mono">
                <span className="meet__photo-tag-id">FIG. 02</span>
                <span>BIO</span>
              </div>
              <img src="/images/homepage/kaleen-shop.jpg" alt="Kaleen Canevari" />
            </div>

            <div className="meet__copy">
              <div className="eyebrow">§ 03 · Instructor</div>
              <h2 className="meet__head">
                Meet <span className="italic accent">Kaleen.</span>
              </h2>
              <div className="meet__role mono">Mechanical Engineer · Pilates Instructor</div>

              <p>
                Kaleen came to Pilates through engineering, not the other way around. She has
                been designing and teaching on Pilates equipment since 2013, across multiple
                companies and studios.
              </p>
              <p>
                Pilates Physics closes the gap between how this equipment was designed
                and how most of us were taught to use it.
              </p>

              <Link to="/about" className="arrow-link">Read full bio →</Link>
            </div>
          </div>

          <div className="meet__testimonials">
            <div className="meet__t-head mono">
              <span className="kicker">What instructors are saying</span>
              <span className="meet__t-rule"></span>
            </div>
            <div className="meet__t-grid">
              {TESTIMONIALS.map((t) => (
                <div className="quote-card" key={t.handle}>
                  <div className="handle"><span className="at" aria-hidden="true">@</span>{t.handle}</div>
                  <p>"{t.quote}"</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── § 04 Register / CTA ─────────────────────────────────────────── */}
      <section className="section-pad cta section--inset" id="register">
        <div className="container container--narrow">
          <div className="cta__inner">
            <div className="kicker">§ 04 · Register</div>
            <h2 className="cta__head">
              Live. Interactive. Built for <span className="italic accent">working instructors.</span>
            </h2>
            <p className="cta__lede">
              Whether you've been teaching for a year or ten, these workshops give you a
              framework for integrating how Pilates equipment applies load into your teaching.
            </p>

            <Link to="/education" className="btn cta__btn">
              See Upcoming Workshops
              <ArrowSvg />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
