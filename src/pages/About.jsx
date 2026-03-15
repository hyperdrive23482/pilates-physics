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

// Two-column prose layout reused across sections
function ProseSection({ heading, children, accent = false }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 2fr',
        gap: '4rem',
        alignItems: 'start',
      }}
      className="two-col-grid"
    >
      <h2
        style={{
          fontFamily: '"DM Serif Display", serif',
          fontSize: 'clamp(1.4rem, 2.5vw, 2rem)',
          lineHeight: '1.2',
          color: accent ? 'var(--color-accent)' : 'var(--color-ink)',
          margin: 0,
        }}
      >
        {heading}
      </h2>
      <div
        style={{
          fontSize: '1rem',
          lineHeight: '1.8',
          color: 'var(--color-ink-muted)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
        }}
      >
        {children}
      </div>
    </div>
  )
}

export default function About() {
  return (
    <div>
      {/* ── Page header ─────────────────────────────────────────────────── */}
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
          <p
            style={{
              fontSize: '0.7rem',
              fontWeight: '600',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: 'var(--color-accent)',
              marginBottom: '1.5rem',
            }}
          >
            About
          </p>
          <h1
            style={{
              fontFamily: '"DM Serif Display", serif',
              fontSize: 'clamp(2rem, 4.5vw, 3.25rem)',
              lineHeight: '1.15',
              color: 'var(--color-ink)',
              margin: '0 0 2rem',
              maxWidth: '800px',
            }}
          >
            Why a Pilates instructor started doing physics homework
          </h1>
          <p
            style={{
              fontSize: '1.1rem',
              lineHeight: '1.75',
              color: 'var(--color-ink-muted)',
              maxWidth: '660px',
              margin: 0,
            }}
          >
            I kept telling clients "that spring setting is too heavy for you" without being able to
            explain why. The answer wasn't in any training manual I'd read. So I went looking for
            it — in physics textbooks, biomechanics papers, and the original specifications of the
            apparatus itself. What I found changed how I teach, and I think it'll change how you
            teach too.
          </p>
        </div>
      </section>

      <Rule />

      {/* ── The Brand Thesis ─────────────────────────────────────────────── */}
      <Section>
        <ProseSection heading="Most Pilates conventions were pragmatic, not optimal">
          <p style={{ margin: 0 }}>
            Joe built his apparatus in the 1930s and 40s. The springs he used were hand-wound.
            The straps were leather. The wheels ran on bushings. Every design decision he made
            was a negotiation between what he wanted the body to do and what mid-century materials
            would allow. The result was brilliant, practical, and inevitably shaped by constraint.
          </p>
          <p style={{ margin: 0 }}>
            Those constraints are gone. Modern reformers run on sealed bearings. Ropes replaced
            leather. Springs are engineered to tighter tolerances. But the conventions — the spring
            settings, the strap lengths, the footbar positions — largely haven't changed. We've
            inherited the outcomes of those original negotiations without inheriting the reasoning
            behind them.
          </p>
          <p style={{ margin: 0 }}>
            This isn't a criticism of Joe. It's an observation about how knowledge gets transmitted.
            When we pass down what to do without teaching why it works, we create a field that
            can execute but can't adapt. Pilates Physics is the attempt to supply the missing
            layer — the mechanics — so that adaptation becomes principled, not guesswork.
          </p>
        </ProseSection>
      </Section>

      <Rule />

      {/* ── What Pilates Physics Is Not ──────────────────────────────────── */}
      <section style={{ background: 'var(--color-surface)', borderTop: '1px solid var(--color-rule)' }}>
        <Section style={{ paddingTop: '5rem', paddingBottom: '5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
            <h2
              style={{
                fontFamily: '"DM Serif Display", serif',
                fontSize: 'clamp(1.4rem, 2.5vw, 2rem)',
                lineHeight: '1.2',
                color: 'var(--color-ink)',
                margin: 0,
              }}
            >
              What this is not
            </h2>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                borderTop: '1px solid var(--color-rule)',
              }}
              className="not-grid"
            >
              {[
                {
                  label: 'Not a critique',
                  body: 'Classical Pilates works. The sequencing, the cueing, the progressions — they were arrived at through decades of empirical refinement. This course doesn\'t argue with any of that. It asks why it works.',
                },
                {
                  label: 'Not a replacement',
                  body: 'Teacher training programs give you a foundation in movement, anatomy, and client management that no physics course can replicate. This isn\'t a shortcut. It\'s a deeper layer on top of what you already know.',
                },
                {
                  label: 'Not more to memorize',
                  body: 'The goal is a transferable mental model — one that generates the right answers instead of storing them. After this course, you\'ll be able to reason about exercises you\'ve never seen before.',
                },
              ].map((item, i) => (
                <div
                  key={item.label}
                  style={{
                    padding: '2rem',
                    borderRight: i < 2 ? '1px solid var(--color-rule)' : 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                  }}
                  className="not-card"
                >
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: '600',
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      color: 'var(--color-accent)',
                    }}
                  >
                    {item.label}
                  </span>
                  <p
                    style={{
                      fontSize: '0.925rem',
                      lineHeight: '1.75',
                      color: 'var(--color-ink-muted)',
                      margin: 0,
                    }}
                  >
                    {item.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Section>
      </section>

      <Rule />

      {/* ── The Products ─────────────────────────────────────────────────── */}
      <Section>
        <ProseSection heading="The tools we're building">
          <p style={{ margin: 0 }}>
            <strong style={{ color: 'var(--color-ink)', fontWeight: '600' }}>Remo</strong> is a
            session notetaking app built for Pilates instructors. It captures spring settings,
            client cues, and session notes in a format that's actually useful the next time you
            see that client — without the friction of generic note apps that weren't designed
            for movement work.{' '}
            <a
              href="#"
              style={{
                color: 'var(--color-accent)',
                textDecoration: 'underline',
                fontSize: 'inherit',
              }}
            >
              Join the waitlist →
            </a>
          </p>
          <p style={{ margin: 0 }}>
            <strong style={{ color: 'var(--color-ink)', fontWeight: '600' }}>Motra</strong> is
            an online video hosting platform for hybrid teaching. It's designed around the way
            Pilates instructors actually work — organizing content by movement pattern, equipment,
            and client level rather than by upload date. Built for instructors who teach in the
            studio and want to extend that work online without stitching together five different
            platforms.{' '}
            <a
              href="#"
              style={{
                color: 'var(--color-accent)',
                textDecoration: 'underline',
                fontSize: 'inherit',
              }}
            >
              Join the waitlist →
            </a>
          </p>
          <p style={{ margin: 0, color: 'var(--color-ink-muted)', fontStyle: 'italic', fontSize: '0.9rem' }}>
            Both products are in development. The course comes first.
          </p>
        </ProseSection>
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
            The course is free. The understanding is permanent.
          </p>
          <Link
            to="/course"
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
            Start the Free Course →
          </Link>
        </div>
      </section>

      <style>{`
        @media (max-width: 860px) {
          .two-col-grid {
            grid-template-columns: 1fr !important;
            gap: 2rem !important;
          }
          .not-grid {
            grid-template-columns: 1fr !important;
          }
          .not-card {
            border-right: none !important;
            border-bottom: 1px solid var(--color-rule);
          }
          .not-card:last-child {
            border-bottom: none;
          }
        }
      `}</style>
    </div>
  )
}
