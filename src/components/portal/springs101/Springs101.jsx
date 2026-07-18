import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import springSpecs from '../../../data/springSpecs.json'
import SpringBrandGraph from './SpringBrandGraph'
import { GraphPartsFigure, ReadOffFigure } from './GraphReadingGuide'
import ConversionChart from './ConversionChart'
import { CONVERSION_CHARTS } from './conversionData'
import { UNITS, UNIT_OPTIONS, forceValue, lengthValue, niceMaxForce } from './graphUtils'

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

// Same visual pattern as the calculator's segmented radiogroup.
function UnitToggle({ value, onChange }) {
  return (
    <div
      style={{
        display: 'inline-flex',
        border: '1px solid var(--color-rule)',
        borderRadius: '2px',
        background: 'var(--color-bg)',
      }}
      role="radiogroup"
      aria-label="Units"
    >
      {UNIT_OPTIONS.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            style={{
              padding: '0.5rem 1rem',
              fontSize: '0.8rem',
              fontFamily: 'var(--font-serif)',
              fontWeight: '500',
              letterSpacing: '0.02em',
              color: active ? 'var(--color-accent-ink)' : 'var(--color-ink-muted)',
              background: active ? 'var(--color-accent)' : 'transparent',
              border: 'none',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
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
  const [unit, setUnit] = useState('imperial')
  const forceUnit = UNITS[unit].force
  const fmtForce = (lbs) => `${Math.round(forceValue(lbs, unit))} ${forceUnit}`
  const fmtLength = (inch) =>
    unit === 'metric' ? `${Math.round(lengthValue(inch, unit))} cm` : `${inch} inches`

  const peakRed = reformerBrand('peak-pilates').springs.find((s) => s.color === 'red')
  const alignGreen = reformerBrand('align-pilates').springs.find((s) => s.color === 'green')
  const bbRed = reformerBrand('balanced-body').springs.find((s) => s.color === 'red')
  const reformerTravel = springSpecs.apparatuses.find((a) => a.id === 'reformer').maxTravel
  const alignGreenEnd = alignGreen.b + alignGreen.k * reformerTravel
  const bbRedEnd = bbRed.b + bbRed.k * reformerTravel

  return (
    <div style={{ maxWidth: '760px', margin: '0 auto' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          flexWrap: 'wrap',
          marginBottom: '2rem',
        }}
      >
        <span style={{ ...sectionLabelStyle, marginBottom: 0 }}>Units</span>
        <UnitToggle value={unit} onChange={setUnit} />
      </div>

      <p
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: '1.35rem',
          lineHeight: '1.5',
          color: 'var(--color-ink)',
          margin: '0 0 3rem',
        }}
      >
        A single spring is not a single weight. I wish it was! I really do! Our teaching lives
        would be simpler. But, we trade that simplicity for uniqueness, practicality, and even some
        biomechanical advantage. This primer covers the physics you need to understand how your
        Pilates springs work, on any machine, from any manufacturer.
      </p>

      <Section label="A spring is a range of weights, not a single one">
        <Prose>
          We want to talk about springs the way we talk about dumbbells. A 10 pound dumbbell is 10
          pounds wherever you hold it, so wouldn't it be nice if "two reds and a blue" was a fixed
          number too? While we're dreaming, "two reds and a blue" would be the same no matter what
          brand of equipment you taught on.
        </Prose>
        <Prose>Unfortunately, it's not that simple.</Prose>
        <Prose>
          A spring gets heavier the more you stretch it. Its resistance is not a single value, it
          is a variable that scales linearly. This principle is called Hooke's Law. You can even
          represent it with a mathematical equation:
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
          Spring Force = (k × x) + b
        </div>
        <Prose>
          Here, <span style={strongStyle}>b</span> is the initial tension, the load the spring
          already pulls before the carriage moves. <span style={strongStyle}>k</span> is the spring
          constant (sometimes referred to as stiffness), and indicates how fast the load climbs for
          every inch of travel. <span style={strongStyle}>x</span> is how far the spring is
          stretched, which depends on the movement and the machine.
        </Prose>
        <Prose>
          For example, a Balanced Body red reformer spring starts at about {fmtForce(bbRed.b)} when
          closed, and scales to about {fmtForce(bbRedEnd)} at {fmtLength(reformerTravel)} of
          stretch. Same spring color, but a whole range of possible resistances.
        </Prose>
      </Section>

      <Section label="How to read these graphs">
        <Prose>
          If graphs and equations are not your thing, stay with me, this part is easier than it
          looks, and it is the key to everything below.
        </Prose>
        <Prose>
          First, let's look at the 4 parts of the graph. The diagonal line across the middle
          represents the spring force. The fact that it goes up and to the right means that the
          spring gets heavier as it stretches.
        </Prose>
        <Prose>
          Then, there are the axes. The horizontal axis (aka x-axis) that runs along the bottom is
          how far the spring is stretched. The weight you feel from the spring runs up the side on
          the vertical axis (aka y-axis).
        </Prose>
        <Prose>
          The initial tension is simply where the line of the spring crosses 0 spring stretch. On
          most graphs, that's the vertical axis. The other two describe the line itself: where it
          starts, and how steeply it rises.
        </Prose>
        <Prose>
          Finally, the spring constant (stiffness) is just the slope of the line. For every one
          inch the spring stretches, the spring resistance increases a set amount.
        </Prose>
        <GraphPartsFigure />
        <Prose>
          Okay, so now that you know the anatomy of a graph (see what I did there?) let's review how
          to read the graph. Here's how you figure out how much resistance a Balanced Body red
          spring provides at 12".
        </Prose>
        <ReadOffFigure />
        <Prose>
          First, go to 12" on the horizontal axis. Then draw a line straight up until you hit the
          spring force line (the diagonal one across the middle). Then, immediately pivot and go
          straight left to the vertical axis. Wherever your dotted line crosses the vertical axis
          is how heavy the spring is at that amount of stretch.
        </Prose>
      </Section>

      <Section label="Two numbers define every spring">
        <Prose>
          Brands separate themselves with two design choices: how much starting tension they build
          in, and how steeply the load climbs. Peak is the high starting tension brand. A Peak red
          already pulls about {fmtForce(peakRed.b)} at the home position, more than double a
          Balanced Body red at {fmtForce(bbRed.b)}, but its line climbs gently from there. Align
          is the opposite. Its springs start light, then ramp hard. Its strong green starts near{' '}
          {fmtForce(alignGreen.b)} and finishes around {fmtForce(alignGreenEnd)}, higher than
          anything else in its class.
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
          Red is a medium for Balanced Body, Align, and Merrithew, but heavy for Peak and BASI.
          The colors are not a language. They are just paint.
        </Prose>
      </Section>

      <Section label="The spring lineups">
        <Prose>
          Here is every spring I've found published data for (and one I haven't) brand by brand,
          drawn to a common scale. Each line is one spring: where it meets the left axis is its
          starting tension, and how steeply it climbs is its spring constant (stiffness). Within
          each apparatus every graph shares the same scale, so you can compare brands card to card.
          When a brand paints two springs the same color, the second line is dashed.
        </Prose>
        {springSpecs.apparatuses.map((apparatus) => {
          const peak = Math.max(
            ...apparatus.brands.flatMap((brand) =>
              brand.springs.map((s) => s.k * apparatus.maxTravel + s.b)
            )
          )
          const maxForce = niceMaxForce(peak)
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
                    <h4 style={{ ...sectionLabelStyle, marginBottom: '1.25rem' }}>
                      {brand.name}{' '}
                      <span style={{ color: 'var(--color-ink-muted)', fontWeight: 400 }}>
                        ({apparatus.name})
                      </span>
                    </h4>
                    <SpringBrandGraph
                      brand={brand}
                      maxTravel={apparatus.maxTravel}
                      xTicks={apparatus.xTicks}
                      maxForce={maxForce}
                      unit={unit}
                    />
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </Section>

      <Section label="About conversion charts">
        <Prose>
          People always want the cheat sheet: what is a Balanced Body red on a Merrithew? Fair
          question, and a conversion chart is a good place to start. The charts below line up
          each brand's springs with their rough equivalents for the reformer, tower, and chair.
        </Prose>
        {CONVERSION_CHARTS.map((chart) => (
          <ConversionChart key={chart.apparatusId} chart={chart} />
        ))}
        <Prose>
          Two things to keep in mind as you use these. Springs that share a column are rough
          equivalents, not twins: each one has its own starting tension and rate, so they may or
          may not feel "the same."
        </Prose>
        <Prose>
          Plus, machine dimensions change how far the same spring stretches, so even a perfect
          spring spec match can load the student differently from one model of reformer to the
          next. My recommendation is simple: try the same exercise on every piece of equipment you
          teach on, and let your body verify the chart. Sometimes it won't feel the way you expect.
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
          See and compare exact weights
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
          <Link to="/education" style={{ color: 'var(--color-accent)' }}>
            Explore Workshops
          </Link>
        </p>
      </div>
    </div>
  )
}
