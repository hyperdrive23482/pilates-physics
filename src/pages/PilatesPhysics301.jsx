import { Link } from 'react-router-dom'

const primaryButtonStyle = {
  display: 'inline-block',
  padding: '0.875rem 1.75rem',
  fontSize: '0.95rem',
  fontWeight: '500',
  fontFamily: 'var(--font-serif)',
  background: 'var(--color-accent)',
  color: 'var(--color-accent-ink)',
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

export default function PilatesPhysics301() {
  return (
    <div>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section
        style={{
          backgroundImage: 'url(/images/homepage/hero-image-3.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(28, 26, 23, 0.7)',
          }}
        />
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            maxWidth: '1100px',
            margin: '0 auto',
            padding: '7rem 2rem 5rem',
          }}
        >
          <div style={{ maxWidth: '720px' }}>
            <p
              style={{
                fontSize: '0.7rem',
                fontWeight: '600',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: 'var(--color-accent)',
                marginBottom: '1.25rem',
              }}
            >
              3-Month Intensive Mentoring
            </p>
            <h1
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'clamp(2rem, 4vw, 3rem)',
                lineHeight: '1.15',
                color: 'var(--color-ink)',
                margin: '0 0 1.5rem',
              }}
            >
              Pilates Physics 301
            </h1>
            <p
              style={{
                fontSize: '1.1rem',
                lineHeight: '1.65',
                color: 'var(--color-ink-muted)',
                margin: '0 0 2rem',
              }}
            >
              A small-cohort, three-month deep dive into the physics that drives
              Pilates equipment, with group lectures, homework you actually get
              feedback on, and one private mentoring call every month.
            </p>

            <Link to="/pilates-physics-301/apply" style={primaryButtonStyle}>Apply now</Link>

            <p
              style={{
                fontSize: '0.78rem',
                color: 'var(--color-ink-muted)',
                marginTop: '1rem',
              }}
            >
              By application. Limited cohort.
            </p>
          </div>
        </div>
      </section>

      <Rule />

      {/* ── Sound Familiar? ──────────────────────────────────────────────── */}
      <section style={{ background: 'var(--color-surface)' }}>
        <Section>
          <h2
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(1.5rem, 3vw, 2.25rem)',
              lineHeight: '1.2',
              color: 'var(--color-ink)',
              margin: '0 0 1rem',
            }}
          >
            Sound familiar?
          </h2>
          <p
            style={{
              fontSize: '1rem',
              lineHeight: '1.7',
              color: 'var(--color-ink-muted)',
              margin: '0 0 3rem',
              maxWidth: '640px',
            }}
          >
            If any of these run through your head while you're teaching, you're
            in the right place.
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '1.5rem',
            }}
            className="quotes-grid"
          >
            {[
              "My teacher training taught me the choreography. A few years in, I want to understand the why behind every setup.",
              "I saw a really cool flow on Instagram but I'm not sure how it fits in to what I'm trying to teach my clients. Is there a framework that will help me figure it out?",
              "Why does adding springs during a bridge make it easier for my struggling client? Are there other situations where the same rule applies?",
              "I want to progress my actual clients, the ones I see twice a week, not the hypothetical ones in a textbook.",
            ].map((quote, i) => (
              <div
                key={i}
                style={{
                  padding: '1.75rem',
                  background: 'var(--color-surface-raised)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.25rem',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '2.5rem',
                    color: '#EF9F27',
                    lineHeight: 0.6,
                  }}
                >
                  &ldquo;
                </span>
                <p
                  style={{
                    fontSize: '1rem',
                    lineHeight: '1.65',
                    color: 'var(--color-ink)',
                    margin: 0,
                  }}
                >
                  {quote}
                </p>
              </div>
            ))}
          </div>

          <p
            style={{
              fontSize: '1rem',
              lineHeight: '1.75',
              color: 'var(--color-ink-muted)',
              margin: '2.75rem 0 0',
              maxWidth: '720px',
            }}
          >
            PP-301 is built for the instructor who keeps asking <em>why</em>.
            Structured lectures, case studies on your real clients, and the
            language to explain what your equipment is actually doing, every
            time, with confidence.
          </p>
        </Section>
      </section>

      <Rule />

      {/* ── Who It's For ─────────────────────────────────────────────────── */}
      <Section>
        <h2
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(1.5rem, 3vw, 2.25rem)',
            lineHeight: '1.2',
            color: 'var(--color-ink)',
            margin: '0 0 2.5rem',
          }}
        >
          This program is for instructors who...
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
              text: 'Have completed Pilates Physics 101',
            },
            {
              number: '2',
              text: 'Want to deeply understand the physics of why what they do works',
            },
            {
              number: '3',
              text: 'Are curious and able to think critically about what they teach',
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
                  fontFamily: 'var(--font-serif)',
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
                {item.text}
              </p>
            </div>
          ))}
        </div>

        <p
          style={{
            fontSize: '0.95rem',
            lineHeight: '1.7',
            color: 'var(--color-ink-muted)',
            margin: '2.5rem 0 0',
            maxWidth: '720px',
          }}
        >
          Pilates Physics 301 is best suited for instructors who have been
          teaching full time for at least a year and can dedicate 2-3 hours a
          week to lectures and case study homework.
        </p>
      </Section>

      <Rule />

      {/* ── Program Structure ────────────────────────────────────────────── */}
      <section style={{ background: 'var(--color-surface)' }}>
        <Section>
          <h2
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(1.5rem, 3vw, 2.25rem)',
              lineHeight: '1.2',
              color: 'var(--color-ink)',
              margin: '0 0 1rem',
              maxWidth: '560px',
            }}
          >
            What three months looks like
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
            Six lectures, monthly 1:1 calls, and hands-on homework with
            individual feedback, built around your teaching life.
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
                title: 'Group Lectures',
                body: 'Two hours of live lecture and discussion every two weeks, with six sessions across the cohort. Bring questions from your week of teaching.',
              },
              {
                number: '02',
                title: 'Case Studies on Your Real Clients',
                body: 'The week\'s concepts applied to the people you actually teach, not hypothetical clients in a textbook. Submit your work and get individual feedback.',
              },
              {
                number: '03',
                title: '1:1 Mentoring',
                body: 'One private call per month covering your clients, your studio, and your edge cases. Three calls across the program.',
              },
              {
                number: '04',
                title: 'Small Cohort',
                body: 'A limited group means real discussion and real feedback. I want to offer you the individual attention you need while keeping structure to the learning path.',
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
                    fontFamily: 'var(--font-serif)',
                    fontSize: '1.75rem',
                    color: 'var(--color-rule)',
                    lineHeight: 1,
                  }}
                >
                  {item.number}
                </span>
                <h3
                  style={{
                    fontFamily: 'var(--font-serif)',
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

      {/* ── What You'll Learn ────────────────────────────────────────────── */}
      <Section>
        <h2
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(1.5rem, 3vw, 2.25rem)',
            lineHeight: '1.2',
            color: 'var(--color-ink)',
            margin: '0 0 3rem',
          }}
        >
          What you'll go deep on
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
              label: 'Detailed Free-Body Diagrams',
              desc: 'Move past intuition. Build and read free-body diagrams for the exercises you teach, so you can predict how a setup will load a body before the client gets on the equipment.',
            },
            {
              label: 'Chair & Tower Physics',
              desc: 'The reformer is well-trodden ground. The chair and the tower behave very differently, with different geometry and different load paths. We dig into both.',
            },
            {
              label: 'Physics-Based Progression',
              desc: 'Build progressions that follow mechanical logic, not memorized sequences. Tools for matching the right setup to the right body at the right moment.',
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
                  fontFamily: 'var(--font-serif)',
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

      {/* ── Apply & Details ──────────────────────────────────────────────── */}
      <Section>
        <div
          className="apply-cta-banner"
          style={{
            background: 'var(--color-surface)',
            padding: '2rem 2.5rem',
            marginBottom: '4rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '2rem',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ flex: '1 1 460px' }}>
            <h3
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '1.4rem',
                color: 'var(--color-ink)',
                margin: '0 0 0.5rem',
              }}
            >
              Apply to join the next cohort
            </h3>
            <p
              style={{
                fontSize: '0.9rem',
                lineHeight: '1.6',
                color: 'var(--color-ink-muted)',
                margin: 0,
              }}
            >
              Tell me a little bit about yourself and why you want to take this
              course. I review applications on a first-come-first-serve basis.
              Limited number of slots available.
            </p>
          </div>

          <Link
            to="/pilates-physics-301/apply"
            style={{ ...primaryButtonStyle, flexShrink: 0 }}
          >
            Apply now
          </Link>
        </div>

        <h2
          style={{
            fontFamily: 'var(--font-serif)',
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
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '1.25rem 3rem',
          }}
          className="details-grid"
        >
          {[
            { label: 'Application deadline', value: 'July 19, 2026 (rolling admissions)' },
            { label: 'Dates', value: 'August 17 – November 19, 2026' },
            { label: 'Duration', value: '3 months' },
            { label: 'Cohort size', value: 'Limited to 12' },
            { label: 'Contact Hours', value: '18' },
            { label: 'Format', value: 'Live via Zoom, recordings included' },
            { label: 'Investment', value: '$1,500 single up-front payment, or $600/mo for 3 months' },
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
                    fontFamily: 'var(--font-serif)',
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
                intersection of engineering and movement, designing equipment,
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
                instructor education, making the mechanics behind the equipment
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

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <Section>
        <h2
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(1.5rem, 3vw, 2.25rem)',
            lineHeight: '1.2',
            color: 'var(--color-ink)',
            margin: '0 0 3rem',
          }}
        >
          Common questions
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          {[
            {
              q: 'Do I need to have completed Pilates Physics 101 first?',
              a: 'Yes. PP-101 establishes the mechanical vocabulary and framework the cohort builds on. If you haven\'t taken it yet, you can add PP-101 to your PP-301 purchase and complete it before the cohort starts.',
            },
            {
              q: 'What\'s the time commitment per week?',
              a: 'Plan on about 2 hours a week between lectures and case study homework: the live group call runs 2 hours every other week, with homework in the off weeks. Add your monthly 1:1 call on top of that.',
            },
            {
              q: 'What if I don\'t have access to a tower or chair?',
              a: 'Reformer-only access works for most of the program, but the chair and tower segments are richer if you can get hands-on. If you have access to a studio for a few hours a month, that\'s usually enough.',
            },
            {
              q: 'How are applicants selected?',
              a: 'I read every application personally. Admissions are rolling, with a cap of 12 in the cohort, so applying earlier helps your chances. The program is best suited for instructors who have been teaching full-time for at least a year and have at least 2 regular private clients. But the content scales across experience level well, so whether you\'ve been teaching for 2 years or 10, you\'ll get a new lens to look at your teaching through.',
            },
            {
              q: 'When does the next cohort start, and when do applications close?',
              a: 'The next cohort runs August 17 – November 19, 2026. Applications close July 19, 2026, and are reviewed on a rolling basis.',
            },
            {
              q: 'What time will the lectures be?',
              a: 'Lecture times will be scheduled based on a schedule survey of cohort members after selection. I understand life and business can be intense, and sometimes you won\'t be able to make a lecture live. That\'s why they\'re all recorded. But to get the most out of the program, live attendance is highly recommended.',
            },
            {
              q: 'When do I need to pay?',
              a: 'Invoices will be sent out on August 1, 2026, for your preferred payment plan. You have the choice to pay one upfront payment of $1,500, or pay $600 per month for 3 months.',
            },
            {
              q: 'Are there NCPC CECs available?',
              a: 'I am working on getting this approved for CECs. Stay tuned. I can help you petition for CEC\'s from other organizing bodies.',
            },
          ].map((item, i) => (
            <details
              key={i}
              className="faq-item"
              style={{
                borderBottom: '1px solid var(--color-rule)',
              }}
            >
              <summary
                className="faq-summary"
                style={{
                  padding: '1.5rem 0',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1.5rem',
                }}
              >
                <h3
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '1.1rem',
                    color: 'var(--color-ink)',
                    margin: 0,
                  }}
                >
                  {item.q}
                </h3>
                <span
                  className="faq-icon"
                  aria-hidden="true"
                  style={{
                    fontSize: '1.5rem',
                    color: 'var(--color-accent)',
                    lineHeight: 1,
                    flexShrink: 0,
                    fontWeight: 300,
                    transition: 'transform 0.2s ease',
                  }}
                >
                  +
                </span>
              </summary>
              <p
                style={{
                  fontSize: '0.95rem',
                  lineHeight: '1.7',
                  color: 'var(--color-ink-muted)',
                  margin: 0,
                  maxWidth: '680px',
                  paddingBottom: '1.5rem',
                }}
              >
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </Section>

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
                fontFamily: 'var(--font-serif)',
                fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)',
                lineHeight: '1.2',
                color: 'var(--color-ink)',
                margin: '0 0 1rem',
              }}
            >
              Ready to apply?
            </h2>
            <p
              style={{
                fontSize: '1rem',
                lineHeight: '1.65',
                color: 'var(--color-ink-muted)',
                margin: 0,
              }}
            >
              Three months. A small cohort. Real homework, real feedback, and the
              tools to make physics-based decisions every day in the studio.
            </p>
          </div>

          <Link to="/pilates-physics-301/apply" style={primaryButtonStyle}>Apply now</Link>
        </div>
      </section>

      {/* Responsive styles */}
      <style>{`
        .faq-summary {
          list-style: none;
        }
        .faq-summary::-webkit-details-marker {
          display: none;
        }
        .faq-item[open] .faq-icon {
          transform: rotate(45deg);
        }
        @media (max-width: 900px) {
          .who-grid {
            grid-template-columns: 1fr !important;
          }
          .quotes-grid {
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
            gap: 1.25rem !important;
          }
          .apply-cta-banner {
            padding: 1.75rem !important;
          }
        }
      `}</style>
    </div>
  )
}
