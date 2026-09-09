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
//
// Section order follows the StoryBrand beats rather than the product's own
// shape: problem, stakes, value, answer, guide, plan, objections, close.
//
// Three sections a reader might expect are deliberately absent. The designer's
// tradeoff cards and a standalone certificate section were cut, so the Flexia
// credibility lives in the bio and the certificate is one card in "what you
// get" plus an FAQ answer, which is the only place the no-CEC fact is stated.
// The "who this is for" section was cut too. Its empathy beat now rides in
// the last two sentences of § 02, which honour the training rather than
// implying it failed, and the first FAQ answer backs it up.
//
// Every section uses the same wide .container so the page keeps one left rail.
// .container--narrow is 980px against 1320px and both are centred, so mixing
// them indents some sections by ~170px and the alignment visibly breaks.

const MODULES = [
  { n: '01', title: 'Introduction' },
  { n: '02', title: 'Reformer anatomy' },
  { n: '03', title: 'Springs' },
  { n: '04', title: 'Reformer adjustments' },
  { n: '05', title: 'Pulleys' },
  { n: '06', title: 'Friction' },
  { n: '07', title: 'Classical vs contemporary' },
  { n: '08', title: 'How we consider the body' },
]

// The value beat. Adaptation, deliberately not progression: the survey data
// behind customer-language.md produced adaptation language and none about
// progressing a client, so the page promises the one that is grounded.
const VALUE = [
  {
    label: 'OPTIONS',
    title: 'More dials than the spring',
    body: 'The spring is the loudest adjustment on the machine. It is rarely the only one that would work, and often not the one that fits. The gear, the footbar and the ropes each change the load on their own, and any of them is available to you.',
  },
  {
    label: 'INTERACTIONS',
    title: 'Nothing moves alone',
    body: 'Adjustments do not act alone. Raise the footbar and you have changed more than the footbar. Predicting where a setup actually lands means knowing what travels with what, and that is the part almost nobody was taught.',
  },
  {
    label: 'LANGUAGE',
    title: 'An answer better than "it depends"',
    body: 'Say what a change is going to do and why you chose it, in words a client understands. That is the difference between adjusting a machine and teaching someone.',
  },
]

const INCLUDED = [
  {
    n: '01',
    label: 'VIDEO',
    title: 'Eight modules, 1 hour',
    body: 'Watch in one sitting or in pieces. It picks up where you left off, and every module stays open, so you can go straight back to the one you need.',
  },
  {
    n: '02',
    label: 'ASSESSMENT',
    title: 'A six question quiz',
    body: 'Scored, with an explanation on every answer, right or wrong. Retake it as many times as you need.',
  },
  {
    n: '03',
    label: 'CERTIFICATE',
    title: 'A certificate of completion',
    body: 'Generated the moment you pass, with your name and the date on it, ready to download whenever you need it again.',
  },
  {
    n: '04',
    label: 'ACCESS',
    title: 'Yours to keep',
    body: 'No expiry and no subscription. Updates and new resources appear in your portal at no extra cost.',
  },
]

// The plan, and the only transitional CTA on the page now that the hero has
// none. Rungs 1 and 3 are links on purpose: the free one has to be reachable
// or the page offers a visitor exactly one option, $69 or leave.
const LADDER = [
  {
    n: '01',
    title: 'Spring calculator',
    body: 'Spring weight at any stretch. Free.',
    to: '/spring-calculator',
  },
  {
    n: '02',
    title: 'How a Reformer Works',
    body: 'The whole machine. Everything that changes load before a body touches it.',
    current: true,
  },
  {
    n: '03',
    title: 'Pilates Physics 101',
    body: 'What happens when a body meets that load, and practical teaching tips for real classes.',
    to: '/pilates-physics-101',
  },
]

const SPECS = [
  { k: 'Format', v: 'On demand' },
  { k: 'Modules', v: '8' },
  { k: 'Duration', v: '1 hour' },
  { k: 'Assessment', v: '6 question quiz' },
  { k: 'Certificate', v: 'On passing' },
  { k: 'Access', v: 'No expiry' },
]

