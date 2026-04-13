import { Link } from 'react-router-dom'

function Rule() {
  return (
    <hr style={{ border: 'none', borderTop: '1px solid var(--color-rule)', margin: 0 }} />
  )
}

function Section({ children, style = {} }) {
  return (
    <section
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


export default function About() {
  return (
    <div>
      {/* ── About Kaleen ─────────────────────────────────────────────────── */}
      <section
        style={{
          borderBottom: '1px solid var(--color-rule)',
          background: 'var(--color-surface)',
        }}
      >
        <div
          style={{
            maxWidth: '1100px',
            margin: '0 auto',
            padding: '7rem 2rem 5rem',
          }}
        >
          <div
            className="about-hero-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1.5fr',
              gap: '5rem',
              alignItems: 'start',
            }}
          >
            {/* Photo */}
            <div style={{ position: 'relative' }}>
              <img
                src="/images/about/kaleen-sitting.jpg"
                alt="Kaleen"
                style={{
                  width: '100%',
                  display: 'block',
                  objectFit: 'cover',
                  aspectRatio: '2 / 3',
                }}
              />
            </div>

            {/* Bio */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <h1
                  style={{
                    fontFamily: '"DM Serif Display", serif',
                    fontSize: 'clamp(2rem, 4vw, 3rem)',
                    lineHeight: '1.1',
                    color: 'var(--color-ink)',
                    margin: '0 0 0.5rem',
                  }}
                >
                  Kaleen Canevari
                </h1>
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
                  Pilates instructor, mechanical engineer, &amp; software founder
                </p>
              </div>

              <p
                style={{
                  fontSize: '1.05rem',
                  lineHeight: '1.8',
                  color: 'var(--color-ink-muted)',
                  margin: 0,
                }}
              >
                I studied mechanical engineering before I ever stepped on a reformer. In 2013 I
                got a job as a design engineer at Balanced Body, and to learn more about what I
                was building, I started taking Pilates classes. When I began teaching in 2014, I
                kept noticing a gap between what I was trained to do and what my students actually
                needed. As I trained with more experts and got better at personalizing my teaching,
                I realized the best instructors inherently understood physics. They just couldn't
                always explain it.
              </p>

              <p
                style={{
                  fontSize: '1.05rem',
                  lineHeight: '1.8',
                  color: 'var(--color-ink-muted)',
                  margin: 0,
                }}
              >
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

      <Rule />

      {/* ── Why Pilates Physics ───────────────────────────────────────────── */}
      <section>
        <div
          className="why-grid"
          style={{
            maxWidth: '1100px',
            margin: '0 auto',
            padding: '6rem 2rem',
            display: 'grid',
            gridTemplateColumns: '1.2fr 1fr',
            gap: '6rem',
            alignItems: 'center',
          }}
        >
          {/* Text */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <h2
              style={{
                fontFamily: '"DM Serif Display", serif',
                fontSize: 'clamp(1.6rem, 3vw, 2.4rem)',
                lineHeight: '1.2',
                color: 'var(--color-ink)',
                margin: 0,
              }}
            >
              Physics doesn't take sides
            </h2>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem',
                fontSize: '1rem',
                lineHeight: '1.8',
                color: 'var(--color-ink-muted)',
              }}
            >
              <p style={{ margin: 0 }}>
                Pilates instructors are more capable when they understand the mechanics behind
                what they're teaching. That's not a controversial idea — it's just an
                underleveraged one.
              </p>
              <p style={{ margin: 0 }}>
                A spring behaves the same way whether you trained classically or contemporary.
                Force vectors don't care about your certification or lineage. When you understand
                what's actually happening mechanically, you can work with any body, on any
                equipment, without needing a rule for every situation.
              </p>
            </div>
          </div>

          {/* Photo */}
          <div>
            <img
              src="/images/about/kaleen-hug-chair.jpg"
              alt="Kaleen at the Pilates chair"
              style={{
                width: '100%',
                display: 'block',
                objectFit: 'cover',
                aspectRatio: '1 / 1',
              }}
            />
          </div>
        </div>
      </section>

      <Rule />

      {/* ── Tools I've Built for Instructors ─────────────────────────────── */}
      <section style={{ background: 'var(--color-surface)', borderTop: '1px solid var(--color-rule)' }}>
        <Section style={{ paddingTop: '5rem', paddingBottom: '5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
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
                Tools I've Built for Instructors
              </p>
              <p
                style={{
                  fontSize: '1rem',
                  lineHeight: '1.7',
                  color: 'var(--color-ink-muted)',
                  maxWidth: '600px',
                  margin: 0,
                }}
              >
                Pilates Physics is the education side. These are the software products I've built
                to solve problems I ran into as a working instructor.
              </p>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr',
                gap: '1.5rem',
              }}
              className="tools-grid"
            >
              {[
                {
                  name: 'Remo',
                  tagline: 'AI Notetaker for private Pilates instructors.',
                  body: 'Built for the way you actually teach. Capture audio of what you teach and get a session summary, exercise list, client feedback, progress maps, and more with the click of a button.',
                  url: 'https://www.RemoPilates.com',
                },
              ].map((tool) => (
                <div
                  key={tool.name}
                  style={{
                    background: 'var(--color-surface-raised)',
                    padding: '2rem',
                    display: 'grid',
                    gridTemplateColumns: 'minmax(0, 220px) minmax(0, 1fr)',
                    gap: '2rem',
                    alignItems: 'center',
                  }}
                  className="remo-card"
                >
                  <img
                    src="/images/homepage/remo-mockup.png"
                    alt="Remo app mockup"
                    style={{
                      width: '100%',
                      maxWidth: '220px',
                      height: 'auto',
                      display: 'block',
                      justifySelf: 'center',
                    }}
                  />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <h3
                    style={{
                      fontFamily: '"DM Serif Display", serif',
                      fontSize: '1.3rem',
                      color: 'var(--color-ink)',
                      margin: 0,
                    }}
                  >
                    {tool.name}
                  </h3>
                  <p
                    style={{
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: 'var(--color-ink)',
                      margin: 0,
                      lineHeight: '1.5',
                    }}
                  >
                    {tool.tagline}
                  </p>
                  <p
                    style={{
                      fontSize: '0.875rem',
                      lineHeight: '1.7',
                      color: 'var(--color-ink-muted)',
                      margin: 0,
                    }}
                  >
                    {tool.body}
                  </p>
                  <a
                    href={tool.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: 'var(--color-accent)',
                      fontSize: '0.85rem',
                      fontWeight: '500',
                      textDecoration: 'none',
                      marginTop: '0.5rem',
                    }}
                  >
                    Learn more →
                  </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Section>
      </section>

      <Rule />

      {/* ── Connect with Kaleen ──────────────────────────────────────────── */}
      <Section>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
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
              Connect with Kaleen
            </p>
            <p
              style={{
                fontSize: '1rem',
                lineHeight: '1.7',
                color: 'var(--color-ink-muted)',
                maxWidth: '520px',
                margin: 0,
              }}
            >
              Follow along on Substack for writing on Pilates mechanics, or on Instagram for
              shorter-form content and behind-the-scenes.
            </p>
          </div>

          <div
            style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}
            className="connect-links"
          >
            <a
              href="https://kaleenc.substack.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '1rem 1.5rem',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-rule)',
                textDecoration: 'none',
                flex: '1',
                minWidth: '200px',
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: '600',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: 'var(--color-accent)',
                    margin: '0 0 0.2rem',
                  }}
                >
                  Substack
                </p>
                <p
                  style={{
                    fontSize: '0.95rem',
                    color: 'var(--color-ink)',
                    margin: 0,
                    fontWeight: '500',
                  }}
                >
                  kaleenc.substack.com →
                </p>
              </div>
            </a>

            <a
              href="https://www.instagram.com/kaleenc_"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '1rem 1.5rem',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-rule)',
                textDecoration: 'none',
                flex: '1',
                minWidth: '200px',
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: '600',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: 'var(--color-accent)',
                    margin: '0 0 0.2rem',
                  }}
                >
                  Instagram
                </p>
                <p
                  style={{
                    fontSize: '0.95rem',
                    color: 'var(--color-ink)',
                    margin: 0,
                    fontWeight: '500',
                  }}
                >
                  @kaleenc_ →
                </p>
              </div>
            </a>
          </div>
        </div>
      </Section>

      <Rule />

      {/* ── CTA strip ────────────────────────────────────────────────────── */}
      <section style={{ background: 'var(--color-accent-light)' }}>
        <div
          style={{
            maxWidth: '1100px',
            margin: '0 auto',
            padding: '4rem 2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '2rem',
          }}
        >
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
              Coming soon
            </p>
            <p
              style={{
                fontFamily: '"DM Serif Display", serif',
                fontSize: 'clamp(1.25rem, 2.5vw, 1.75rem)',
                lineHeight: '1.3',
                color: 'var(--color-ink)',
                margin: 0,
                maxWidth: '520px',
              }}
            >
              A 2-hour live webinar on the mechanics behind every spring setting, equipment decision, and cueing choice you make.
            </p>
          </div>
          <Link
            to="/"
            style={{
              display: 'inline-block',
              padding: '0.875rem 2rem',
              background: 'var(--color-accent)',
              color: '#1C1A17',
              fontSize: '0.9rem',
              fontWeight: '500',
              fontFamily: '"DM Sans", sans-serif',
              textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            Join the waitlist →
          </Link>
        </div>
      </section>

      <style>{`
        @media (max-width: 860px) {
          .about-hero-grid {
            grid-template-columns: 1fr !important;
            gap: 2.5rem !important;
          }
          .about-hero-grid img {
            aspect-ratio: 3 / 4 !important;
            max-height: 480px;
          }
          .why-grid {
            grid-template-columns: 1fr !important;
            gap: 2.5rem !important;
          }
          .why-grid > div:last-child {
            order: -1;
          }
          .tools-grid {
            grid-template-columns: 1fr !important;
          }
          .remo-card {
            grid-template-columns: 1fr !important;
          }
          .remo-card > img {
            order: -1;
            max-width: 320px;
          }
          .two-col-grid {
            grid-template-columns: 1fr !important;
            gap: 2rem !important;
          }
        }
      `}</style>
    </div>
  )
}
