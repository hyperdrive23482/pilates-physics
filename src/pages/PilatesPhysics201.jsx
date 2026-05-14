import { useState } from 'react'
import { Link } from 'react-router-dom'

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

const labelStyle = {
  display: 'block',
  fontSize: '0.78rem',
  fontWeight: '500',
  color: 'var(--color-ink-muted)',
  marginBottom: '0.375rem',
}

const inputStyle = {
  width: '100%',
  padding: '0.75rem 1rem',
  fontSize: '0.9rem',
  fontFamily: '"DM Sans", sans-serif',
  border: '1px solid var(--color-rule)',
  background: 'var(--color-bg)',
  color: 'var(--color-ink)',
  outline: 'none',
  boxSizing: 'border-box',
}

const EQUIPMENT_OPTIONS = ['Reformer', 'Tower', 'Chair', 'Cadillac', 'Other']

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

export default function PilatesPhysics201() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [city, setCity] = useState('')
  const [yearsTeaching, setYearsTeaching] = useState('')
  const [equipment, setEquipment] = useState([])
  const [completedPP101, setCompletedPP101] = useState('')
  const [whyInterested, setWhyInterested] = useState('')
  const [whatHope, setWhatHope] = useState('')
  const [website, setWebsite] = useState('')
  const [status, setStatus] = useState('idle')
  const [errorMsg, setErrorMsg] = useState('')

  function toggleEquipment(option) {
    setEquipment((prev) =>
      prev.includes(option) ? prev.filter((x) => x !== option) : [...prev, option]
    )
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (equipment.length === 0) {
      setErrorMsg('Please select at least one piece of equipment.')
      setStatus('error')
      return
    }
    setStatus('loading')
    setErrorMsg('')

    try {
      const res = await fetch('/api/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'application',
          name,
          email,
          city,
          yearsTeaching,
          equipment,
          completedPP101,
          whyInterested,
          whatHope,
          website,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Something went wrong. Try again.')
      setStatus('success')
    } catch (err) {
      setErrorMsg(err.message || 'Something went wrong. Try again.')
      setStatus('error')
    }
  }

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
                fontFamily: '"DM Serif Display", serif',
                fontSize: 'clamp(2rem, 4vw, 3rem)',
                lineHeight: '1.15',
                color: 'var(--color-ink)',
                margin: '0 0 1.5rem',
              }}
            >
              Pilates Physics 201
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
              Pilates equipment — with group lectures, homework you actually get
              feedback on, and one private mentoring call every month.
            </p>

            <a href="#apply" style={primaryButtonStyle}>Apply now</a>

            <p
              style={{
                fontSize: '0.78rem',
                color: 'var(--color-ink-muted)',
                marginTop: '1rem',
              }}
            >
              By application — limited cohort.
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
          For instructors who...
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
              text: 'Have completed Pilates Physics 101 (or have an equivalent background in mechanics)',
            },
            {
              number: '2',
              text: 'Want to apply physics to chair and tower — not just the reformer',
            },
            {
              number: '3',
              text: 'Are ready to commit to three months of group calls, homework, and 1:1 mentoring',
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
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Rule />

      {/* ── Program Structure ────────────────────────────────────────────── */}
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
            Six group sessions, monthly 1:1 calls, and hands-on homework with
            individual feedback — built around your teaching life.
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
                body: 'Two hours of live lecture and discussion every two weeks — six sessions across the cohort. Bring questions from your week of teaching.',
              },
              {
                number: '02',
                title: 'Homework & Virtual Review',
                body: 'Practical assignments between sessions — applied to your own clients and equipment. Submit work, get individual feedback.',
              },
              {
                number: '03',
                title: '1:1 Mentoring',
                body: 'One private call per month — your clients, your studio, your edge cases. Three calls across the program.',
              },
              {
                number: '04',
                title: 'Small Cohort',
                body: 'A limited group means real discussion and real feedback. Application-based so the cohort is matched on experience and goals.',
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

      {/* ── What You'll Learn ────────────────────────────────────────────── */}
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
              desc: 'Move past intuition. Build and read free-body diagrams for the exercises you teach — so you can predict how a setup will load a body before the client gets on the equipment.',
            },
            {
              label: 'Chair & Tower Physics',
              desc: 'The reformer is well-trodden ground. The chair and the tower behave very differently — different geometry, different load paths. We dig into both.',
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

      {/* ── Details & Apply ──────────────────────────────────────────────── */}
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
                { label: 'Duration', value: '3 months' },
                { label: 'Group lectures', value: '2 hours every 2 weeks (six sessions)' },
                { label: 'Format', value: 'Live via Zoom, recordings included' },
                { label: '1:1 mentoring', value: 'One private call per month' },
                { label: 'Homework', value: 'Practical assignments with virtual review' },
                { label: 'Investment', value: 'By application' },
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
          </div>

          <div
            id="apply"
            style={{
              background: 'var(--color-surface)',
              padding: '2.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem',
              scrollMarginTop: '5rem',
            }}
          >
            <div>
              <h3
                style={{
                  fontFamily: '"DM Serif Display", serif',
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
                Tell me about your teaching, what you're hoping to get from PP-201,
                and your equipment access. I review every application personally —
                you'll hear back within a week.
              </p>
            </div>

            {status === 'success' ? (
              <div>
                <p
                  style={{
                    fontFamily: '"DM Serif Display", serif',
                    fontSize: '1.25rem',
                    color: 'var(--color-accent)',
                    marginBottom: '0.75rem',
                  }}
                >
                  Thanks — your application is in.
                </p>
                <p style={{ fontSize: '0.9rem', color: 'var(--color-ink-muted)', margin: 0 }}>
                  I review every application personally. Expect a reply within a week.
                  Check your inbox for a confirmation email.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label style={labelStyle}>Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={status === 'loading'}
                    maxLength={200}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={status === 'loading'}
                    maxLength={320}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>City / region</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    disabled={status === 'loading'}
                    maxLength={200}
                    placeholder="Helps me gauge timezone for the cohort"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Years teaching Pilates</label>
                  <select
                    required
                    value={yearsTeaching}
                    onChange={(e) => setYearsTeaching(e.target.value)}
                    disabled={status === 'loading'}
                    style={inputStyle}
                  >
                    <option value="">Select one…</option>
                    <option value="<1">Less than 1 year</option>
                    <option value="1-3">1–3 years</option>
                    <option value="3-7">3–7 years</option>
                    <option value="7+">7+ years</option>
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>Equipment you have regular access to</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.25rem' }}>
                    {EQUIPMENT_OPTIONS.map((option) => (
                      <label
                        key={option}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          fontSize: '0.9rem',
                          color: 'var(--color-ink)',
                          cursor: status === 'loading' ? 'wait' : 'pointer',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={equipment.includes(option)}
                          onChange={() => toggleEquipment(option)}
                          disabled={status === 'loading'}
                          style={{ accentColor: 'var(--color-accent)' }}
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Have you completed PP-101?</label>
                  <select
                    required
                    value={completedPP101}
                    onChange={(e) => setCompletedPP101(e.target.value)}
                    disabled={status === 'loading'}
                    style={inputStyle}
                  >
                    <option value="">Select one…</option>
                    <option value="yes">Yes</option>
                    <option value="equivalent">No, but I have equivalent background</option>
                    <option value="no">No</option>
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>Why are you interested in PP-201?</label>
                  <textarea
                    required
                    value={whyInterested}
                    onChange={(e) => setWhyInterested(e.target.value)}
                    disabled={status === 'loading'}
                    maxLength={2000}
                    rows={4}
                    style={{ ...inputStyle, resize: 'vertical', fontFamily: '"DM Sans", sans-serif' }}
                  />
                </div>

                <div>
                  <label style={labelStyle}>What do you hope to get out of it?</label>
                  <textarea
                    required
                    value={whatHope}
                    onChange={(e) => setWhatHope(e.target.value)}
                    disabled={status === 'loading'}
                    maxLength={2000}
                    rows={4}
                    style={{ ...inputStyle, resize: 'vertical', fontFamily: '"DM Sans", sans-serif' }}
                  />
                </div>

                <input
                  type="text"
                  name="website"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  style={{ display: 'none' }}
                />

                <button
                  type="submit"
                  disabled={status === 'loading'}
                  style={{
                    ...primaryButtonStyle,
                    width: '100%',
                    cursor: status === 'loading' ? 'wait' : 'pointer',
                  }}
                >
                  {status === 'loading' ? 'Sending…' : 'Submit application'}
                </button>

                {status === 'error' && (
                  <p style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#e06c75' }}>
                    {errorMsg}
                  </p>
                )}
              </form>
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

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
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

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          {[
            {
              q: 'Do I need to have completed PP-101 first?',
              a: 'It helps. PP-101 establishes the mechanical vocabulary the cohort uses. If you haven\'t taken it but have an equivalent background — engineering, physics, or another mechanics-heavy training — say so on your application and we can talk.',
            },
            {
              q: 'What\'s the time commitment per week?',
              a: 'Plan on the live group call (2 hours every other week), plus a few hours of homework in the off weeks, plus your monthly 1:1 call. Most people land around 2–4 hours per week on average.',
            },
            {
              q: 'What if I don\'t have access to a tower or chair?',
              a: 'Reformer-only access works for most of the program, but the chair and tower segments are richer if you can get hands-on. If you have access to a studio for a few hours a month, that\'s usually enough.',
            },
            {
              q: 'How are applicants selected?',
              a: 'I read every application personally. The cohort is matched on experience and goals so the discussion is productive for everyone — not first-come-first-served.',
            },
            {
              q: 'What\'s the investment?',
              a: 'Pricing is shared once your application is reviewed and we\'ve confirmed it\'s a good fit. Payment plans are available.',
            },
            {
              q: 'When does the next cohort start?',
              a: 'I run cohorts two to three times a year. Apply now to be considered for the next start date — I\'ll share the exact dates when I reach back out.',
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

          <a href="#apply" style={primaryButtonStyle}>Apply now</a>
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
