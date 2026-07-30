import springSpecs from '../../../data/springSpecs.json'
import { GraphPartsFigure, ReadOffFigure } from './GraphReadingGuide'
import { UNITS, forceValue, lengthValue } from './graphUtils'
import { Prose, Section } from './prose'
import { BASICS_SECTIONS, strongStyle } from './proseStyles'

// The three foundational spring sections, shared by two hosts: the Springs 101
// primer (where they open a seven-section piece) and the Spring Load Calculator
// (where they sit under the tool as the physics a first-time visitor needs to
// read the graph). Extracted so the prose has one home and cannot drift.

// Pull the Peak vs Align contrast numbers from the specs at render time so
// the prose never drifts from the calculator's data.
function reformerBrand(id) {
  return springSpecs.apparatuses
    .find((a) => a.id === 'reformer')
    .brands.find((b) => b.id === id)
}

export default function SpringBasics({ unit = 'imperial' }) {
  const forceUnit = UNITS[unit].force
  const fmtForce = (lbs) => `${Math.round(forceValue(lbs, unit))} ${forceUnit}`
  const fmtLength = (inch) =>
    unit === 'metric' ? `${Math.round(lengthValue(inch, unit))} cm` : `${inch} inches`
  // Singular unit word for prose like "for every inch of travel".
  const lenWord = unit === 'metric' ? 'centimeter' : 'inch'

  const peakRed = reformerBrand('peak-pilates').springs.find((s) => s.color === 'red')
  const alignGreen = reformerBrand('align-pilates').springs.find((s) => s.color === 'green')
  const bbRed = reformerBrand('balanced-body').springs.find((s) => s.color === 'red')
  const reformerTravel = springSpecs.apparatuses.find((a) => a.id === 'reformer').maxTravel
  const alignGreenEnd = alignGreen.b + alignGreen.k * reformerTravel
  const bbRedEnd = bbRed.b + bbRed.k * reformerTravel

  return (
    <>
      <Section
        id={BASICS_SECTIONS[0].id}
        label={BASICS_SECTIONS[0].label}
        takeaway="Stretch a spring farther and it gets heavier. One spring color isn't one weight, it's a whole range."
      >
        <Prose>
          We want to talk about springs the way we talk about dumbbells. A {fmtForce(10)} dumbbell
          is {fmtForce(10)} wherever you hold it, so wouldn't it be nice if "two reds and a blue"
          was a fixed number too? While we're dreaming, "two reds and a blue" would be the same no
          matter what brand of equipment you taught on.
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
          every {lenWord} of travel. <span style={strongStyle}>x</span> is how far the spring is
          stretched, which depends on the movement and the machine.
        </Prose>
        <Prose>
          For example, a Balanced Body red reformer spring starts at about {fmtForce(bbRed.b)} when
          closed, and scales to about {fmtForce(bbRedEnd)} at {fmtLength(reformerTravel)} of
          stretch. Same spring color, but a whole range of possible resistances.
        </Prose>
      </Section>

      <Section
        id={BASICS_SECTIONS[1].id}
        label={BASICS_SECTIONS[1].label}
        takeaway="Find the stretch along the bottom, go straight up to the line, then read the weight off the left."
      >
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
          {' '}{lenWord} the spring stretches, the spring resistance increases a set amount.
        </Prose>
        <GraphPartsFigure unit={unit} />
        <Prose>
          Okay, so now that you know the anatomy of a graph (see what I did there?) let's review how
          to read the graph. Here's how you figure out how much resistance a Balanced Body red
          spring provides at {fmtLength(12)}.
        </Prose>
        <ReadOffFigure unit={unit} />
        <Prose>
          First, go to {fmtLength(12)} on the horizontal axis. Then draw a line straight up until you hit the
          spring force line (the diagonal one across the middle). Then, immediately pivot and go
          straight left to the vertical axis. Wherever your dotted line crosses the vertical axis
          is how heavy the spring is at that amount of stretch.
        </Prose>
      </Section>

      <Section
        id={BASICS_SECTIONS[2].id}
        label={BASICS_SECTIONS[2].label}
        takeaway="Starting tension and stiffness (the slope) define a spring together. No single number or color can."
      >
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
    </>
  )
}
