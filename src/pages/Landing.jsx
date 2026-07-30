import { Link } from 'react-router-dom'
import InteractiveSpringDiagram from '../components/ui/InteractiveSpringDiagram'
import ArrowSvg from '../components/ui/ArrowSvg'
import { useNextWorkshop } from '../hooks/useWorkshops'
import { workshopUrl, formatWorkshopWhen } from '../lib/workshop'
import '../styles/ppv2.css'
import './Landing.css'

const SPRINGS_URL = '/spring-calculator'
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

// ─── § 03 What shifts — value stack (Change beat) ────────────────────────────
const SHIFTS = [
  {
    h: 'Understand the load.',
    p: 'Know why some clients are straining and others are coasting on the same spring settings.',
  },
  {
    h: 'Adjust more than the spring.',
    p: 'Equipment adjustments change the spring load whether you want them to or not. Know the levers so you can adapt.',
  },
  {
    h: 'Explain the why to your clients.',
    p: 'Help your clients understand what their body is feeling and why, so they trust the class was built for them.',
  },
  {
    h: 'Run your classes with confidence.',
    p: 'Give every body its own version of the same exercise, in the same class, without getting long winded.',
  },
]

// ─── § 04 Framework cards — INTENTION / LOADING / FEEDBACK ────────────────────
const FRAMEWORK_DATA = [
  { n: '01', label: 'INTENTION', q: 'Why are you teaching this exercise?' },
  { n: '02', label: 'LOADING', q: 'What forces is the client actually experiencing?' },
  { n: '03', label: 'FEEDBACK', q: 'What verbal + visual signals are you getting back?' },
]

// ─── § 06 The plan — three steps to start ────────────────────────────────────
const PLAN = [
  {
    n: '01',
    h: 'Grab the spring calculator, free.',
    p: 'See what any spring actually weighs through the whole stroke. Start here.',
  },
  {
    n: '02',
    h: 'Register for the Pilates Physics workshop.',
    p: 'One live session, plus the recording. Reformer (101) or Chair and Cadillac (102).',
  },
  {
    n: '03',
    h: 'Teach the body in front of you.',
    p: 'Walk in with the cues, options, and settings to personalize any class.',
  },
]

const TESTIMONIALS = [
  {
    handle: 'playpilatescompany',
    quote: 'Really glad I found your account! Another thing totally absent from my teacher training...',
  },
  {
    handle: 'eduardogperez68',
    quote:
      '@kaleenc_ you are a natural teacher. This is what needs to be added to instructor education. Truly understanding the the science to make better teaching decisions.',
  },
  {
    handle: 'cttcpilatesandmovement',
    quote: 'Love your videos. Its great to have this explained in a clear and easy to undderstand way!',
  },
  {
    handle: 'debnus4',
    quote: 'This is amazing information. Thank you. Stuff I was never taught and didn\'t know I needed.',
  },
  {
    handle: 'bodylinela',
    quote:
      'I love your account, but honestly, I didn\'t think there was another person in the world as interested in all of this stuff as I am. Actually, you are way more interested than me. I\'m glad you\'re spending time sorting all this stuff out so I don\'t have to.!!!',
  },
  {
    handle: 'lisahovav',
    quote: 'Excellent content and good to know the science behind the apparatus! Happy to have found you 🙌',
  },
  {
    handle: 'pilatesly',
    quote: 'interesting! you explain it so well',
  },
  {
    handle: 'elematz_pilates',
    quote: 'Love the blend of science and Pilates! So inspiring to see the magic behind our movements explained.',
  },
]

