import { Link } from 'react-router-dom'
import ArrowSvg from '../components/ui/ArrowSvg'
import { PRICE_FULL, PRICE_INSTALLMENT, PRICE_INSTALLMENT_TOTAL, APPLY_PATH, APPLY_DEADLINE } from '../lib/mentorship'
import '../styles/ppv2.css'
import './Workshop.css'
import '../components/ui/RegisterCard.css'
import './Mentorship.css'

// Source of truth for the program: docs/mentorship-program-spec.md. Change
// the numbers there first, then in src/lib/mentorship.js and here.

const COVER = [
  {
    n: '01',
    label: 'TEACHING',
    title: 'Say less, teach more',
    body: 'Cues, flow, presence, programming, and feedback that make a class feel personal, whether it is a 1:1 or a mixed-level room.',
  },
  {
    n: '02',
    label: 'STRENGTH',
    title: 'Pilates that builds strength',
    body: 'The principles of strength training and how to apply them in a Pilates class, so clients who want to get stronger get the most out of every session.',
  },
  {
    n: '03',
    label: 'PHYSICS',
    title: 'Why the same setting is a different workout',
    body: 'How the equipment delivers load, and how the body in front of you changes how hard an exercise really is.',
  },
]

const SCHEDULE = [
  { week: 'Week 1', date: 'Oct 21', title: 'Welcome and a movement session' },
  { week: 'Week 2', date: 'Oct 28', title: 'Say less, teach more, and your first recording reviewed' },
  { week: 'Week 3', date: 'Nov 4', title: 'How the equipment delivers load' },
  { week: 'Week 4', date: 'Nov 11', title: 'How the body changes the load' },
  { week: 'Week 5', date: 'Nov 18', title: 'Pilates that builds strength' },
  { week: 'Off', date: 'Nov 25', title: 'No session, Thanksgiving week', off: true },
  { week: 'Week 6', date: 'Dec 2', title: 'Movement session, then we talk about it' },
  { week: 'Week 7', date: 'Dec 9', title: 'Office hours' },
  { week: 'Week 8', date: 'Dec 16', title: 'Your progress, measured' },
]

const SPECS = [
  { k: 'Deadline', v: `Applications close ${APPLY_DEADLINE}` },
  { k: 'Dates', v: 'October 21 to December 16, 2026' },
  { k: 'Time', v: 'Wednesdays, 9:00 to 10:30am Pacific (GMT-7 in October, GMT-8 from November 4)' },
  { k: 'Hours', v: '14 contact hours' },
  { k: 'Format', v: 'Virtual, small group' },
  { k: 'Price', v: `${PRICE_FULL} one-time, or 2 payments of ${PRICE_INSTALLMENT}` },
]

const INCLUDED = [
  {
    n: '01',
    label: 'GROUP SESSIONS',
    title: 'Eight live sessions',
    body: '90 minutes every Wednesday on Zoom with the cohort. Every session is recorded and posted in your portal the same day.',
  },
  {
    n: '02',
    label: 'PRIVATE SESSIONS',
    title: 'Two private sessions',
    body: '60 minutes each, one-on-one via Zoom with me, scheduled around your week. Your clients, your equipment, your questions.',
  },
  {
    n: '03',
    label: 'TEACHING REVIEW',
    title: 'Your teaching, reviewed',
    body: 'Free access to Remo for the program. Record the sessions you teach, share them with me, and get feedback on the real thing.',
  },
  {
    n: '04',
    label: 'SMALL GROUP',
    title: 'A cohort you can hear',
    body: 'Few enough people that everyone gets personal feedback and the discussion is about the clients you actually have.',
  },
]