const FAQ = [
  {
    q: 'I have taught on reformers for years. Is there anything here for me?',
    a: 'Almost certainly. Most of us can set a machine correctly and still not be able to say what the gear change did to the load. Knowing your machine by feel is real, and it is a different thing from being able to predict it, or explain it to a client who asks.',
  },
  {
    q: 'Do I need Pilates Physics 101 first?',
    a: 'No, and this is the better place to start. This course is about the machine on its own: everything that changes load before a body gets on it. Pilates Physics 101 is what happens when a body meets that load, and how to change your teaching to accommodate that. Each one makes the next easier.',
  },
  {
    q: 'Is this about one brand of reformer?',
    a: 'No. The physics is the same on every reformer, and the course is written to be fair across brands. I use examples from several machines, and the concepts are meant to be absorbed and applied by you, together with your teaching intention.',
  },
  {
    q: 'I am not a math person. Is that a problem?',
    a: 'Not at all. There is no math you have to do. I use math to explain concepts, but it always comes back to terms you can see and feel on the equipment.',
  },
  {
    q: 'Does this carry NPCP continuing education credit?',
    a: 'Not yet. Currently you get a certificate of completion with your name and the date you passed.',
  },
  {
    q: 'What if I do not pass the quiz?',
    a: 'You can take it as many times as you need to pass. There is no limit and no penalty, and every question comes back with an explanation, so a failed attempt is genuinely useful. Passing is what issues the certificate.',
  },
  {
    q: 'How long do I have access?',
    a: 'Indefinitely. It is a one-time purchase, it lives in your portal, and there is no subscription.',
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
      <section
        className="workshop-hero section-frame"
        style={{ '--workshop-hero-image': "url('/images/homepage/hero-image-5.jpg')" }}
      >
        <span className="cross tl"></span>
        <span className="cross tr"></span>

        <div className="container">
          <div className="workshop-hero__inner">
            <div className="kicker">§ 01 · How a Reformer Works</div>
            <h1 className="workshop-hero__title">
              You own more machine than <span className="italic accent">you are using.</span>
            </h1>
            {/* The subtitle rides inside the lede rather than as its own line.
                The spec's naming rules say the title and subtitle travel
                together, because the title alone is ambiguous between a
                documentary and build instructions. They do not say where, and
                no other hero on the site carries a subtitle element. */}
            <p className="workshop-hero__lede">
              An on-demand course on the mechanisms that make your reformer
              magical. Taught by an engineer and Pilates instructor who designed
              one.
            </p>

            <div className="workshop-hero__cta">
              <a href="#buy" className="btn btn--lg">
                Get instant access
                <ArrowSvg />
              </a>
            </div>
            <p className="workshop-hero__meta">
              <span className="workshop-hero__meta-k">On demand</span>
              8 modules · 1 hour
            </p>
          </div>
        </div>

        <span className="cross bl"></span>
        <span className="cross br"></span>
      </section>

      {/* ── § 02 The cost of not knowing ─────────────────────────────────── */}
      {/* The stakes beat. "Nearly everything" rather than "everything" is
          deliberate: module 1 teaches which parts change load and which do
          not, so the headrest and shoulder rests would make the stronger
          claim false. */}
      <section className="section-pad section--inset workshop-why">
        <div className="container">
          <div className="kicker">§ 02 · The cost of not knowing</div>
          <h2 className="workshop-why__head">
            You adjust the gear bar and two other things{' '}
            <span className="italic accent">quietly move.</span>
          </h2>
          <p className="workshop-why__body">
            Move the gear bar and the load changes. Move the footbar and it
            changes again. Both times you are on the same spring. Nearly
            everything you adjust on a reformer changes the spring stretch, and
            the stretch is what sets the load, whether or not you meant to
            change it. Most of us were taught the settings without being taught
            the machine. Your training was never going to get to what each
            adjustment trades away, not in the time it had.
          </p>
        </div>
      </section>

      {/* ── § 03 What you can do with it ─────────────────────────────────── */}
      <section className="section-pad section--inset workshop-framework">
        <div className="container">
          <div className="workshop-framework__head-wrap">
            <div className="kicker">§ 03 · What you can do with it</div>
            <h2 className="workshop-framework__head">
              The best instructors always have{' '}
              <span className="italic accent">another option to offer.</span>
            </h2>
            <p className="workshop-framework__lede">
              When your teaching intent is not landing, what do you reach for?
              Knowing your options is half of it. The other half is knowing how
              they interact, because one change on a reformer moves others with
              it. That is what lets you make the adjustment on purpose and say
              why.
            </p>
          </div>

          <div className="course-decisions course-decisions--three">
            {VALUE.map((v) => (
              <article className="fcard" key={v.label}>
                <div className="fcard__label mono accent">{v.label}</div>
                <h3 className="fcard__title">{v.title}</h3>
                <p className="fcard__body">{v.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── § 04 The syllabus ────────────────────────────────────────────── */}
      {/* Titles match migration 045. Runtimes are no longer shown here, so the
          "1 hour" claimed in the hero and the spec list is now asserted rather
          than shown: the modules total 56 minutes plus roughly 5 for the quiz.
          If the curriculum changes length, that number has to be revisited by
          hand, and duration_min on the webinars row with it. */}
      <section className="section-pad section--inset workshop-topics">
        <div className="container">
          <div className="workshop-topics__head">
            <div className="kicker">§ 04 · What is inside</div>
            <h2 className="workshop-topics__title">
              The whole machine, <span className="italic accent">not just the springs.</span>
            </h2>
            <p className="workshop-topics__lede">
              Eight modules, 1 hour, brand agnostic.
            </p>
          </div>
          <div className="course-modules">
            {MODULES.map((m) => (
              <article className="course-module" key={m.n}>
                <div className="course-module__n mono accent">{m.n}</div>
                <div className="course-module__body">
                  <h3 className="course-module__title">{m.title}</h3>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── § 05 Bio ─────────────────────────────────────────────────────── */}
      {/* All of the page's authority, since the designer's tradeoff section was
          cut. The headline carries the claim rather than the name, because a
          skimmer reading only headlines would otherwise never meet it. */}
      <section className="section-pad section--inset workshop-instructor">
        <div className="container">
          <div className="workshop-instructor__grid">
            {/* Same photo treatment as the PP101 instructor section. The shop
                shot rather than the studio portrait, because the headline is
                about time spent with the machine in pieces. */}
            <div className="meet__photo">
              <div className="meet__photo-tag">
                <span className="meet__photo-tag-id">FIG. 01</span>
                <span>INSTRUCTOR</span>
              </div>
              <img
                src="/images/homepage/kaleen-shop.jpg"
                alt="Kaleen Canevari"
                loading="lazy"
              />
            </div>

            <div className="workshop-instructor__body">
              <div className="kicker">§ 05 · Who is teaching</div>
              <h2 className="workshop-instructor__head">
                I have spent as much time with a reformer apart{' '}
                <span className="italic accent">as assembled.</span>
              </h2>
              <p>
                Engineer, Pilates instructor, and the designer of the
                world&rsquo;s first smart Pilates machine. Sourcing springs,
                specifying bearings, and deciding where an adjustment should
                start and stop are all things I have had to get right with real
                parts, on a machine thousands of people would use. I built
                Pilates Physics because the explanations I wanted did not exist.
                In this course I teach the way reformers work, so you do not
                have to stumble through the endless experiments and guesswork to
                figure it out yourself.
              </p>
              <p>
                <Link to="/about" className="course-inline-link">
                  More about me and the work
                  <ArrowSvg />
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── § 06 What you get ────────────────────────────────────────────── */}
      <section className="section-pad section--inset workshop-included">
        <div className="container">
          <div className="kicker">§ 06 · What you get</div>
          <h2 className="workshop-included__head">
            One payment, and <span className="italic accent">nothing expires.</span>
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

      {/* ── § 07 Where this sits ─────────────────────────────────────────── */}
      <section className="section-pad section--inset workshop-why">
        <div className="container">
          <div className="kicker">§ 07 · Where this sits</div>
          <h2 className="workshop-why__head">
            Each step is wider than <span className="italic accent">the one below it.</span>
          </h2>

          <div className="course-ladder">
            {LADDER.map((step) => {
              const inner = (
                <>
                  <span className="mono accent">{step.n}</span>
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                </>
              )
              return step.current ? (
                <div
                  className="course-ladder__step course-ladder__step--current"
                  key={step.n}
                >
                  {inner}
                </div>
              ) : (
                <Link
                  to={step.to}
                  className="course-ladder__step course-ladder__step--link"
                  key={step.n}
                >
                  {inner}
                </Link>
              )
            })}
          </div>

          {/* The page's only transitional CTA. The hero's was removed, so if
              this one goes the page offers nothing to a visitor who is not
              ready to spend $69. */}
          <p className="course-ladder__cta">
            Not ready to buy? The spring calculator is free, and it answers the
            first question this course picks up.{' '}
            <Link to="/spring-calculator" className="course-inline-link">
              Open the calculator
              <ArrowSvg />
            </Link>
          </p>
        </div>
      </section>

      {/* ── § 08 FAQ ─────────────────────────────────────────────────────── */}
      <section className="section-pad section--inset workshop-faq">
        <div className="container">
          <div className="kicker">§ 08 · Questions</div>
          <h2 className="workshop-faq__head">Frequently asked questions</h2>
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
      <section className="section-pad section--inset workshop-details">
        <div className="container">
          <div className="kicker">§ 09 · Get the course</div>
          <h2 className="workshop-included__head">
            Walk into your next class with{' '}
            <span className="italic accent">more than one lever.</span>
          </h2>

          {/* Same shape as the PP101 § 06 details block: spec list beside the
              card, card in a bordered panel. The anchor lives on the panel
              rather than the section, because workshop-details__register
              carries the scroll-margin that keeps it clear of the nav. */}
          <div className="workshop-details__grid">
            <dl className="spec-list">
              {SPECS.map((sp) => (
                <div className="spec-list__row" key={sp.k}>
                  <dt className="spec-list__k">{sp.k}</dt>
                  <dd className="spec-list__v">{sp.v}</dd>
                </div>
              ))}
            </dl>

            <div id="buy" className="workshop-details__register">
              {pricing}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