// ─── Landing page ─────────────────────────────────────────────────────────────
export default function Landing() {
  const { workshop: nextWorkshop } = useNextWorkshop()
  const heroWhat = nextWorkshop ? `${nextWorkshop.title} Workshop` : ' '
  const heroWhen = nextWorkshop ? formatWorkshopWhen(nextWorkshop.scheduled_at) : ' '

  // ── Auto-rotating CTA rule ────────────────────────────────────────────────
  // Within 30 days of the next workshop, registration leads and the spring
  // calculator is the transitional catch. More than 30 days out (or nothing
  // scheduled), the calculator leads and registration steps back. The nav button
  // stays constant on the calculator. Uses useNextWorkshop + scheduled_at.
  const msUntilNext = nextWorkshop?.scheduled_at
    ? new Date(nextWorkshop.scheduled_at).getTime() - Date.now()
    : Infinity
  const registrationLeads = msUntilNext <= THIRTY_DAYS_MS

  const registerCta = {
    to: workshopUrl(nextWorkshop?.slug),
    label: nextWorkshop ? 'Register Now' : 'See Upcoming Workshops',
  }
  const springsCta = { to: SPRINGS_URL, label: 'Free Spring Calculator' }
  const primaryCta = registrationLeads ? registerCta : springsCta
  const secondaryCta = registrationLeads ? springsCta : registerCta

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
                The same spring setting isn't the same{' '}
                <span className="italic accent">workout.</span>
              </h1>

              <p className="hero__lede">
                Every body meets the spring differently. See why, get the cues to
                adjust for it, and build every class around the body in front of
                you. No math background required.
              </p>

              <div className="hero__cta">
                <div className="hero__buttons">
                  <Link to={primaryCta.to} className="btn">
                    {primaryCta.label}
                    <ArrowSvg />
                  </Link>
                  <Link to={secondaryCta.to} className="btn btn--ghost">
                    {secondaryCta.label}
                  </Link>
                </div>
                <div className="hero__meta mono">
                  <div><span className="hero__meta-k">What</span> {heroWhat}</div>
                  <div><span className="hero__meta-k">When</span> {heroWhen}</div>
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

      {/* ── § 01 Stakes — the cost of one script for the room ────────────── */}
      <section className="section-pad stakes section--inset">
        <div className="container">
          <div className="eyebrow">§ 01 · The problem</div>
          <h2 className="stakes__head">
            Teach the same settings for the whole class and{' '}
            <span className="italic accent">someone is always working the wrong load.</span>
          </h2>
          <div className="stakes__body">
            <div className="stakes__cols">
              <p>
                Single, memorized spring settings work for only a portion of your
                students, leaving the rest wondering why they aren't feeling what
                you say they should.
              </p>
              <p>
                When a cue doesn't land, it's tempting to guess, or to reach for
                "if you were doing it right, you'd feel it." We've all leaned on
                it. But that puts the gap on the student, when the honest answer
                is understanding what their body is actually feeling, and why.
              </p>
            </div>
            <p className="stakes__philo">
              Your students deserve a teacher who can give them a personalized,
              effective workout, not regurgitate a teacher training manual.
            </p>
          </div>
        </div>
      </section>

      {/* ── § 02 Premise — "Memorizing isn't understanding" ─────────────── */}
      <section className="section-pad understanding section--inset">
        <div className="container">
          <div className="understanding__grid">
            <div className="understanding__left">
              <div className="eyebrow">§ 02 · Premise</div>
              <h2 className="understanding__head">
                Memorizing settings isn't the same as <span className="italic accent">understanding them.</span>
              </h2>
            </div>
            <div className="understanding__right">
              <p>
                Most Pilates training gives you a table: this exercise, this spring,
                this position. The table works right up until you're in front of a
                client whose proportions, strength, or history don't match the model
                it was built around. Then you guess.
              </p>
              <p>
                Memorizing the settings and the script is exactly where you start.
                It is the right foundation, not a gap. Personalizing them is the next
                stage, and it's where this workshop lives. It won't replace your
                training. It will let you build on it for the humans in front of you.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── § 03 What shifts — value stack ───────────────────────────────── */}
      <section className="section-pad shifts section--inset">
        <div className="container">
          <div className="shifts__head">
            <div className="eyebrow">§ 03 · What shifts</div>
            <h2 className="shifts__title">
              Stop trying to fit everyone in the same box.{' '}
              <span className="italic accent">Start offering options that meet them where they're at.</span>
            </h2>
          </div>
          <div className="shifts__grid">
            {SHIFTS.map((s) => (
              <article className="fcard" key={s.h}>
                <h3 className="fcard__title">{s.h}</h3>
                <p className="fcard__body">{s.p}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── § 04 Framework — Intention / Loading / Feedback ─────────────── */}
      <section className="section-pad-l framework section--inset">
        <div className="container">
          <div className="framework__head">
            <div>
              <div className="kicker">§ 04 · A three-part lens</div>
              <h2 className="framework__title">
                The missing piece isn't your choreography.{' '}
                <span className="italic accent">It's the load.</span>
              </h2>
              <p className="framework__lede">
                Most teaching covers <strong>intention</strong> and <strong>feedback</strong> well.
                Loading is the one that gets skipped. Pilates Physics focuses there, so you can tell
                whether your intent is landing, and know how to adjust when it isn't.
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

      {/* ── § 05 Meet Kaleen ─────────────────────────────────────────────── */}
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
              <div className="eyebrow">§ 05 · Instructor</div>
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
                A few years into teaching, Kaleen realized her settings didn't work for half her clients. Around the
                same time she started trying to quantify what actually happens on the equipment.
                The two turned out to be the same problem: the physics explains exactly why one
                setting fails half the room, and how to adapt for the rest.
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

      {/* ── § 06 The plan — three steps ──────────────────────────────────── */}
      <section className="section-pad plan section--inset">
        <div className="container">
          <div className="plan__head">
            <div className="eyebrow">§ 06 · How to start</div>
            <h2 className="plan__title">
              Three steps to teach with <span className="italic accent">intention.</span>
            </h2>
          </div>
          <div className="plan__steps">
            {PLAN.map((step) => (
              <article className="pstep" key={step.n}>
                <span className="pstep__n mono accent">{step.n}</span>
                <h3 className="pstep__h">{step.h}</h3>
                <p className="pstep__p">{step.p}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── § 07 Register / CTA ─────────────────────────────────────────── */}
      <section className="section-pad cta section--inset" id="register">
        <div className="container container--narrow">
          <div className="cta__inner">
            <div className="kicker">§ 07 · Register</div>
            <h2 className="cta__head">
              Live. Interactive. Built for <span className="italic accent">working instructors.</span>
            </h2>
            <p className="cta__lede">
              Whether you've taught for a year or ten, you'll walk out able to build every
              class around the body in front of you, not the model in your training manual,
              and tell each client why their body feels what it feels.
            </p>

            <div className="cta__actions">
              <Link to={primaryCta.to} className="btn btn--lg cta__btn">
                {primaryCta.label}
                <ArrowSvg />
              </Link>
              <Link to={secondaryCta.to} className="btn btn--ghost btn--lg">
                {secondaryCta.label}
              </Link>
            </div>

            <div className="cta__lockup mono">Powered by physics.</div>
          </div>
        </div>
      </section>
    </div>
  )
}
