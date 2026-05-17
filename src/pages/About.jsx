import { Link } from 'react-router-dom'
import ArrowSvg from '../components/ui/ArrowSvg'
import '../styles/ppv2.css'
import './About.css'

export default function About() {
  return (
    <div className="ppv2 grid-bg" data-section-style="alt">
      {/* ── § 01 Hero / Bio ──────────────────────────────────────────────── */}
      <section className="section-pad about-hero">
        <div className="container">
          <div className="about-hero__grid">
            <div className="meet__photo">
              <div className="meet__photo-tag">
                <span className="meet__photo-tag-id">FIG. 01</span>
                <span>BIO</span>
              </div>
              <img src="/images/about/kaleen-sitting.jpg" alt="Kaleen Canevari" />
            </div>

            <div className="about-hero__bio">
              <div className="eyebrow">§ 01 · Instructor</div>
              <h1 className="about-hero__head">
                Kaleen <span className="italic accent">Canevari.</span>
              </h1>
              <p className="about-hero__role">
                Pilates instructor · Mechanical engineer · Software founder
              </p>
              <p>
                I studied mechanical engineering before I ever stepped on a reformer. In 2013 I
                got a job as a design engineer at Balanced Body, and to learn more about what I
                was building, I started taking Pilates classes. When I began teaching in 2014, I
                kept noticing a gap between what I was trained to do and what my students actually
                needed. As I trained with more experts and got better at personalizing my teaching,
                I realized the best instructors inherently understood physics. They just couldn't
                always <em>explain</em> it.
              </p>
              <p>
                I've always looked at Pilates through a mechanical lens. Engineering equipment at
                Balanced Body, running a Pilates equipment maintenance business, founding a
                connected Pilates equipment company: I've seen this industry from the inside out.
                I love it. For a long time I felt like a bit of an outsider. But when I started
                sharing physics content publicly, something shifted. The community wanted more,
                and no one else was doing it.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── § 02 Why ─────────────────────────────────────────────────────── */}
      <section className="section-pad section--inset about-why">
        <div className="container">
          <div className="about-why__grid">
            <div className="about-why__body">
              <div className="kicker">§ 02 · Why Pilates Physics</div>
              <h2 className="about-why__head">
                Physics doesn't <span className="italic accent">take sides.</span>
              </h2>
              <p>
                Pilates instructors are more capable when they understand the mechanics behind
                what they're teaching. That's not a controversial idea — it's just an
                underleveraged one.
              </p>
              <p>
                A spring behaves the same way whether you trained classically or contemporary.
                Force vectors don't care about your certification or lineage. When you understand
                what's actually happening mechanically, you can work with any body, on any
                equipment, without needing a rule for every situation.
              </p>
            </div>

            <div className="meet__photo">
              <div className="meet__photo-tag">
                <span className="meet__photo-tag-id">FIG. 02</span>
                <span>WHY</span>
              </div>
              <img
                src="/images/about/kaleen-hug-chair.jpg"
                alt="Kaleen at the Pilates chair"
                className="about-why__photo"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── § 03 Tools (Remo) ────────────────────────────────────────────── */}
      <section className="section-pad section--inset about-tools">
        <div className="container">
          <div className="kicker">§ 03 · Software</div>
          <h2 className="about-tools__head">
            Tools I've built for <span className="italic accent">instructors.</span>
          </h2>
          <p className="about-tools__lede">
            Pilates Physics is the education side. These are the software products I've built
            to solve problems I ran into as a working instructor.
          </p>

          <div className="about-tools__card">
            <img src="/images/homepage/remo-mockup.png" alt="Remo app mockup" />
            <div>
              <div className="about-tools__card-head">
                <span>01</span>
                <span>·</span>
                <span>PRODUCT</span>
              </div>
              <h3 className="about-tools__card-title">Remo</h3>
              <p className="about-tools__card-tagline">
                AI Notetaker for private Pilates instructors
              </p>
              <p className="about-tools__card-body">
                Built for the way you actually teach. Capture audio of what you teach and get a
                session summary, exercise list, client feedback, progress maps, and more with the
                click of a button.
              </p>
              <a
                href="https://www.RemoPilates.com"
                target="_blank"
                rel="noopener noreferrer"
                className="arrow-link"
              >
                Visit Remo →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── § 04 Connect ─────────────────────────────────────────────────── */}
      <section className="section-pad section--inset about-connect">
        <div className="container">
          <div className="kicker">§ 04 · Connect</div>
          <h2 className="about-connect__head">
            Follow <span className="italic accent">along.</span>
          </h2>
          <p className="about-connect__lede">
            Read the blog on Pilates mechanics, or follow on Instagram for
            shorter-form content and behind-the-scenes.
          </p>

          <div className="about-connect__grid">
            <Link to="/blog" className="about-connect__card">
              <div>
                <p className="about-connect__card-kicker">Blog</p>
                <p className="about-connect__card-handle">Notes on the physics of Pilates</p>
              </div>
              <span className="about-connect__card-cta">Read the blog →</span>
            </Link>

            <a
              href="https://www.instagram.com/kaleenc_"
              target="_blank"
              rel="noopener noreferrer"
              className="about-connect__card"
            >
              <div>
                <p className="about-connect__card-kicker">Instagram</p>
                <p className="about-connect__card-handle">@kaleenc_</p>
              </div>
              <span className="about-connect__card-cta">Follow on Instagram →</span>
            </a>
          </div>
        </div>
      </section>

      {/* ── CTA strip ────────────────────────────────────────────────────── */}
      <section className="section-pad section--inset about-cta">
        <div className="container">
          <div className="about-cta__inner">
            <div>
              <p className="about-cta__kicker">May 20, 2026</p>
              <h2 className="about-cta__head">
                A 2-hour live workshop on the <span className="italic accent">physics of Pilates.</span>
              </h2>
            </div>
            <Link to="/pilates-physics-101" className="btn">
              Register Now
              <ArrowSvg />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
