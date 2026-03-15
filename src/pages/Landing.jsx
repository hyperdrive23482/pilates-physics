import { useNavigate } from 'react-router-dom'
import EmailCapture from '../components/ui/EmailCapture'
import ModuleCard from '../components/ui/ModuleCard'
import { modules } from '../utils/courseData'

// ─── Spring Force Diagram SVG ─────────────────────────────────────────────────
// Illustrates F = kx: spring force increases linearly with extension.
// A reformer spring is not constant-load — it gets heavier as you move.
function SpringDiagram() {
  return (
    <svg
      viewBox="0 0 480 280"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Force diagram: spring resistance increases with extension"
      style={{ width: '100%', maxWidth: '480px' }}
    >
      {/* Grid lines */}
      {[60, 100, 140, 180, 220].map((y) => (
        <line key={y} x1="60" y1={y} x2="420" y2={y} stroke="#2E2B26" strokeWidth="1" />
      ))}
      {[120, 180, 240, 300, 360].map((x) => (
        <line key={x} x1={x} y1="40" x2={x} y2="240" stroke="#2E2B26" strokeWidth="1" />
      ))}

      {/* Axes */}
      <line x1="60" y1="240" x2="420" y2="240" stroke="#F1EFE8" strokeWidth="1.5" />
      <line x1="60" y1="40" x2="60" y2="240" stroke="#F1EFE8" strokeWidth="1.5" />

      {/* Axis labels */}
      <text x="240" y="270" textAnchor="middle" fill="#888780" fontSize="11" fontFamily="DM Sans, sans-serif">
        Spring extension
      </text>
      <text
        x="18"
        y="140"
        textAnchor="middle"
        fill="#888780"
        fontSize="11"
        fontFamily="DM Sans, sans-serif"
        transform="rotate(-90, 18, 140)"
      >
        Force (N)
      </text>

      {/* Constant weight reference line — horizontal */}
      <line x1="60" y1="160" x2="420" y2="160" stroke="#888780" strokeWidth="1.5" strokeDasharray="6 4" />
      <text x="424" y="164" fill="#888780" fontSize="10" fontFamily="DM Sans, sans-serif">
        Weight
      </text>

      {/* Spring force line — F = kx (diagonal) */}
      <line x1="60" y1="240" x2="420" y2="55" stroke="#EF9F27" strokeWidth="2" />

      {/* Spring force label */}
      <text x="340" y="88" fill="#EF9F27" fontSize="10" fontFamily="DM Sans, sans-serif" fontWeight="600">
        Spring (F = kx)
      </text>

      {/* Intersection dot */}
      <circle cx="230" cy="160" r="3.5" fill="#EF9F27" />

      {/* Annotation: crossover point */}
      <line x1="230" y1="160" x2="230" y2="195" stroke="#EF9F27" strokeWidth="1" strokeDasharray="3 3" />
      <text x="232" y="208" fill="#EF9F27" fontSize="9.5" fontFamily="DM Sans, sans-serif">
        Heavier than
      </text>
      <text x="232" y="220" fill="#EF9F27" fontSize="9.5" fontFamily="DM Sans, sans-serif">
        bodyweight here
      </text>

      {/* Tick marks — x axis */}
      {[120, 180, 240, 300, 360].map((x, i) => (
        <g key={x}>
          <line x1={x} y1="240" x2={x} y2="246" stroke="#F1EFE8" strokeWidth="1" />
          <text x={x} y="258" textAnchor="middle" fill="#888780" fontSize="9" fontFamily="DM Sans, sans-serif">
            {(i + 1) * 5}&quot;
          </text>
        </g>
      ))}
    </svg>
  )
}

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
  const navigate = useNavigate()

  function handleEnrollSuccess() {
    navigate('/course')
  }

  return (
    <div>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section
        style={{
          borderBottom: '1px solid var(--color-rule)',
        }}
      >
        <div
          style={{
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
                Free Course — Pilates Physics
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
                Most Pilates instructors were taught what to do. This course teaches you why it works.
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
              So you can adapt to any body, on any equipment, without second-guessing yourself.
            </p>

            <EmailCapture onSuccess={handleEnrollSuccess} />

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

          {/* Right: diagram */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.75rem',
            }}
          >
            <SpringDiagram />
            <p
              style={{
                fontSize: '0.75rem',
                color: 'var(--color-ink-muted)',
                textAlign: 'center',
                maxWidth: '320px',
              }}
            >
              Spring force scales with extension. A weight stack does not. Understanding this difference
              changes how you program.
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
              The conventions we inherited weren't derived from first principles. Joe built his
              apparatus around the materials available in the 1940s — leather straps, bushing
              wheels, hand-wound springs. The physics of those decisions have never changed. The
              reasons behind them were rarely taught. So we've been passing down outcomes
              without mechanisms, and calling that expertise.
            </p>
            <p style={{ margin: 0 }}>
              That gap — between knowing what to do and knowing why it works — is exactly where
              this course lives. It won't replace your training. It will make everything in your
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
            You'll learn the mechanics behind the decisions
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

      {/* ── Module Preview ───────────────────────────────────────────────── */}
      <Section>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <h2
              style={{
                fontFamily: '"DM Serif Display", serif',
                fontSize: 'clamp(1.5rem, 3vw, 2.25rem)',
                lineHeight: '1.2',
                color: 'var(--color-ink)',
                margin: 0,
              }}
            >
              Four modules. One through-line.
            </h2>
            <p
              style={{
                fontSize: '0.875rem',
                color: 'var(--color-ink-muted)',
                margin: 0,
              }}
            >
              Start at Module 1. Each builds on the previous one.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '1.5rem',
            }}
            className="module-grid"
          >
            {modules.map((mod) => (
              <ModuleCard key={mod.id} module={mod} />
            ))}
          </div>
        </div>
      </Section>

      <Rule />

      {/* ── Email Capture (repeat) ───────────────────────────────────────── */}
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
              Free. No prerequisites. Built for working instructors.
            </h2>
            <p
              style={{
                fontSize: '1rem',
                lineHeight: '1.65',
                color: 'var(--color-ink-muted)',
                margin: 0,
              }}
            >
              If you've been teaching for a year or ten, this course gives you a framework
              for the questions you already have. Enter your email and start immediately.
            </p>
          </div>

          <EmailCapture onSuccess={handleEnrollSuccess} style={{ width: '100%' }} />

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
          .module-grid {
            grid-template-columns: repeat(2, 1fr) !important;
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
        }
        @media (max-width: 540px) {
          .module-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}
