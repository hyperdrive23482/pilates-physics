import { Link } from 'react-router-dom'
import RegisterCard from '../components/ui/RegisterCard'
import { useWorkshop } from '../hooks/useWorkshops'

const primaryButtonStyle = {
  display: 'inline-block',
  padding: '0.875rem 1.75rem',
  fontSize: '0.95rem',
  fontWeight: '500',
  fontFamily: '"DM Sans", sans-serif',
  background: 'var(--color-accent)',
  color: '#1C1A17',
  border: 'none',
  textDecoration: 'none',
  cursor: 'pointer',
}

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

export default function PilatesPhysics102() {
  const { workshop } = useWorkshop('PP-102-July-2026')

  return (
    <div>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section
        style={{
          backgroundImage: 'url(/images/homepage/workshop-hero-image.JPG)',
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
              Live Workshop
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
              The physics of the Chair and Cadillac
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
              what changes when the body moves from the reformer to the Chair or
              the Cadillac — and why the same spring feels nothing alike on each.
            </p>

            <a href="#register" style={primaryButtonStyle}>Register Now — $99</a>

            <p
              style={{
                fontSize: '0.78rem',
                color: 'rgba(255, 255, 255, 0.7)',
                marginTop: '1rem',
              }}
            >
              Live on Wednesday, July 15, 2026. Recording included.
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
              text: 'Teach (or want to teach) on the Chair and Cadillac and want a clearer mental model of what the springs are actually doing',
            },
            {
              number: '2',
              text: null,
            },
            {
              number: '3',
              text: 'Already understand reformer mechanics and want to extend that thinking to the rest of the apparatus',
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
                  <>Have noticed that <em>where</em> the spring attaches changes everything — and want to know why</>
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
            Four connected topics that extend the Pilates Physics framework to
            the Chair and Cadillac — two pieces of equipment that load the body
            very differently from the reformer.
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
                title: 'Chair Spring Mechanics',
                body: 'Where the springs attach on a Wunda or Combo Chair, how the pedal travel changes the spring length, and what that means for the load through the exercise.',
              },
              {
                number: '02',
                title: 'Cadillac Spring Geometry',
                body: 'Why the same spring on a different hook is a different exercise. How attachment height and angle change the direction and magnitude of force the body has to manage.',
              },
              {
                number: '03',
                title: 'Body Position & Lever Arms',
                body: 'How the relationship between the body, the spring, and the apparatus determines the actual load on a joint — and why small position changes produce big mechanical changes.',
              },
              {
                number: '04',
                title: 'A Transferable Framework',
                body: 'How the same physics principles that explain the reformer also explain the Chair and Cadillac. One mental model, applied across the apparatus.',
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
                { label: 'Date', value: 'Wednesday, July 15, 2026' },
                { label: 'Time', value: '11am PDT / 2pm EDT' },
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
            id="register"
            style={{
              background: 'var(--color-surface)',
              padding: '2.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem',
              scrollMarginTop: '5rem',
            }}
          >
            {workshop ? (
              <RegisterCard workshop={workshop} />
            ) : (
              <p style={{ fontSize: '0.9rem', color: 'var(--color-ink-muted)', margin: 0 }}>
                Loading registration…
              </p>
            )}
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
                q: 'Do I need to have taken Pilates Physics 101?',
                a: 'No. 102 stands on its own. If you have taken 101, you\'ll recognize the framework being extended to new equipment; if you haven\'t, you\'ll still walk away with a clear mental model for the Chair and Cadillac.',
              },
              {
                q: 'Will there be a recording?',
                a: 'Yes. The full recording is shared within 24 hours of the live session.',
              },
              {
                q: 'What equipment knowledge do I need?',
                a: 'This course is best for professionals who are certified to teach Pilates and have at least some exposure to the Chair and/or Cadillac. You don\'t need to teach on them daily — just enough familiarity to follow along.',
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
              Extend your physics framework to the Chair and Cadillac in a single
              focused session. Reserve your seat — registration is open now.
            </p>
          </div>

          <a href="#register" style={primaryButtonStyle}>Register Now — $99</a>
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
