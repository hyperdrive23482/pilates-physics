import { Link } from 'react-router-dom'
import WaitlistForm from '../components/ui/WaitlistForm'

function Section({ children, style = {}, className = '' }) {
  return (
    <section
      className={className}
      style={{
        maxWidth: '1100px',
        margin: '0 auto',
        padding: '6rem 2rem',
        ...style,
      }}
    >
      {children}
    </section>
  )
}

function Rule() {
  return (
    <hr style={{ border: 'none', borderTop: '1px solid var(--color-rule)', margin: 0 }} />
  )
}

export default function Courses() {
  return (
    <div>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section
        style={{
          backgroundImage: 'url(/images/homepage/webinar-hero-image.JPG)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.55)',
          }}
        />
        <div
          style={{
            maxWidth: '1100px',
            margin: '0 auto',
            padding: '7rem 2rem 5rem',
            position: 'relative',
          }}
        >
          <div style={{ maxWidth: '680px' }}>
            <p
              style={{
                fontSize: '0.7rem',
                fontWeight: '600',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: 'rgba(255, 255, 255, 0.85)',
                marginBottom: '1.25rem',
              }}
            >
              Live Webinar
            </p>
            <h1
              style={{
                fontFamily: '"DM Serif Display", serif',
                fontSize: 'clamp(2rem, 4vw, 3rem)',
                lineHeight: '1.15',
                color: '#fff',
                margin: '0 0 1.5rem',
              }}
            >
              The physics behind the equipment
            </h1>
            <p
              style={{
                fontSize: '1.1rem',
                lineHeight: '1.65',
                color: 'rgba(255, 255, 255, 0.85)',
                margin: '0 0 2rem',
              }}
            >
              A 2-hour live session for Pilates instructors who want to understand
              why their equipment works the way it does — not just what settings to
              use.
            </p>

            <WaitlistForm compact />

            <p
              style={{
                fontSize: '0.78rem',
                color: 'rgba(255, 255, 255, 0.7)',
                marginTop: '1rem',
              }}
            >
              Registration opens soon. Join the waitlist to be first to know. No spam.
            </p>
          </div>
        </div>
      </section>

      <Rule />

      {/* ── Who It's For ─────────────────────────────────────────────────── */}
      <Section>
        <h2
          style={{
            fontFamily: '"DM Serif Display", serif',
            fontSize: 'clamp(1.5rem, 3vw, 2.25rem)',
            lineHeight: '1.2',
            color: 'var(--color-ink)',
            margin: '0 0 2.5rem',
          }}
        >
          For Pilates instructors who...
        </h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '1.25rem',
          }}
          className="who-grid"
        >
          {[
            {
              number: '1',
              text: 'Have been teaching long enough to notice that the same setup doesn\u2019t work the same way on every body',
            },
            {
              number: '2',
              text: null,
            },
            {
              number: '3',
              text: 'Would rather learn a framework than memorize another chart',
            },
          ].map((item) => (
            <div
              key={item.number}
              style={{
                padding: '1.75rem',
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                border: '1px solid #2E2C28',
              }}
            >
              <span
                style={{
                  fontFamily: '"DM Serif Display", serif',
                  fontSize: '1.5rem',
                  color: '#EF9F27',
                  lineHeight: 1,
                }}
              >
                {item.number}
              </span>
              <p
                style={{
                  fontSize: '0.95rem',
                  lineHeight: '1.65',
                  color: 'var(--color-ink-muted)',
                  margin: 0,
                }}
              >
                {item.number === '2' ? (
                  <>Want to understand <em>why</em> their adjustments work, not just <em>that</em> they work</>
                ) : (
                  item.text
                )}
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Rule />

      {/* ── Topics Covered ───────────────────────────────────────────────── */}
      <section style={{ background: 'var(--color-surface)' }}>
        <Section>
          <h2
            style={{
              fontFamily: '"DM Serif Display", serif',
              fontSize: 'clamp(1.5rem, 3vw, 2.25rem)',
              lineHeight: '1.2',
              color: 'var(--color-ink)',
              margin: '0 0 1rem',
              maxWidth: '560px',
            }}
          >
            What you'll learn in two hours
          </h2>
          <p
            style={{
              fontSize: '1rem',
              lineHeight: '1.7',
              color: 'var(--color-ink-muted)',
              margin: '0 0 3rem',
              maxWidth: '600px',
            }}
          >
            Four connected topics that build a mechanical framework you can apply to
            any exercise, any reformer, any client.
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '0',
              borderTop: '1px solid var(--color-rule)',
            }}
            className="topics-grid"
          >
            {[
              {
                number: '01',
                title: 'Spring Mechanics',
                body: 'Why springs get heavier as they stretch, how that differs from weight stacks, and whether they really push and pull (and why).',
              },
              {
                number: '02',
                title: 'Equipment Variables',
                body: 'How gear position, footbar height, and rope length change the force environment — not just the difficulty, but what the body is actually asked to do.',
              },
              {
                number: '03',
                title: 'Body Mechanics',
                body: 'How limb length, bodyweight, and strength interact with equipment settings. Why the same spring feels different for every client.',
              },
              {
                number: '04',
                title: 'A Transferable Framework',
                body: 'Not a new table to memorize — a way of understanding the loading environment mechanically. Applicable to any exercise, any brand of reformer, any body.',
              },
            ].map((item, i) => (
              <div
                key={item.number}
                style={{
                  padding: '2rem',
                  borderBottom: i < 2 ? '1px solid var(--color-rule)' : 'none',
                  borderRight: i % 2 === 0 ? '1px solid var(--color-rule)' : 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                }}
                className="topic-card"
              >
                <span
                  style={{
                    fontFamily: '"DM Serif Display", serif',
                    fontSize: '1.75rem',
                    color: 'var(--color-rule)',
                    lineHeight: 1,
                  }}
                >
                  {item.number}
                </span>
                <h3
                  style={{
                    fontFamily: '"DM Serif Display", serif',
                    fontSize: '1.1rem',
                    color: 'var(--color-ink)',
                    margin: 0,
                  }}
                >
                  {item.title}
                </h3>
                <p
                  style={{
                    fontSize: '0.95rem',
                    lineHeight: '1.7',
                    color: 'var(--color-ink-muted)',
                    margin: 0,
                  }}
                >
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </Section>
      </section>

      <Rule />

      {/* ── Details & Pricing ────────────────────────────────────────────── */}
      <Section>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '4rem',
            alignItems: 'start',
          }}
          className="details-grid"
        >
          <div>
            <h2
              style={{
                fontFamily: '"DM Serif Display", serif',
                fontSize: 'clamp(1.5rem, 3vw, 2.25rem)',
                lineHeight: '1.2',
                color: 'var(--color-ink)',
                margin: '0 0 2rem',
              }}
            >
              Details
            </h2>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem',
              }}
            >
              {[
                { label: 'Date', value: 'Wednesday, May 20, 2026' },
                { label: 'Duration', value: '2 hours' },
                { label: 'Format', value: 'Live via Zoom, recording included' },
                { label: 'Price', value: '$99' },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.25rem',
                    paddingBottom: '1.25rem',
                    borderBottom: '1px solid var(--color-rule)',
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: '600',
                      letterSpacing: '0.15em',
                      textTransform: 'uppercase',
                      color: 'var(--color-accent)',
                    }}
                  >
                    {item.label}
                  </span>
                  <span
                    style={{
                      fontSize: '1rem',
                      color: 'var(--color-ink)',
                    }}
                  >
                    {item.value}
                  </span>
                </div>
              ))}
            </div>

            <p
              style={{
                fontSize: '0.85rem',
                lineHeight: '1.7',
                color: 'var(--color-ink-muted)',
                marginTop: '1.5rem',
              }}
            >
            </p>
          </div>

          <div
            style={{
              background: 'var(--color-surface)',
              padding: '2.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem',
            }}
          >
            <h3
              style={{
                fontFamily: '"DM Serif Display", serif',
                fontSize: '1.3rem',
                color: 'var(--color-ink)',
                margin: 0,
              }}
            >
              Registration opens soon
            </h3>
            <p
              style={{
                fontSize: '0.95rem',
                lineHeight: '1.7',
                color: 'var(--color-ink-muted)',
                margin: 0,
              }}
            >
              Join the waitlist and we'll notify you as soon as registration opens.
            </p>
            <WaitlistForm />
            <p
              style={{
                fontSize: '0.78rem',
                color: 'var(--color-ink-muted)',
                margin: 0,
              }}
            >
              No spam. Unsubscribe anytime.
            </p>
          </div>
        </div>
      </Section>

      <Rule />

      {/* ── Meet Your Instructor ─────────────────────────────────────────── */}
      <section style={{ background: 'var(--color-surface)' }}>
        <Section>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 280px) 1fr',
              gap: '4rem',
              alignItems: 'start',
            }}
            className="instructor-grid"
          >
            <img
              src="/images/about/kaleen-sitting.jpg"
              alt="Kaleen Canevari"
              style={{
                width: '100%',
                display: 'block',
                objectFit: 'cover',
                aspectRatio: '2 / 3',
              }}
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <p
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: '600',
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    color: 'var(--color-accent)',
                    marginBottom: '0.75rem',
                  }}
                >
                  Your Instructor
                </p>
                <h2
                  style={{
                    fontFamily: '"DM Serif Display", serif',
                    fontSize: 'clamp(1.5rem, 3vw, 2.25rem)',
                    lineHeight: '1.2',
                    color: 'var(--color-ink)',
                    margin: '0 0 0.5rem',
                  }}
                >
                  Kaleen Canevari
                </h2>
                <p
                  style={{
                    fontSize: '0.85rem',
                    fontWeight: '500',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: 'var(--color-accent)',
                    margin: 0,
                  }}
                >
                  Mechanical engineer & Pilates instructor
                </p>
              </div>

              <p
                style={{
                  fontSize: '1rem',
                  lineHeight: '1.8',
                  color: 'var(--color-ink-muted)',
                  margin: 0,
                }}
              >
                Kaleen studied mechanical engineering before stepping on a reformer.
                In 2013 she joined Balanced Body as a design engineer, and started
                teaching Pilates in 2014. She's spent over a decade at the
                intersection of engineering and movement — designing equipment,
                running a Pilates equipment maintenance business, and founding a
                connected Pilates equipment company.
              </p>

              <p
                style={{
                  fontSize: '1rem',
                  lineHeight: '1.8',
                  color: 'var(--color-ink-muted)',
                  margin: 0,
                }}
              >
                Pilates Physics is where she brings that engineering lens to
                instructor education — making the mechanics behind the equipment
                accessible to every working instructor.
              </p>

              <Link
                to="/about"
                style={{
                  color: 'var(--color-accent)',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  textDecoration: 'none',
                }}
              >
                More about Kaleen →
              </Link>
            </div>
          </div>
        </Section>
      </section>

      <Rule />

      {/* ── What's Included ──────────────────────────────────────────────── */}
      <Section>
        <h2
          style={{
            fontFamily: '"DM Serif Display", serif',
            fontSize: 'clamp(1.5rem, 3vw, 2.25rem)',
            lineHeight: '1.2',
            color: 'var(--color-ink)',
            margin: '0 0 3rem',
          }}
        >
          What's included
        </h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '1.5rem',
          }}
          className="included-grid"
        >
          {[
            {
              label: '2-Hour Live Session',
              desc: 'Real-time instruction with live Q&A. Ask questions, get answers, go deeper on the topics that matter to your practice.',
            },
            {
              label: 'Full Recording',
              desc: 'Can\'t attend live? The full recording is shared within 24 hours.',
            },
            {
              label: 'Reference Guide',
              desc: 'A downloadable PDF covering the key topics from the session built for quick reference in the studio.',
            },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                padding: '2rem',
                background: 'var(--color-surface-raised)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
              }}
            >
              <h3
                style={{
                  fontFamily: '"DM Serif Display", serif',
                  fontSize: '1.1rem',
                  color: 'var(--color-ink)',
                  margin: 0,
                }}
              >
                {item.label}
              </h3>
              <p
                style={{
                  fontSize: '0.95rem',
                  lineHeight: '1.7',
                  color: 'var(--color-ink-muted)',
                  margin: 0,
                }}
              >
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Rule />

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section style={{ background: 'var(--color-surface)' }}>
        <Section>
          <h2
            style={{
              fontFamily: '"DM Serif Display", serif',
              fontSize: 'clamp(1.5rem, 3vw, 2.25rem)',
              lineHeight: '1.2',
              color: 'var(--color-ink)',
              margin: '0 0 3rem',
            }}
          >
            Common questions
          </h2>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0',
            }}
          >
            {[
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
                a: 'Both. Physics doesn\'t take sides. A spring behaves the same way regardless of your training lineage.',
              },
              {
                q: 'What if I can\'t make the live session?',
                a: 'The recording is included with every registration. You can submit questions ahead of time. Of course, a big value of the workshop is the live Q&A, but I understand the difficulties of scheduling.',
              },
            ].map((item, i) => (
              <div
                key={i}
                style={{
                  padding: '1.75rem 0',
                  borderBottom: '1px solid var(--color-rule)',
                }}
              >
                <h3
                  style={{
                    fontFamily: '"DM Serif Display", serif',
                    fontSize: '1.1rem',
                    color: 'var(--color-ink)',
                    margin: '0 0 0.75rem',
                  }}
                >
                  {item.q}
                </h3>
                <p
                  style={{
                    fontSize: '0.95rem',
                    lineHeight: '1.7',
                    color: 'var(--color-ink-muted)',
                    margin: 0,
                    maxWidth: '680px',
                  }}
                >
                  {item.a}
                </p>
              </div>
            ))}
          </div>
        </Section>
      </section>

      <Rule />

      {/* ── Final CTA ────────────────────────────────────────────────────── */}
      <section style={{ background: 'var(--color-surface-raised)' }}>
        <div
          style={{
            maxWidth: '680px',
            margin: '0 auto',
            padding: '6rem 2rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '2rem',
            alignItems: 'flex-start',
          }}
        >
          <div>
            <h2
              style={{
                fontFamily: '"DM Serif Display", serif',
                fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)',
                lineHeight: '1.2',
                color: 'var(--color-ink)',
                margin: '0 0 1rem',
              }}
            >
              Live. Interactive. Built for working instructors.
            </h2>
            <p
              style={{
                fontSize: '1rem',
                lineHeight: '1.65',
                color: 'var(--color-ink-muted)',
                margin: 0,
              }}
            >
              Whether you've been teaching for a year or ten, this webinar gives you a
              mechanical framework for the questions you already have. Join the waitlist
              and we'll notify you when registration opens.
            </p>
          </div>

          <WaitlistForm style={{ width: '100%' }} />

          <p
            style={{
              fontSize: '0.78rem',
              color: 'var(--color-ink-muted)',
              margin: 0,
            }}
          >
            Registration opens soon. Join the waitlist to be first to know. No spam.
          </p>
        </div>
      </section>

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 900px) {
          .who-grid {
            grid-template-columns: 1fr !important;
          }
          .included-grid {
            grid-template-columns: 1fr !important;
          }
          .topics-grid {
            grid-template-columns: 1fr !important;
          }
          .topic-card {
            border-right: none !important;
            border-bottom: 1px solid var(--color-rule) !important;
          }
          .topic-card:last-child {
            border-bottom: none !important;
          }
          .instructor-grid {
            grid-template-columns: 1fr !important;
            gap: 2.5rem !important;
          }
          .instructor-grid img {
            max-height: 400px;
            aspect-ratio: 3 / 4 !important;
          }
          .details-grid {
            grid-template-columns: 1fr !important;
            gap: 2.5rem !important;
          }
        }
      `}</style>
    </div>
  )
}