const FAQ = [
  {
    q: 'Do I need to have taken Pilates Physics 101 first?',
    a: `No. Weeks 3 and 4 cover the physics from the start, in plain language, on the reformer. If you have already taken 101, those weeks are a great chance to review the theory and ask questions about how you're applying the principles.`,
  },
  {
    q: 'I have been teaching more than five years. Can I still join?',
    a: 'The program is built for the first five years, when the work is turning the script into judgment. If you are past that and still want in, apply and tell me about your teaching. I will be honest about whether it is a fit.',
  },
  {
    q: 'What is Remo?',
    a: 'Remo is a notetaking app for Pilates instructors that I built. It records the audio of sessions you teach and turns it into a summary you can share. For this program you get free access, so you can record your teaching and send it to me for review. No strings.',
  },
  {
    q: 'What if I cannot make a Wednesday?',
    a: 'Every group session is recorded and posted to your portal. Live attendance is where the feedback happens, so plan to be there for most of them, but one missed week will not set you back.',
  },
  {
    q: 'How do the private sessions work?',
    a: 'Two 60-minute virtual sessions, one-on-one with me. You schedule them any time during the eight weeks. A good pattern is one early to set a goal and one late to review your progress.',
  },
  {
    q: 'How does the application work?',
    a: `Fill in the form on the application page. It asks about your teaching, your equipment, and what you want from the eight weeks. I read every application personally, in the order they arrive, and reply within a week. Applications close ${APPLY_DEADLINE}.`,
  },
  {
    q: 'How does payment work?',
    a: `Once you are accepted, I send you a Stripe invoice for the option you chose: ${PRICE_FULL} once, or two payments of ${PRICE_INSTALLMENT} (${PRICE_INSTALLMENT_TOTAL} in total). Your spot is confirmed once the first payment clears.`,
  },
  {
    q: 'How much time does it take each week?',
    a: 'The group session is 90 minutes. Between sessions you will record a class of your own and watch the feedback, so plan on two to three hours a week in total.',
  },
]

function ApplyCard() {
  return (
    <div className="register-card">
      <div className="register-card__price-row">
        <span className="register-card__price">{PRICE_FULL}</span>
        <span className="register-card__price-unit">one-time</span>
      </div>
      <p className="mentorship-reserve__plan">
        Or two payments of {PRICE_INSTALLMENT}.
      </p>
      <h3 className="register-card__title">Apply to join the cohort</h3>
      <p className="register-card__body">
        The group is small, so it is by application. Tell me about your
        teaching and what you want out of the eight weeks. I read every one,
        and you will hear back within a week. Payment invoice sent once your
        application is accepted.
      </p>
      <Link to={APPLY_PATH} className="btn btn--block">
        Apply now
        <ArrowSvg />
      </Link>
      <p className="register-card__meta">
        Applications close {APPLY_DEADLINE} and are read in the order they
        arrive. Spots are confirmed once the first payment clears.
      </p>
    </div>
  )
}

