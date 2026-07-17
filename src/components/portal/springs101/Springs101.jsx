import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import springSpecs from '../../../data/springSpecs.json'
import SpringCoilIllustration from './SpringCoilIllustration'

const sectionLabelStyle = {
  fontSize: '0.7rem',
  textTransform: 'uppercase',
  letterSpacing: '0.15em',
  color: 'var(--color-ink-muted)',
  marginBottom: '1rem',
}

const proseStyle = {
  fontSize: '0.95rem',
  lineHeight: '1.75',
  color: 'var(--color-ink-muted)',
  margin: '0 0 1.1rem',
}

const strongStyle = { color: 'var(--color-ink)', fontWeight: 600 }

function Prose({ children }) {
  return <p style={proseStyle}>{children}</p>
}

function Section({ label, children }) {
  return (
    <section style={{ marginBottom: '3rem' }}>
      <h2 style={sectionLabelStyle}>{label}</h2>
      {children}
    </section>
  )
}

// Pull the Peak vs Align contrast numbers from the specs at render time so
// the prose never drifts from the calculator's data.
function reformerBrand(id) {
  return springSpecs.apparatuses
    .find((a) => a.id === 'reformer')
    .brands.find((b) => b.id === id)
}

export default function Springs101() {
  const peakRed = reformerBrand('peak-pilates').springs.find((s) => s.color === 'red')
  const alignGreen = reformerBrand('align-pilates').springs.find((s) => s.color === 'green')
  const bbRed = reformerBrand('balanced-body').springs.find((s) => s.color === 'red')
  const reformerTravel = springSpecs.apparatuses.find((a) => a.id === 'reformer').maxTravel
  const alignGreenEnd = Math.round(alignGreen.b + alignGreen.k * reformerTravel)
  const bbRedEnd = Math.round(bbRed.b + bbRed.k * reformerTravel)

  return (
    <div style={{ maxWidth: '760px', margin: '0 auto' }}>
      <p
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: '1.35rem',
          lineHeight: '1.5',
          color: 'var(--color-ink)',
          margin: '0 0 3rem',
        }}
      >
        A red spring is not a thing. Not really. A spring is not one weight, and no two brands
        build theirs alike. This primer covers the physics you need to read any spring, on any
        machine, from any manufacturer.
      </p>

      <Section label="A spring is a slope, not a number">
        <Prose>
          We talk about springs the way we talk about dumbbells. A 10 pound dumbbell is 10 pounds
          wherever you hold it, so we assume "two reds and a blue" is a fixed amount of resistance
          you can carry from studio to studio. It is not. A spring gets heavier the more you
          stretch it. Its resistance is not a single value, it is a line that climbs.
        </Prose>
        <div
          className="pp-card"
          style={{
            padding: '1.5rem 2rem',
            margin: '0 0 1.1rem',
            textAlign: 'center',
            fontFamily: '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
            fontSize: '1.05rem',
            color: 'var(--color-ink)',
          }}
        >
          Force = (k × stretch) + b
        </div>
        <Prose>
          <span style={strongStyle}>b</span> is the starting tension, the load the spring already
          pulls before the carriage moves. <span style={strongStyle}>k</span> is the rate, how fast
          the load climbs for every inch of travel. <span style={strongStyle}>Stretch</span> is how
          far the spring is pulled, which depends on the movement and the machine. A Balanced Body
          red runs from about {bbRed.b} pounds at engagement to about {bbRedEnd} pounds at full
          stretch. Same spring, same rep, several times heavier at the end than at the start.
        </Prose>
      </Section>

      <Section label="Two numbers define every spring">
        <Prose>
          Brands separate themselves with two design choices: how much starting tension they build
          in, and how steeply the load climbs. Peak is the high starting tension brand. A Peak red
          already pulls about {peakRed.b} pounds at the home position, more than double a Balanced
          Body red at {bbRed.b}, but its line climbs gently from there. Align is the opposite. Its
          springs start light, then ramp hard. Its strong green starts near {alignGreen.b} pounds
          and finishes around {alignGreenEnd}, higher than anything else in its class.
        </Prose>
        <Prose>
          Two springs can match in the middle of the stroke and disagree at both ends. That is why
          no single number, and no color, can tell you what a spring does.
        </Prose>
      </Section>

      <Section label="The colors are just paint">
        <Prose>
          Green is the heaviest spring Balanced Body and Align make, and the lightest spring Peak
          makes. Yellow is the lightest spring on a Balanced Body and a middle spring on a Peak.
          Red is a medium for Balanced Body, Align, and Merrithew, but a heavy for Peak and BASI.
          The colors are not a language. They are just paint. When a client says they "used a red
          spring" somewhere else, the honest answer is: it depends on the machine.
        </Prose>
      </Section>

      <Section label="The spring lineups">
        <Prose>
          Here is every spring in the calculator's dataset, brand by brand, drawn to a common
          scale. Thicker wire means a steeper rate, so a thicker coil loads faster as it
          stretches. The stat line under each spring gives its starting tension and its rate.
        </Prose>
        {springSpecs.apparatuses.map((apparatus) => {
          const maxK = Math.max(
            ...apparatus.brands.flatMap((brand) => brand.springs.map((s) => s.k))
          )
          return (
            <div key={apparatus.id} style={{ marginBottom: '2.5rem' }}>
              <h3
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '1.35rem',
                  color: 'var(--color-ink)',
                  margin: '0 0 1.25rem',
                }}
              >
                {apparatus.name}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {apparatus.brands.map((brand) => (
                  <div key={brand.id} className="pp-card" style={{ padding: '1.5rem' }}>
                    <h4 style={{ ...sectionLabelStyle, marginBottom: '1.25rem' }}>{brand.name}</h4>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                        gap: '1.5rem 2rem',
                      }}
                    >
                      {brand.springs.map((spring) => (
                        <SpringCoilIllustration
                          key={spring.color}
                          spring={spring}
                          maxK={maxK}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </Section>

      <Section label="About conversion charts">
        <Prose>
          People always want the cheat sheet: what is a Balanced Body red on a Merrithew?
          Conversion charts are genuinely useful for getting in the ballpark when you switch
          equipment, but know what they are. A chart picks one point in the stretch and says
          "these match there." Because every spring has its own starting tension and its own rate,
          springs that match in the middle will not match at the ends. A conversion chart is a
          translator, not a guarantee. It gets you close. It does not make two springs equal.
        </Prose>
      </Section>

      <Section label="Same springs, different machine">
        <Prose>
          Even identical springs on two different machines will not feel the same. Go back to the
          model: force depends on stretch, and stretch is set by the machine, not the spring.
          Carriage travel, where the spring anchors, rope length, pulley height, footbar position:
          all of it changes how far a given movement actually stretches the spring. Same spring,
          different load. That is why you cannot teach from the spring setting alone, and it is
          why the calculator lets you drag through the stroke and read the load at any point.
        </Prose>
      </Section>

      <div
        className="pp-card"
        style={{
          padding: '2rem',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem',
        }}
      >
        <h2
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '1.35rem',
            color: 'var(--color-ink)',
            margin: 0,
          }}
        >
          See it move
        </h2>
        <p style={{ ...proseStyle, margin: 0, maxWidth: '480px' }}>
          The Spring Load Calculator charts every spring on this page. Pick a brand, stack
          springs, and drag through the stroke to read the load at any point.
        </p>
        <Link to="/portal/spring-load-calculator" className="pp-btn pp-btn--primary">
          Open the calculator <ArrowRight size={16} />
        </Link>
        <p style={{ ...proseStyle, margin: 0, fontSize: '0.85rem' }}>
          Want the full picture, from spring physics to machine setup?{' '}
          <Link to="/pilates-physics-101" style={{ color: 'var(--color-accent)' }}>
            Explore Pilates Physics 101
          </Link>
        </p>
      </div>
    </div>
  )
}
