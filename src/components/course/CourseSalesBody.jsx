import { Link } from 'react-router-dom'
import ArrowSvg from '../ui/ArrowSvg'
import './course-sales.css'

// The whole sales page except the price.
//
// Written once and shared: the public page renders it with PricingBlock, and
// the offer plan's $39 window renders the same body with a different block.
// Two copies of a page this long would drift within a month.
//
// Copy rules, from the spec: no em dashes, the title and subtitle travel
// together, "your machine" carries the possessive framing, and no mention of
// any discount ever appears here.

const MODULES = [
  {
    n: '00',
    title: 'Introduction',
    min: '3 min',
    body: 'The promise, and who is talking. What you own, and how much of it you are actually using.',
  },
  {
    n: '01',
    title: 'Reformer anatomy',
    min: '6 min',
    body: 'The vocabulary. Which parts change load and which do not, and why the machine is the size it is.',
  },
  {
    n: '02',
    title: 'Springs',
    min: '14 min',
    body: "The biggest module. Spring anatomy, Hooke's law, what makes a spring stiff, how springs age, how brands differ, and what to look for on your own.",
  },
  {
    n: '03',
    title: 'Reformer adjustments',
    min: '10 min',
    body: 'Every dial and what it does to spring stretch, with nobody on the machine. Including the second-order effects: change one thing, three others move.',
  },
  {
    n: '04',
    title: 'Pulleys',
    min: '7 min',
    body: 'Why "half" is only half true. How rope travel relates to carriage travel, and where the load actually peaks.',
  },
  {
    n: '05',
    title: 'Friction',
    min: '8 min',
    body: 'The myth-bust. Rolling against starting friction, the fact that friction reverses direction with the carriage, and the one case where you would genuinely notice it.',
  },
  {
    n: '06',
    title: 'Classical vs contemporary',
    min: '5 min',
    body: 'Same exercise, different load, neither one wrong. Physics takes no side, and this module does not either.',
  },
  {
    n: '07',
    title: 'How we consider the body',
    min: '3 min',
    body: 'The one thing the machine cannot tell you, and where Pilates Physics 101 picks up.',
  },
]

const DECISIONS = [
  {
    label: 'SIZE',
    title: 'Four constraints, one frame',
    body: 'Carriage width and length, a height low enough to stand on under an eight-foot ceiling, and a frame that ships in more than one box. Every one of those pulls against the others, and all four are visible in the finished machine.',
  },
  {
    label: 'SPRINGS',
    title: 'Stiffness and longevity are one decision',
    body: 'Sourcing springs means choosing stiffness, coating and fatigue life together. That includes the reason the color wears off the ones in your studio, which has a real engineering explanation behind it.',
  },
  {
    label: 'ADJUSTMENTS',
    title: 'Where to stop',
    body: 'Three gear positions instead of more. A footbar that does not pivot but still locks and still works as a kickstand. Every adjustment range is a decision about where to stop, and each one changes what you can do with the machine.',
  },
  {
    label: 'BEARINGS',
    title: 'Taking friction off the table',
    body: 'Bearings were specified to make friction negligible, and quiet, and low maintenance, all at once. Knowing how negligible meant having to decide how negligible to make it.',
  },
]

const INCLUDED = [
  {
    n: '01',
    label: 'VIDEO',
    title: 'Eight modules, about an hour',
    body: 'Watch in one sitting or in pieces. It picks up where you left off, and every module stays open, so you can go straight back to the one you need.',
  },
  {
    n: '02',
    label: 'ASSESSMENT',
    title: 'A ten question quiz',
    body: 'Scored, with an explanation on every answer. Retake it as many times as you need.',
  },
  {
    n: '03',
    label: 'CERTIFICATE',
    title: 'Your NPCP certificate',
    body: 'Generated the moment you pass, with your name on it, ready to download whenever you need it again.',
  },
  {
    n: '04',
    label: 'ACCESS',
    title: 'Yours to keep',
    body: 'No expiry and no subscription. New modules and resources appear in your portal at no extra cost.',
  },
]

