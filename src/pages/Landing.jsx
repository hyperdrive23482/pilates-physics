import WaitlistForm from '../components/ui/WaitlistForm'
import InteractiveSpringDiagram from '../components/ui/InteractiveSpringDiagram'
import TestimonialCarousel from '../components/ui/TestimonialCarousel'

const testimonials = [
  { src: '/images/homepage/insta-testimonial-1.jpg', alt: 'Testimonial 1' },
  { src: '/images/homepage/insta-testimonial-2.jpg', alt: 'Testimonial 2' },
  { src: '/images/homepage/insta-testimonial-3.jpg', alt: 'Testimonial 3' },
  { src: '/images/homepage/insta-testimonial-4.jpg', alt: 'Testimonial 4' },
  { src: '/images/homepage/insta-testimonial-5.jpg', alt: 'Testimonial 5' },
  { src: '/images/homepage/insta-testimonial-6.jpg', alt: 'Testimonial 6' },
  { src: '/images/homepage/insta-testimonial-7.jpg', alt: 'Testimonial 7' },
]

// ─── Section wrapper ──────────────────────────────────────────────────────────
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

// ─── Horizontal rule ──────────────────────────────────────────────────────────
function Rule() {
  return (
    <hr style={{ border: 'none', borderTop: '1px solid var(--color-rule)', margin: 0 }} />
  )
}

