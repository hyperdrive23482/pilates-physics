import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import springSpecs from '../../../data/springSpecs.json'
import SpringBrandGraph from './SpringBrandGraph'
import ConversionChart from './ConversionChart'
import { CONVERSION_CHARTS } from './conversionData'
import { UNIT_OPTIONS, forceValue, lengthValue, niceMaxForce } from './graphUtils'
import SpringBasics from './SpringBasics'
import { Prose, Section } from './prose'
import { BASICS_SECTIONS, proseStyle, sectionLabelStyle } from './proseStyles'

// One entry per teaching section, in order. Drives the "On this page"
// contents list; each Section below is given the matching id so the
// jump links land on it. The first three come from SpringBasics, which the
// Spring Load Calculator also renders.
const SECTIONS = [
  ...BASICS_SECTIONS,
  { id: 'no-standard', label: "There's no industry standard spring spec" },
  { id: 'lineups', label: 'Spring specs from the manufacturers' },
  { id: 'conversion', label: 'Spring conversion charts are only a starting point' },
  { id: 'machine', label: 'The same spring feels different on a different machine' },
]

// Fixed y-axis maximum (in lbs) for apparatuses whose auto-scale would squash
// the light springs. Anything above the cap is clipped by SpringBrandGraph.
const Y_AXIS_MAX = { reformer: 60, tower: 60 }

// Trim the plotted x-axis (inches) for some apparatuses without touching the
// real maxTravel in springSpecs (prose and the calculator still use 32").
// The reformer's interesting spread lives in the first two feet of stroke.
const X_AXIS = { reformer: { max: 24, ticks: [0, 8, 16, 24] } }

// Opening anecdote: two clients, identical footwork springs, very different
// loads. Grounds the whole primer before any physics shows up. Numbers come
// from the tall vs. short footwork example (5'11" vs 5'1", 89 vs 69 lb).
// Canonical values are imperial (heights in inches, forces in lb); the unit
// toggle re-derives the metric display so the prose never contradicts it.
function StoryIntro({ unit }) {
  const lead = {
    fontFamily: 'var(--font-serif)',
    fontSize: '1.15rem',
    lineHeight: '1.7',
    color: 'var(--color-ink)',
    margin: '0 0 1.1rem',
  }
  const metric = unit === 'metric'
  const cm = (inches) => `${Math.round(lengthValue(inches, unit))} cm`
  const kg = (lbs) => `${Math.round(forceValue(lbs, unit))} kg`
  const tallHeight = metric ? cm(71) : '5′11″'
  const shortHeight = metric ? cm(61) : '5′1″'
  const tallStretch = metric ? cm(20) : '20 inches'
  const shortStretch = metric ? cm(13.5) : '13½'
  const tallForce = metric ? kg(89) : '89 pounds'
  const shortForce = metric ? kg(69) : '69'
  const diffForce = metric ? kg(20) : '20-pound'
  return (
    <div style={{ margin: '0 0 2.5rem' }}>
      <p style={lead}>
        Two clients with the same footwork springs, same equipment settings, but different
        heights. One is {tallHeight}. The other is {shortHeight}.
      </p>
      <p style={lead}>
        The shorter client tells you this feels easy. The taller client looks over at their friend
        and says &ldquo;speak for yourself.&rdquo;
      </p>
      <p style={lead}>
        Same setting. Same machine. Is the shorter client really that much stronger than the
        taller client?
      </p>
      <p style={lead}>
        Before thinking about strength, recognize that longer legs press the carriage out farther.
        The taller client goes about {tallStretch}, the shorter about {shortStretch}. And because a
        spring gets heavier the more it stretches, the taller client meets about {tallForce} at full
        press while the shorter meets about {shortForce}.
        <sup style={{ fontSize: '0.7em' }}>*</sup>{' '}
        That&apos;s a {diffForce} difference that instructors aren&apos;t taught to recognize in our
        teacher training.
      </p>
      <p
        style={{
          fontSize: '0.8rem',
          lineHeight: '1.6',
          color: 'var(--color-ink-muted)',
          fontStyle: 'italic',
          margin: '1.5rem 0 0',
        }}
      >
        *Measurements from a Balanced Body Studio Reformer with footbar in the middle position, in
        gear 1, and 2 reds and a green spring attached.
      </p>
    </div>
  )
}

// Jump list built from SECTIONS. Native anchor links pair with each Section's
// id + scrollMarginTop, so no scroll JS is needed.
function Contents() {
  return (
    <nav
      aria-label="On this page"
      className="pp-card"
      style={{ padding: '1.5rem 1.75rem', margin: '0 0 3rem' }}
    >
      <h2 style={{ ...sectionLabelStyle, marginBottom: '1rem' }}>On this page</h2>
      <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '0.65rem' }}>
        {SECTIONS.map((s) => (
          <li key={s.id}>
            <a
              href={`#${s.id}`}
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '1rem',
                color: 'var(--color-accent)',
                textDecoration: 'none',
              }}
            >
              {s.label}
            </a>
          </li>
        ))}
      </ol>
    </nav>
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