export default function Mentorship() {
  return (
    <div className="ppv2 grid-bg" data-section-style="alt">
      {/* ── § 01 Hero ────────────────────────────────────────────────────── */}
      <section
        className="workshop-hero section-frame"
        style={{ '--workshop-hero-image': "url('/images/homepage/hero-image-3.jpg')" }}
      >
        <span className="cross tl"></span>
        <span className="cross tr"></span>

        <div className="container">
          <div className="workshop-hero__inner">
            <div className="kicker">§ 01 · 8-week mentorship</div>
            <h1 className="workshop-hero__title">
              The skills that fill a class <span className="italic accent">are not fancy choreography.</span>
            </h1>
            <p className="workshop-hero__lede">
              Join a small-group mentorship for Pilates teachers in their first five
              years. Weekly group sessions, two private sessions with me, and
              feedback on the classes you actually teach.
            </p>

            <div className="workshop-hero__cta">
              <Link to={APPLY_PATH} className="btn btn--lg">
                Apply now. {PRICE_FULL}
                <ArrowSvg />
              </Link>
            </div>
            <p className="workshop-hero__meta">
              <span className="workshop-hero__meta-k">Live</span>
              October 21 to December 16, 2026 · applications close {APPLY_DEADLINE}
            </p>
          </div>
        </div>

        <span className="cross bl"></span>
        <span className="cross br"></span>
      </section>

      {/* ── § 02 Who this is for ─────────────────────────────────────────── */}
      <section className="section-pad section--inset workshop-why">
        <div className="container">
          <div className="kicker">§ 02 · Who this is for</div>
          <div className="mentorship-why__grid">
            <h2 className="workshop-why__head">
              Your training gave you the settings and the script. <span className="italic accent">Now you want the why.</span>
            </h2>
            <p className="workshop-why__body">
              Somewhere in the first few years, the script stops being enough. A
              client does not fit the standard setting. A mixed-level class needs
              three versions of the same exercise. You want to add strength work
              without losing what makes it Pilates. This mentorship is eight weeks
              of working through exactly that, in a small group, with me
              reviewing the classes you actually teach. The result is a class people
              come back to, week after week.
            </p>
          </div>
        </div>
      </section>

      {/* ── § 03 What we cover ───────────────────────────────────────────── */}
      <section className="section-pad section--inset workshop-framework">
        <div className="container">
          <div className="workshop-framework__head-wrap">
            <div className="kicker">§ 03 · What we cover</div>
            <h2 className="workshop-framework__head">
              The three skills <span className="italic accent">that fill a class.</span>
            </h2>
            <p className="workshop-framework__lede">
              Learn each one, then apply it in your own classes, with me by
              your side.
            </p>
          </div>

          <div className="workshop-framework__grid">
            {COVER.map((c) => (
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

      {/* ── § 04 Schedule ────────────────────────────────────────────────── */}
      <section className="section-pad-l section--inset workshop-topics">
        <div className="container">
          <div className="workshop-topics__head">
            <div className="kicker">§ 04 · Schedule</div>
            <h2 className="workshop-topics__title">
              Eight weeks that <span className="italic accent">build on each other.</span>
            </h2>
            <p className="workshop-topics__lede">
              Live on Zoom. All recordings posted in your portal the same day.
            </p>
          </div>

          <div className="mentorship-schedule">
            {SCHEDULE.map((s) => (
              <div
                className={`mentorship-schedule__row${s.off ? ' mentorship-schedule__row--off' : ''}`}
                key={s.date}
              >
                <span className="mentorship-schedule__week">{s.week}</span>
                <span className="mentorship-schedule__date">{s.date}</span>
                <h3 className="mentorship-schedule__title">{s.title}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── § 05 Details + Reserve ───────────────────────────────────────── */}
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

            <div id="apply" className="workshop-details__register">
              <ApplyCard />
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
                <span>MENTOR</span>
              </div>
              <img src="/images/about/kaleen-sitting.jpg" alt="Kaleen Canevari" loading="lazy" />
            </div>

            <div className="workshop-instructor__body">
              <div className="kicker">§ 06 · Your mentor</div>
              <h2 className="workshop-instructor__head">
                Hi! I'm <span className="italic accent">Kaleen.</span>
              </h2>
              <p className="workshop-instructor__role">Mechanical Engineer · Pilates Instructor since 2014</p>

              <p>
                I was a mechanical engineer before I was a Pilates instructor,
                and I've spent over a decade at the intersection of the two: as
                a design engineer at Balanced Body, running an equipment
                maintenance business, designing a reformer from the springs up,
                and building software for working instructors.
              </p>
              <p>
                I still teach every week. My mat class at the Y grew so full it
                needed an attendance cap, the first in its history.
              </p>
              <p>
                Pilates Physics is where I bring that engineering lens to
                instructor education. The mentorship is the closest version of
                it: a small group, your real classes, and the why behind every
                decision you make on the equipment.
              </p>

              <Link to="/about" className="arrow-link">More about me →</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── § 07 What's included ─────────────────────────────────────────── */}
      <section className="section-pad section--inset workshop-included">
        <div className="container">
          <div className="kicker">§ 07 · What's included</div>
          <h2 className="workshop-included__head">
            Every spot <span className="italic accent">includes.</span>
          </h2>

          <div className="workshop-included__grid workshop-included__grid--cols-2">
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
        <div className="container">
          <div className="kicker">§ 08 · Common questions</div>
          <h2 className="workshop-faq__head">
            Frequently <span className="italic accent">asked.</span>
          </h2>

          <div className="workshop-faq__list">
            {FAQ.map((item, i) => (
              <details className="workshop-faq__item" key={item.q}>
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
          <div className="kicker">§ 09 · Applications close {APPLY_DEADLINE}</div>
          <h2 className="workshop-cta__head mentorship-cta__head">
            Eight weeks. A small group. <span className="italic accent">Your teaching, reviewed closely.</span>
          </h2>
          <Link to={APPLY_PATH} className="btn btn--lg">
            Apply now. {PRICE_FULL}
            <ArrowSvg />
          </Link>
        </div>
      </section>
    </div>
  )
}