// ─── Landing page ─────────────────────────────────────────────────────────────
export default function Landing() {
  return (
    <div>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section
        style={{
          borderBottom: '1px solid var(--color-rule)',
          backgroundImage: 'url(/images/homepage/hero-image.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          position: 'relative',
        }}
      >
        {/* Dark overlay for text readability */}
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
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '4rem',
            alignItems: 'center',
          }}
          className="hero-grid"
        >
          {/* Left: copy */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            <div>
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
                Pilates Physics
              </p>
              <h1
                style={{
                  fontFamily: '"DM Serif Display", serif',
                  fontSize: 'clamp(2rem, 4vw, 3rem)',
                  lineHeight: '1.15',
                  color: 'var(--color-ink)',
                  margin: 0,
                }}
              >
                Pilates through the physics lens.
              </h1>
            </div>

            <p
              style={{
                fontSize: '1.1rem',
                lineHeight: '1.65',
                color: 'var(--color-ink-muted)',
                margin: 0,
              }}
            >
              Join me for a live webinar on May 20th to learn about easy, science-based principles even the most math-averse instructor can grasp.
            </p>

            <WaitlistForm compact />

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

          {/* Right: diagram */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.75rem',
            }}
          >
            <InteractiveSpringDiagram />
            <p
              style={{
                fontSize: '0.75rem',
                color: 'var(--color-ink-muted)',
                textAlign: 'center',
                maxWidth: '320px',
              }}
            >
              Spring force scales with extension. Drag to feel how resistance changes across the range of motion.
            </p>
          </div>
        </div>
      </section>

      <Rule />

      {/* ── The Problem ──────────────────────────────────────────────────── */}
      <Section>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 2fr',
            gap: '4rem',
            alignItems: 'start',
          }}
          className="two-col-grid"
        >
          <div>
            <h2
              style={{
                fontFamily: '"DM Serif Display", serif',
                fontSize: 'clamp(1.5rem, 3vw, 2.25rem)',
                lineHeight: '1.2',
                color: 'var(--color-ink)',
                margin: 0,
              }}
            >
              Memorizing settings isn't the same as understanding them
            </h2>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
              fontSize: '1rem',
              lineHeight: '1.75',
              color: 'var(--color-ink-muted)',
            }}
          >
            <p style={{ margin: 0 }}>
              Most Pilates training gives you a table: this exercise, this spring setting, this
              position. The table works — until you're in front of a client whose proportions,
              strength, or history don't match the model the table was built around. Then you
              guess. You adjust by feel. You wonder, quietly, whether you actually understand
              what you're doing.
            </p>
            <p style={{ margin: 0 }}>
              That gap — between knowing what to do and knowing why it works — is exactly where
              this webinar lives. It won't replace your training. It will make everything in your
              training make sense.
            </p>
          </div>
        </div>
      </Section>

      <Rule />

      {/* ── What This Course Does ─────────────────────────────────────────── */}
      <Section style={{ background: 'var(--color-surface)' }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '3rem',
          }}
        >
          <h2
            style={{
              fontFamily: '"DM Serif Display", serif',
              fontSize: 'clamp(1.5rem, 3vw, 2.25rem)',
              lineHeight: '1.2',
              color: 'var(--color-ink)',
              margin: 0,
              maxWidth: '560px',
            }}
          >
            What you'll learn in two hours
          </h2>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '0',
              borderTop: '1px solid var(--color-rule)',
            }}
            className="value-grid"
          >
            {[
              {
                number: '01',
                body: 'Why springs get heavier as they stretch — and what that means for clients of different sizes, strengths, and movement histories.',
              },
              {
                number: '02',
                body: 'How equipment settings change the force environment, not just the difficulty. Spring count, footbar height, rope length — each one shifts what the body is actually asked to do.',
              },
              {
                number: '03',
                body: 'A transferable framework for any exercise, any reformer, any client. Not a new table to memorize — a way of reading movement mechanically.',
              },
            ].map((item, i) => (
              <div
                key={item.number}
                style={{
                  padding: '2rem',
                  borderRight: i < 2 ? '1px solid var(--color-rule)' : 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                }}
                className="value-card"
              >
                <span
                  style={{
                    fontFamily: '"DM Serif Display", serif',
                    fontSize: '2rem',
                    color: 'var(--color-rule)',
                    lineHeight: 1,
                  }}
                >
                  {item.number}
                </span>
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
        </div>
      </Section>

      <Rule />

      {/* ── About the Instructor ──────────────────────────────────────────── */}
      <Section>
        <div
          className="instructor-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'auto 1fr',
            gap: '2.5rem',
            alignItems: 'center',
          }}
        >
          <img
            src="/images/homepage/kaleen-shop.jpg"
            alt="Kaleen Canevari"
            style={{
              width: '180px',
              height: '180px',
              borderRadius: '50%',
              objectFit: 'cover',
              display: 'block',
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div>
              <h2
                style={{
                  fontFamily: '"DM Serif Display", serif',
                  fontSize: 'clamp(1.25rem, 2.5vw, 1.75rem)',
                  lineHeight: '1.2',
                  color: 'var(--color-ink)',
                  margin: '0 0 0.35rem',
                }}
              >
                Meet your instructor
              </h2>
              <p
                style={{
                  fontSize: '0.7rem',
                  fontWeight: '600',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'var(--color-accent)',
                  margin: 0,
                }}
              >
                Kaleen Canevari — Mechanical engineer &amp; Pilates instructor
              </p>
            </div>
            <p
              style={{
                fontSize: '0.95rem',
                lineHeight: '1.7',
                color: 'var(--color-ink-muted)',
                margin: 0,
                maxWidth: '540px',
              }}
            >
              Kaleen came to Pilates through engineering, not the other way around.  She has been designing and teaching on Pilates equipment since 2013 across multiple companies and studios.  Pilates Physics closes the gap between how this equipment was designed and how most of us were taught to use it.
            </p>
            <a
              href="/about"
              style={{
                color: 'var(--color-accent)',
                fontSize: '0.85rem',
                fontWeight: '500',
                textDecoration: 'none',
              }}
            >
              Learn more →
            </a>
          </div>
        </div>
      </Section>

      <Rule />

      {/* ── Praise / Testimonials ─────────────────────────────────────────── */}
      <Section>
        <h2
          style={{
            fontFamily: '"DM Serif Display", serif',
            fontSize: 'clamp(1.5rem, 3vw, 2.25rem)',
            lineHeight: '1.2',
            color: 'var(--color-ink)',
            margin: '0 0 2.5rem',
            textAlign: 'center',
          }}
        >
          Praise for Kaleen's work
        </h2>
        <TestimonialCarousel images={testimonials} />
      </Section>

      <Rule />

      {/* ── Waitlist CTA (repeat) ────────────────────────────────────────── */}
      <section style={{ background: 'var(--color-accent-light)' }}>
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
              Whether you've been teaching for a year or ten, this webinar gives you a mechanical
              framework for the questions you already have. Join the waitlist and we'll notify you
              when registration opens.
            </p>
          </div>

          <WaitlistForm compact style={{ width: '100%' }} />

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

      {/* Inline responsive styles */}
      <style>{`
        @media (max-width: 900px) {
          .hero-grid {
            grid-template-columns: 1fr !important;
          }
          .two-col-grid {
            grid-template-columns: 1fr !important;
            gap: 2rem !important;
          }
          .value-grid {
            grid-template-columns: 1fr !important;
          }
          .value-card {
            border-right: none !important;
            border-bottom: 1px solid var(--color-rule);
          }
          .value-card:last-child {
            border-bottom: none;
          }
          .carousel-arrow {
            display: none !important;
          }
          .instructor-grid {
            grid-template-columns: 1fr !important;
            justify-items: center;
            text-align: center;
          }
        }
        @media (max-width: 600px) {
          .testimonial-scroll img {
            height: 100px !important;
            width: 250px !important;
          }
        }
      `}</style>
    </div>
  )
}