export default function Springs101() {
  const [unit, setUnit] = useState('imperial')

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

      <StoryIntro unit={unit} />

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

      <Contents />

      <SpringBasics unit={unit} />

      <Section
        id="no-standard"
        label="There's no industry standard spring spec"
        takeaway="There's no industry standard spring, so two springs can share a color and be nothing alike."
      >
        <Prose>
          There is no industry standard spring. No governing body decides what a "red" should
          weigh, how much starting tension it carries, or how steeply it climbs. Every
          manufacturer sets its own. Which means two springs can share a color and be nothing
          alike.
        </Prose>
        <Prose>
          Green is the heaviest spring Balanced Body and Align make, and the lightest spring Peak
          makes. Yellow is the lightest spring on a Balanced Body and a middle spring on a Peak.
          Red is a medium for Balanced Body, Align, and Merrithew, but heavy for Peak and BASI.
        </Prose>
        <Prose>
          So a shared color is not a shared spring. Two springs can wear the same color and load
          your student completely differently. To know what you've actually got, read what the
          spring does, not what it's called.
        </Prose>
      </Section>

      <Section
        id="lineups"
        label="Spring specs from the manufacturers"
        takeaway="Every spring I have data for, brand by brand, on one shared scale so you can compare honestly."
      >
        <Prose>
          Here is every spring I've found published data for (and one I haven't) brand by brand,
          drawn to a common scale. Each line is one spring: where it meets the left axis is its
          starting tension, and how steeply it climbs is its spring constant (stiffness). Within
          each apparatus every graph shares the same scale, so you can compare brands card to card.
          When a brand paints two springs the same color, the shorter one is dashed so you can
          tell them apart.
        </Prose>
        <Prose>
          To read exact numbers off any of these, or to stack several springs and see what the
          combination adds up to, open them in the{' '}
          <Link to="/portal/spring-load-calculator" style={{ color: 'var(--color-accent)' }}>
            Spring Load Calculator
          </Link>.
        </Prose>
        {springSpecs.apparatuses.map((apparatus) => {
          const graphTravel = X_AXIS[apparatus.id]?.max ?? apparatus.maxTravel
          const graphXTicks = X_AXIS[apparatus.id]?.ticks ?? apparatus.xTicks
          const peak = Math.max(
            ...apparatus.brands.flatMap((brand) =>
              brand.springs.map((s) => s.k * graphTravel + s.b)
            )
          )
          // Cap a couple of apparatus axes below their true peak so the many
          // light springs spread out and stay readable; the few very heavy
          // springs (tower trapeze) run off the top of the pane, which the
          // graph clips. Others auto-scale to fit every line.
          const maxForce = Y_AXIS_MAX[apparatus.id] ?? niceMaxForce(peak)
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
                      maxTravel={graphTravel}
                      xTicks={graphXTicks}
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

      <Section
        id="conversion"
        label="Spring conversion charts are only a starting point"
        takeaway="Conversion charts are a solid starting point, then let your body verify, because equivalents aren't twins."
      >
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

      <Section
        id="machine"
        label="The same spring feels different on a different machine"
        takeaway="The machine, not the spring, sets how far you stretch, so the same spring can feel different on a different reformer."
      >
        <Prose>
          Even identical springs on two different machines will not feel the same. Go back to the
          model: force depends on stretch, and stretch is set by the machine, not the spring.
          Carriage travel, where the spring anchors, rope length, pulley height, footbar position:
          all of it changes how far a given movement actually stretches the spring. Same spring,
          different load. That is why you cannot teach from the spring setting alone, and it is
          why the{' '}
          <Link to="/portal/spring-load-calculator" style={{ color: 'var(--color-accent)' }}>
            Spring Load Calculator
          </Link>{' '}
          lets you drag through the stroke and read the load at any point.
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
            fontSize: '1.6rem',
            lineHeight: '1.25',
            color: 'var(--color-ink)',
            margin: 0,
          }}
        >
          Build each class around the humans in front of you
        </h2>
        <p style={{ ...proseStyle, margin: 0, maxWidth: '460px' }}>
          Pilates Physics 101 shows you how to adapt the load for your clients, not just set it. A live, virtual workshop
          for reformer instructors.
        </p>
        <Link to="/pilates-physics-101" className="pp-btn pp-btn--primary">
          Register for Pilates Physics 101 <ArrowRight size={16} />
        </Link>
        <p style={{ ...proseStyle, margin: 0, fontSize: '0.85rem' }}>
          Teach on the Chair or Cadillac too?{' '}
          <Link to="/pilates-physics-102" style={{ color: 'var(--color-accent)' }}>
            Pilates Physics 102
          </Link>{' '}
          covers those.
        </p>
      </div>
    </div>
  )
}