const FAQ = [
  {
    q: 'Do I need Pilates Physics 101 first?',
    a: 'No, and this is the better place to start. This course is about the machine on its own: everything that changes load before a body gets on it. Pilates Physics 101 is what happens when a body meets that load. Each one makes the other easier, in either order.',
  },
  {
    q: 'Is this about one brand of reformer?',
    a: 'No. The physics is the same on every reformer, and the course is written to be fair across brands. Where machines genuinely differ, that difference is the teaching point rather than a sales pitch.',
  },
  {
    q: 'I am not a math person. Is that a problem?',
    a: 'Not at all. There is no math you have to do. Everything is explained in terms of what you can see and feel on the equipment, which is where it belongs.',
  },
  {
    q: 'How long do I have access?',
    a: 'Indefinitely. It is a one-time purchase, it lives in your portal, and there is no subscription.',
  },
  {
    q: 'What if I do not pass the quiz?',
    a: 'You take it again. There is no limit and no penalty, and every question comes back with an explanation, so a failed attempt is genuinely useful. Passing is what issues the certificate.',
  },
  {
    q: 'Is this a repair or maintenance course?',
    a: 'No. It is about how the machine works and why, so you can use more of it. You will finish knowing what to look for on your own springs and when to call your manufacturer, but it will not teach you to service equipment.',
  },
]

export default function CourseSalesBody({ pricing }) {
  return (
    <div className="ppv2 grid-bg" data-section-style="alt">
      {/* ── § 01 Hero ────────────────────────────────────────────────────── */}
      <section className="workshop-hero section-frame">
        <span className="cross tl"></span>
        <span className="cross tr"></span>

        <div className="container">
          <div className="workshop-hero__inner">
            <div className="kicker">§ 01 · The Making of a Reformer</div>
            <h1 className="workshop-hero__title">
              You own more machine than <span className="italic accent">you are using.</span>
            </h1>
            <p className="workshop-hero__lede">
              How your machine works and why. An on-demand course on everything
              that changes the load before a body ever gets on the carriage,
              from someone who had to design one.
            </p>

            <div className="workshop-hero__cta">
              <a href="#buy" className="btn btn--lg">
                Get instant access
                <ArrowSvg />
              </a>
            </div>
            <p className="workshop-hero__meta">
              <span className="workshop-hero__meta-k">On demand</span>
              8 modules · about an hour · 1 NPCP CEC
            </p>
          </div>
        </div>

        <span className="cross bl"></span>
        <span className="cross br"></span>
      </section>

      {/* ── § 02 Who it is for ───────────────────────────────────────────── */}
      <section className="section-pad section--inset workshop-why">
        <div className="container">
          <div className="kicker">§ 02 · Who this is for</div>
          <h2 className="workshop-why__head">
            You adjust the gear bar and three other things{' '}
            <span className="italic accent">quietly move.</span>
          </h2>
          <p className="workshop-why__body">
            Most of us were taught the settings without being taught the
            machine. You know which spring feels right, and you may not know
            why the same spring feels different at the other end of the
            carriage, or what the footbar height did to the load you just set.
            This is the course that closes that gap. It is for instructors who
            want to reason about their equipment instead of memorizing it.
          </p>

          <div className="course-ladder">
            <div className="course-ladder__step">
              <span className="mono accent">01</span>
              <h3>Spring calculator</h3>
              <p>One spring, one number. Free.</p>
            </div>
            <div className="course-ladder__step course-ladder__step--current">
              <span className="mono accent">02</span>
              <h3>The Making of a Reformer</h3>
              <p>The whole machine. Everything that changes load before a body touches it.</p>
            </div>
            <div className="course-ladder__step">
              <span className="mono accent">03</span>
              <h3>Pilates Physics 101</h3>
              <p>What happens when a body meets that load.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── § 03 The syllabus ────────────────────────────────────────────── */}
      <section className="section-pad section--inset workshop-topics">
        <div className="container">
          <div className="kicker">§ 03 · What is inside</div>
          <h2 className="workshop-topics__head">
            Eight modules. <span className="italic accent">About an hour.</span>
          </h2>
          <div className="course-modules">
            {MODULES.map((m) => (
              <article className="course-module" key={m.n}>
                <div className="course-module__n mono accent">{m.n}</div>
                <div className="course-module__body">
                  <h3 className="course-module__title">
                    {m.title}
                    <span className="course-module__min mono">{m.min}</span>
                  </h3>
                  <p>{m.body}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── § 04 The design story ────────────────────────────────────────── */}
      <section className="section-pad section--inset workshop-framework">
        <div className="container">
          <div className="workshop-framework__head-wrap">
            <div className="kicker">§ 04 · Why it is called that</div>
            <h2 className="workshop-framework__head">
              Every part of your reformer is a{' '}
              <span className="italic accent">decision somebody made.</span>
            </h2>
            <p className="workshop-framework__lede">
              I designed the Flexia Reformer. That means I had to make these
              decisions and live with them, and each module opens with one of
              them: here is the choice, here is what each option does to the
              load, here is what I picked and why. It is the same technical
              content either way. It is a great deal easier to remember with
              the reasoning attached.
            </p>
          </div>

          <div className="course-decisions">
            {DECISIONS.map((d) => (
              <article className="fcard" key={d.label}>
                <div className="fcard__label mono accent">{d.label}</div>
                <h3 className="fcard__title">{d.title}</h3>
                <p className="fcard__body">{d.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── § 05 What you get ────────────────────────────────────────────── */}
      <section className="section-pad section--inset workshop-included">
        <div className="container">
          <div className="kicker">§ 05 · What you get</div>
          <h2 className="workshop-included__head">
            Everything, the moment <span className="italic accent">you buy.</span>
          </h2>
          <div className="course-decisions">
            {INCLUDED.map((i) => (
              <article className="fcard" key={i.n}>
                <div className="fcard__label mono accent">{i.label}</div>
                <h3 className="fcard__title">{i.title}</h3>
                <p className="fcard__body">{i.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── § 06 The CEC ─────────────────────────────────────────────────── */}
      <section className="section-pad section--inset course-cec">
        <div className="container">
          <div className="kicker">§ 06 · Continuing education</div>
          <h2 className="workshop-why__head">
            One NPCP CEC, <span className="italic accent">earned not attended.</span>
          </h2>
          <p className="workshop-why__body">
            Work through the modules, pass the ten question quiz, and your
            certificate is generated with your name on it. Download it then or
            any time afterwards. It records the date you passed, the course,
            and its NPCP details, which is what your credentialing body asks
            for.
          </p>
        </div>
      </section>

      {/* ── § 07 Bio ─────────────────────────────────────────────────────── */}
      <section className="section-pad section--inset course-bio">
        <div className="container">
          <div className="kicker">§ 07 · Who is teaching</div>
          <h2 className="workshop-why__head">
            Kaleen <span className="italic accent">Canevari.</span>
          </h2>
          <p className="workshop-why__body">
            Engineer, Pilates instructor, and the designer of the Flexia
            Reformer. I have spent as much time with the equipment apart as I
            have with it assembled, and I built Pilates Physics because the
            explanations I wanted did not exist. I teach the machine the way I
            had to learn it: as a set of decisions, each one with a
            consequence you can feel.
          </p>
          <p className="workshop-why__body">
            <Link to="/about" className="course-inline-link">
              More about me and the work
              <ArrowSvg />
            </Link>
          </p>
        </div>
      </section>

      {/* ── § 08 FAQ ─────────────────────────────────────────────────────── */}
      <section className="section-pad section--inset workshop-faq">
        <div className="container">
          <div className="kicker">§ 08 · Questions</div>
          <h2 className="workshop-faq__head">
            Before you <span className="italic accent">buy.</span>
          </h2>
          <div className="course-faq">
            {FAQ.map((f) => (
              <details className="course-faq__item" key={f.q}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── § 09 Buy ─────────────────────────────────────────────────────── */}
      <section className="section-pad section--inset course-buy" id="buy">
        <div className="container">
          <div className="kicker">§ 09 · Get the course</div>
          <h2 className="workshop-included__head">
            Start in <span className="italic accent">about a minute.</span>
          </h2>
          <div className="course-buy__inner">{pricing}</div>
        </div>
      </section>
    </div>
  )
}
