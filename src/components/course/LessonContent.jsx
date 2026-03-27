import { useState } from 'react'
import { CheckCircle } from 'lucide-react'
import { AnimationSlot } from './AnimationSlot'
import { modules } from '../../utils/courseData'

// ── Placeholder content for modules 2–4 ──────────────────────────────────────
const placeholderContent = {
  'm2-l1': [
    'A taller client has a longer moment arm. When they perform a footwork series with the same spring setting as a shorter client, the torques at the hip and knee are different — not proportionally, but geometrically.',
    'This lesson introduces the concept of moment arms and mechanical advantage as they apply to Pilates programming.',
  ],
  'm2-l2': [
    'On a reformer, the carriage does not only work against the springs. It also works against friction in the rollers and, in exercises where the carriage tilts, against components of gravity.',
    'Programming for heavier clients without understanding this decomposition leads to systematic errors in spring selection.',
  ],
  'm2-l3': [
    'Moving the foot strap from short loops to long loops does two things: it increases the effective rope length and changes the angle of pull.',
    'This is a frequently overlooked variable. Instructors often adjust loop length for comfort without recognizing that they have also changed the force environment of the exercise.',
  ],
  'm2-l4': [
    'A spring can behave assistively or resistively depending on its orientation relative to the direction of movement.',
    'This lesson maps the common reformer exercises into assistive and resistive categories and explains the programming implications of each.',
  ],
  'm2-quiz': [
    'This assessment covers Module 2: moment arms and height, the decomposition of reformer resistance, the effects of rope length adjustment, and the distinction between supportive and resistive spring configurations.',
    'Complete all questions to unlock Module 3.',
  ],
  'm3-l1': [
    'Force is a vector: it has both magnitude and direction. When we talk about spring load, we usually talk about the magnitude — how heavy the spring feels. But direction determines which structures absorb that load.',
    'By the end, you will be able to identify the dominant force vector in any exercise setup and predict which joints and muscles will be most challenged.',
  ],
  'm3-l2': [
    'Standing footwork on a reformer is not footwork with different spring settings. The force environment is fundamentally different.',
    'Instructors who treat standing reformer as "harder footwork" are missing the mechanical reason why.',
  ],
  'm3-l3': [
    'Pulley height changes the angle at which the rope meets the carriage, which changes the direction of the force vector.',
    'The effective load changes with pulley height even when the spring setting does not change.',
  ],
  'm3-l4': [
    "In plank and pike on the reformer, the client's center of mass is elevated relative to a horizontal footwork position, and the movement is no longer a simple horizontal push.",
    'This lesson analyzes the plank and pike setup as a force problem.',
  ],
  'm3-quiz': [
    'Final assessment for the core course: force vectors, standing vs. seated mechanics, pulley height effects, and the plank/pike force analysis.',
    'Completing this assessment finishes the structured portion of the course.',
  ],
  'm4-l1': [
    'Angular velocity describes how quickly a segment rotates about a joint. This relationship explains a puzzle that confuses many instructors: two clients performing the same footwork at the same tempo will have different foot speeds if their leg lengths differ.',
  ],
  'm4-l2': [
    'The Wunda Chair presents a force analysis problem that the reformer does not: the pedal moves through an arc, not a line.',
  ],
  'm4-l3': [
    'The Cadillac is the most mechanically complex piece of standard Pilates equipment. Bars, springs, and pulleys interact in configurations that change fundamentally depending on attachment point, bar height, and client position.',
  ],
}

// ── Image placeholder component ──────────────────────────────────────────────
function LessonImage({ filename, alt }) {
  return (
    <div style={{ margin: '2rem 0' }}>
      <img
        src={`/images/module1/${filename}`}
        alt={alt}
        style={{
          width: '100%',
          height: 'auto',
          borderRadius: '8px',
          display: 'block',
        }}
      />
    </div>
  )
}

// ── Styled variable (k, b, x, F) ────────────────────────────────────────────
function V({ children }) {
  return (
    <span
      style={{
        fontFamily: '"DM Mono", monospace',
        color: 'var(--color-accent)',
      }}
    >
      {children}
    </span>
  )
}

// ── Equation block ───────────────────────────────────────────────────────────
function EquationBlock() {
  return (
    <div
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-rule)',
        borderLeft: '3px solid var(--color-accent)',
        borderRadius: '0 8px 8px 0',
        padding: '28px 32px',
        margin: '2rem 0',
      }}
    >
      <div
        style={{
          fontFamily: '"DM Mono", monospace',
          fontSize: 'clamp(36px, 5vw, 52px)',
          fontWeight: 500,
          marginBottom: '24px',
          letterSpacing: '0.04em',
        }}
      >
        <span style={{ color: 'var(--color-accent)' }}>F</span>
        <span style={{ color: 'var(--color-ink-muted)' }}> = </span>
        <span style={{ color: 'var(--color-accent)' }}>k</span>
        <span style={{ color: 'var(--color-accent)' }}>x</span>
        <span style={{ color: 'var(--color-ink-muted)' }}> + </span>
        <span style={{ color: 'var(--color-accent)' }}>b</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {[
          ['F', 'spring resistance in pounds'],
          ['k', 'spring constant — how fast resistance climbs per inch (lbs/inch)'],
          ['x', 'extension distance in inches'],
          ['b', 'initial tension — resistance before stretching begins'],
        ].map(([v, def]) => (
          <div
            key={v}
            style={{
              display: 'grid',
              gridTemplateColumns: '28px 1fr',
              gap: '16px',
              alignItems: 'baseline',
            }}
          >
            <span
              style={{
                fontFamily: '"DM Mono", monospace',
                color: 'var(--color-accent)',
                fontSize: '15px',
              }}
            >
              {v}
            </span>
            <span
              style={{
                fontWeight: 300,
                color: 'var(--color-ink-muted)',
                fontSize: '15px',
                lineHeight: 1.5,
              }}
            >
              {def}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Definition list row ──────────────────────────────────────────────────────
function DefRow({ term, children }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '160px 1fr',
        gap: '24px',
        padding: '16px 0',
        borderBottom: '1px solid var(--color-rule)',
        alignItems: 'baseline',
      }}
    >
      <div
        style={{
          fontFamily: '"DM Mono", monospace',
          fontSize: '13px',
          color: 'var(--color-accent)',
          fontWeight: 500,
          paddingTop: '2px',
        }}
      >
        {term}
      </div>
      <div
        style={{
          fontWeight: 300,
          fontSize: 'clamp(14px, 1.4vw, 16px)',
          color: 'var(--color-ink)',
          lineHeight: 1.65,
        }}
      >
        {children}
      </div>
    </div>
  )
}

// ── Quiz question component ──────────────────────────────────────────────────
function QuizQuestion({ number, total, question, choices, correctIndex, feedback }) {
  const [revealed, setRevealed] = useState(false)
  const correctLetter = String.fromCharCode(97 + correctIndex)

  return (
    <div>
      <p
        style={{
          fontFamily: '"DM Mono", monospace',
          fontSize: '11px',
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          color: 'var(--color-ink-muted)',
          marginBottom: '20px',
        }}
      >
        Assessment — Question {number} of {total}
      </p>
      <p
        style={{
          fontFamily: '"DM Serif Display", serif',
          fontSize: 'clamp(18px, 2.5vw, 24px)',
          fontWeight: 400,
          lineHeight: 1.35,
          color: 'var(--color-ink)',
          marginBottom: '28px',
        }}
      >
        {question}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
        {choices.map((choice, i) => {
          const isCorrect = i === correctIndex
          const letter = String.fromCharCode(97 + i)
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                gap: '14px',
                alignItems: 'flex-start',
                padding: '14px 18px',
                border: revealed && isCorrect
                  ? '1px solid #1D9E75'
                  : '1px solid var(--color-rule)',
                borderLeftWidth: revealed && isCorrect ? '3px' : '1px',
                borderRadius: '6px',
                fontSize: '15px',
                lineHeight: 1.55,
                color: 'var(--color-ink)',
                background: 'var(--color-surface)',
                opacity: revealed && !isCorrect ? 0.45 : 1,
                cursor: revealed ? 'default' : 'pointer',
                transition: 'border-color 0.2s, opacity 0.2s',
              }}
              onClick={() => !revealed && setRevealed(true)}
            >
              <span
                style={{
                  fontFamily: '"DM Mono", monospace',
                  fontSize: '12px',
                  color: 'var(--color-accent)',
                  flexShrink: 0,
                  paddingTop: '1px',
                }}
              >
                {letter})
              </span>
              <span>{choice}</span>
            </div>
          )
        })}
      </div>
      {!revealed && (
        <button
          onClick={() => setRevealed(true)}
          style={{
            background: 'none',
            border: '1px solid var(--color-accent)',
            color: 'var(--color-accent)',
            fontFamily: '"DM Mono", monospace',
            fontSize: '11px',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            padding: '10px 20px',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Reveal answer
        </button>
      )}
      {revealed && (
        <div
          style={{
            marginTop: '20px',
            padding: '18px 20px',
            background: 'var(--color-surface)',
            borderLeft: '3px solid var(--color-accent)',
            borderRadius: '0 6px 6px 0',
            fontSize: '14px',
            lineHeight: 1.65,
            color: 'var(--color-ink)',
          }}
        >
          <span
            style={{
              display: 'block',
              fontFamily: '"DM Mono", monospace',
              fontSize: '11px',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: '#1D9E75',
              marginBottom: '8px',
            }}
          >
            Correct answer: {correctLetter}
          </span>
          {feedback}
        </div>
      )}
    </div>
  )
}

// ── Module 1 page content (multi-page per lesson) ────────────────────────────
// Each lesson is an array of page-render functions.
const m1Pages = {
  'm1-intro': [() => <MeetInstructorPage />],
  'm1-overview': [() => <ModuleOverviewPage />],
  'm1-l1': [
    // Page 1: Lesson intro
    () => (
      <div>
        <div
          style={{
            borderTop: '2px solid var(--color-accent)',
            paddingTop: '28px',
            marginTop: '8px',
          }}
        >
          <p
            style={{
              fontFamily: '"DM Mono", monospace',
              fontSize: '12px',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: 'var(--color-accent)',
              marginBottom: '12px',
            }}
          >
            Lesson 1
          </p>
          <h2
            style={{
              fontFamily: '"DM Serif Display", serif',
              fontSize: 'clamp(28px, 4vw, 46px)',
              fontWeight: 400,
              lineHeight: 1.1,
              color: 'var(--color-ink)',
              marginBottom: '16px',
            }}
          >
            Springs 101
          </h2>
          <p
            style={{
              fontFamily: '"DM Serif Display", serif',
              fontStyle: 'italic',
              fontSize: 'clamp(16px, 2vw, 21px)',
              color: 'var(--color-ink-muted)',
              lineHeight: 1.5,
              marginBottom: '24px',
            }}
          >
            Springs get heavier as they stretch — not the same as a weight stack
          </p>
          <div
            style={{
              fontSize: '15px',
              lineHeight: 1.7,
              color: 'var(--color-ink-muted)',
              borderLeft: '2px solid var(--color-rule)',
              paddingLeft: '18px',
            }}
          >
            This lesson builds the core mental model. Before you can reason about spring settings, spring weights, or how to adapt for different bodies, you need to understand what a spring actually does mechanically — and why that's different from every other form of resistance you might use.
          </div>
        </div>
      </div>
    ),

    // Page 2: Opening — A Pilates spring doesn't work that way
    () => (
      <div>
        <Eyebrow>Lesson 1 — Springs 101</Eyebrow>
        <SectionTitle>A Pilates spring doesn't work that way</SectionTitle>
        <Prose>
          <p>Pick up a one-pound weight and hold it at your side. That pound doesn't change whether your arm is straight or bent, whether you've been holding it for ten seconds or ten minutes. The weight is the weight.</p>
          <p>A Pilates spring doesn't work that way.</p>
          <p>The resistance a spring delivers is not a fixed number. It's a relationship between the spring's physical properties and how far you've stretched it. Stretch it further, and it gets heavier. Every time, without exception. That's not a quirk of cheap equipment or a sign of wear — it's the physics. It's how springs work.</p>
          <p>This distinction matters more than most instructors realize, because the settings you choose don't determine a weight. They determine a range of weights, delivered across a range of motion, to a specific body on a specific piece of equipment. Two clients doing footwork on identical spring settings are not necessarily doing the same exercise.</p>
        </Prose>
      </div>
    ),

    // Page 3: The equation
    () => (
      <div>
        <Eyebrow>Lesson 1 — Springs 101</Eyebrow>
        <SectionTitle>The equation</SectionTitle>
        <Prose>
          <p>The relationship between spring extension and resistance is described by Hooke's Law:</p>
        </Prose>
        <EquationBlock />
        <Prose>
          <p>You don't need to do this math in the studio. But you do need to understand what it means. The <V>k</V> tells you how quickly the spring gets heavier as you stretch it — the steeper the slope, the faster the resistance climbs. The <V>b</V> tells you what the spring feels like at the very start of the movement, before the carriage has moved an inch.</p>
          <p>Together, <V>k</V> and <V>b</V> give every spring a unique load profile — a signature that describes how it behaves across its full range of motion.</p>
        </Prose>
      </div>
    ),

    // Page 4: What this looks like — spring animation
    () => (
      <div>
        <Eyebrow>Lesson 1 — Springs 101</Eyebrow>
        <SectionTitle>What this looks like</SectionTitle>
        <Prose>
          <p>The clearest way to see this is on a graph. Extension on the horizontal axis, resistance on the vertical. Every spring plots as a straight line — starting at <V>b</V> and climbing at a rate set by <V>k</V>. The steeper the line, the stiffer the spring. The higher the line starts, the more initial tension it carries.</p>
        </Prose>
        <AnimationSlot animationId="m1-l1-spring" />
        <Prose>
          <p>The animation above shows two scenarios side by side: a reformer carriage moving through a full range of footwork with a spring load, and the same movement with an equivalent constant weight via pulley. Watch the resistance number as the carriage travels. With constant weight, it doesn't move. With the spring, it climbs the entire way out — and drops back down on the return.</p>
          <p>This is the fundamental difference between springs and weight stacks. A weight stack gives you one number for the whole movement. A spring gives you a curve.</p>
        </Prose>
      </div>
    ),

    // Page 5: BB example graph
    () => (
      <div>
        <Eyebrow>Lesson 1 — Springs 101</Eyebrow>
        <SectionTitle>The numbers are meaningfully different</SectionTitle>
        <Prose>
          <p>When you look at Balanced Body's published spring data this way, something becomes immediately obvious: a red spring at 6 inches of extension is not the same as a red spring at 18 inches of extension. The numbers are meaningfully different. And that difference is present in every class you teach, every time a taller client pushes further out or a fatigued client's range shortens.</p>
        </Prose>
        <LessonImage
          filename="bb-spring-graph.png"
          alt="Balanced Body multi-spring load curve graph with k, b, and extension labeled. Each spring color plots as a distinct line showing how resistance diverges at different extension distances."
        />
      </div>
    ),

    // Page 6: What it means for your teaching — tall/short animation
    () => (
      <div>
        <Eyebrow>Lesson 1 — Springs 101</Eyebrow>
        <SectionTitle>What it means for your teaching</SectionTitle>
        <Prose>
          <p>A tall client doing footwork pushes the carriage further out than a short client on the same setup. That means they're working in a higher range on the load curve — heavier at the end of the movement than their shorter colleague on the same springs. They may not be working harder in every sense, but they are moving more resistance at full extension. That's worth knowing when you're assessing fatigue, planning progressions, or trying to understand why the same setting feels very different to two people in the same class.</p>
        </Prose>
        <AnimationSlot animationId="m1-l1-tall-short" />
        <Prose>
          <p>The spring's resistance isn't a setting you choose. It's a consequence of everything — the spring's design, the carriage position, the client's body. Understanding that consequence is what makes the difference between matching a setting to a body and understanding why you're making that choice.</p>
        </Prose>
      </div>
    ),
  ],

  'm1-l2': [
    // Page 1: Lesson intro
    () => (
      <div>
        <div
          style={{
            borderTop: '2px solid var(--color-accent)',
            paddingTop: '28px',
            marginTop: '8px',
          }}
        >
          <p
            style={{
              fontFamily: '"DM Mono", monospace',
              fontSize: '12px',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: 'var(--color-accent)',
              marginBottom: '12px',
            }}
          >
            Lesson 2
          </p>
          <h2
            style={{
              fontFamily: '"DM Serif Display", serif',
              fontSize: 'clamp(28px, 4vw, 46px)',
              fontWeight: 400,
              lineHeight: 1.1,
              color: 'var(--color-ink)',
              marginBottom: '16px',
            }}
          >
            Spring Design Basics
          </h2>
          <p
            style={{
              fontFamily: '"DM Serif Display", serif',
              fontStyle: 'italic',
              fontSize: 'clamp(16px, 2vw, 21px)',
              color: 'var(--color-ink-muted)',
              lineHeight: 1.5,
              marginBottom: '24px',
            }}
          >
            Spring weights vary based on design, and that varies by manufacturer
          </p>
          <div
            style={{
              fontSize: '15px',
              lineHeight: 1.7,
              color: 'var(--color-ink-muted)',
              borderLeft: '2px solid var(--color-rule)',
              paddingLeft: '18px',
            }}
          >
            Lesson 1 established that springs produce variable resistance. This lesson goes one level deeper: what determines that curve? Why does one spring climb faster than another, and why does the same color label mean different things across brands?
          </div>
        </div>
      </div>
    ),

    // Page 2: Opening
    () => (
      <div>
        <Eyebrow>Lesson 2 — Spring Design Basics</Eyebrow>
        <SectionTitle>A red spring from one manufacturer is not the same as a red spring from another</SectionTitle>
        <Prose>
          <p>Two springs can follow the same law and still feel completely different. Hooke's Law governs all of them — the resistance always climbs as you stretch — but how steep that climb is, and where it starts, depends entirely on how the spring was made.</p>
          <p>This is why a red spring from one manufacturer is not the same as a red spring from another. The color is a label. The physics is determined by the design.</p>
        </Prose>
      </div>
    ),

    // Page 3: What determines k and b — definition list
    () => (
      <div>
        <Eyebrow>Lesson 2 — Spring Design Basics</Eyebrow>
        <SectionTitle>
          What determines <V>k</V> and <V>b</V>
        </SectionTitle>
        <Prose>
          <p>Every extension spring has a set of physical characteristics that, together, produce its load curve. The five that matter most:</p>
        </Prose>
        <div style={{ marginTop: '28px' }}>
          <div style={{ borderTop: '1px solid var(--color-rule)' }}>
            <DefRow term="Coil length">
              How long the spring body is at rest. A longer spring has more room to travel before it reaches its safe extension limit.
            </DefRow>
            <DefRow term="Coil diameter">
              The width of the spring body itself. Together with wire diameter, this is the primary driver of stiffness.
            </DefRow>
            <DefRow term="Wire diameter">
              The thickness of the wire the spring is wound from. Thicker wire wound more tightly produces a steeper <V>k</V>. Thinner wire wound more loosely produces something lighter and more compliant.
            </DefRow>
            <DefRow term="Material">
              Most Pilates reformer springs are made from galvanized music wire, a high-carbon steel chosen for its consistency and fatigue resistance. Coating affects surface feel and corrosion protection but doesn't change the load curve.
            </DefRow>
            <DefRow term="End geometry">
              The shape of the hooks or loops at each end. This determines how the spring connects to the equipment and influences the initial tension <V>b</V>.
            </DefRow>
          </div>
        </div>
        <LessonImage
          filename="spring-coil-factors.png"
          alt="Spring anatomy diagram with coil length, coil diameter, wire diameter, material, and end geometry labeled on a representative extension spring."
        />
        <Prose>
          <p>None of these variables operate in isolation. Change the wire diameter and you change <V>k</V>. Change the coil diameter and you change both <V>k</V> and the spring's maximum safe extension. This is why two springs that look similar on a shelf can have meaningfully different load curves — and why matching springs across brands by color or by feel alone is unreliable.</p>
        </Prose>
      </div>
    ),

    // Page 4: What a spec sheet looks like
    () => (
      <div>
        <Eyebrow>Lesson 2 — Spring Design Basics</Eyebrow>
        <SectionTitle>What a spec sheet looks like</SectionTitle>
        <Prose>
          <p>When a Pilates equipment company designs a spring, they don't start with wire and start bending. They start with a target load curve — a desired <V>k</V>, a desired <V>b</V>, and a maximum safe extension — and work backwards to a physical specification.</p>
          <p>That specification gets handed to a manufacturer as an engineering drawing. It defines the free length, the coil geometry, the wire diameter, the material, and the end treatment. The manufacturer produces a sample. That sample gets tested against the target curve. If the load data matches within tolerance, the spec is approved. If not, the geometry gets adjusted and the cycle repeats.</p>
        </Prose>
        <LessonImage
          filename="spring-engineering-drawing.png"
          alt="A representative spring engineering drawing showing free length, wire diameter, outer diameter, coil count, initial tension, spring rate, and maximum safe deflection."
        />
        <Prose>
          <p>The drawing above is representative of what a real spring spec looks like. The key numbers — wire diameter, outer diameter, free length, calculated rate of extension, initial tension, maximum safe deflection — are all there. Together they describe a spring completely. But notice what isn't there: a color name. The color gets assigned later, as a label for the finished product. It's a convenience, not a specification.</p>
        </Prose>
      </div>
    ),

    // Page 5: Why this matters across brands
    () => (
      <div>
        <Eyebrow>Lesson 2 — Spring Design Basics</Eyebrow>
        <SectionTitle>Why this matters across brands</SectionTitle>
        <Prose>
          <p>Because every manufacturer runs this process independently, starting from their own target curve, using their own material sources and manufacturing tolerances, the springs that come out the other end are not interchangeable — even when they carry the same color name or are marketed as equivalents.</p>
        </Prose>
        <LessonImage
          filename="bb-spring-graph.png"
          alt="Balanced Body spring lineup plotted by load curve. Each color is a distinct line with different slope and starting point. Curves diverge as extension increases."
        />
        <Prose>
          <p>This graph shows Balanced Body's spring lineup plotted by load curve. Each line has a different slope and a different starting point. The gap between a yellow spring and a green spring at 18 inches of extension is not the same as the gap between them at 6 inches. The curves diverge. That divergence is a direct consequence of different <V>k</V> and <V>b</V> values — different design choices producing different physical behavior across the range of motion.</p>
          <p>When you look at the same graph for two different manufacturers, the divergence compounds. The springs may start close together at low extension and separate significantly by the time a tall client pushes to full range. That's not a quality difference. It's a design difference. And it's invisible if you're navigating by color names alone.</p>
        </Prose>
      </div>
    ),

    // Page 6: The design is the starting point
    () => (
      <div>
        <Eyebrow>Lesson 2 — Spring Design Basics</Eyebrow>
        <SectionTitle>The design is the starting point, not the destination</SectionTitle>
        <Prose>
          <p>Even with a complete specification, most spring development involves iteration with the manufacturer — testing samples, adjusting tolerances, balancing the target load curve against cost and material availability. The final spring is a negotiation between what the physics requires and what manufacturing can reliably produce.</p>
          <p>This matters for instructors because it means the spring in your hand is the product of a set of deliberate choices — choices that produced a specific <V>k</V> and <V>b</V>, a specific load curve, a specific experience for the body moving through it. Understanding that the design is intentional, and that different manufacturers made different intentional choices, is the foundation for understanding why the same exercise can feel so different on different equipment.</p>
        </Prose>
      </div>
    ),
  ],

  'm1-l3': [
    // Page 1: Lesson intro
    () => (
      <div>
        <div
          style={{
            borderTop: '2px solid var(--color-accent)',
            paddingTop: '28px',
            marginTop: '8px',
          }}
        >
          <p
            style={{
              fontFamily: '"DM Mono", monospace',
              fontSize: '12px',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: 'var(--color-accent)',
              marginBottom: '12px',
            }}
          >
            Lesson 3
          </p>
          <h2
            style={{
              fontFamily: '"DM Serif Display", serif',
              fontSize: 'clamp(28px, 4vw, 46px)',
              fontWeight: 400,
              lineHeight: 1.1,
              color: 'var(--color-ink)',
              marginBottom: '16px',
            }}
          >
            Spring Wear and Lifespan
          </h2>
          <p
            style={{
              fontFamily: '"DM Serif Display", serif',
              fontStyle: 'italic',
              fontSize: 'clamp(16px, 2vw, 21px)',
              color: 'var(--color-ink-muted)',
              lineHeight: 1.5,
              marginBottom: '24px',
            }}
          >
            Springs degrade in predictable ways
          </p>
          <div
            style={{
              fontSize: '15px',
              lineHeight: 1.7,
              color: 'var(--color-ink-muted)',
              borderLeft: '2px solid var(--color-rule)',
              paddingLeft: '18px',
            }}
          >
            The spring in your studio today is not the same spring it was when it was new. This lesson explains why — and what that means for the feedback you're getting from your clients.
          </div>
        </div>
      </div>
    ),

    // Page 2: The boundary between safe and permanent
    () => (
      <div>
        <Eyebrow>Lesson 3 — Spring Wear and Lifespan</Eyebrow>
        <SectionTitle>The boundary between safe and permanent</SectionTitle>
        <Prose>
          <p>A spring that's been in service for three years in a busy studio is not the same spring it was when it was new. The load curve has shifted. The resistance at any given extension is lower than the spec intended. The experience your client feels is no longer the experience you think you're delivering — and neither of you would know it.</p>
          <p>Spring wear is invisible in real time. It doesn't announce itself. It accumulates gradually, across thousands of cycles, until the gap between what the spring was designed to do and what it's actually doing becomes meaningful.</p>
          <p>To understand how springs wear, you need one more concept from Hooke's Law: the distinction between elastic and plastic deformation.</p>
          <p>When you stretch a spring within its designed range, it returns to its original length every time. The metal deforms under load and recovers fully when the load is released. This is elastic deformation — the spring is doing exactly what it was designed to do, cycle after cycle, without permanent change.</p>
          <p>Stretch a spring past its safe limit, and something different happens. The metal deforms beyond its ability to recover. It doesn't return to its original length. The coils are permanently altered. This is plastic deformation, and it's irreversible. A spring that has been plastically deformed will never behave the same way again.</p>
          <p>Most reformer springs, used correctly on well-maintained equipment, operate entirely within the elastic range. The carriage travel is designed to keep spring extension within safe limits. Plastic deformation from normal use is not the failure mode you're managing.</p>
          <p>The failure mode you're managing is fatigue.</p>
        </Prose>
        <AnimationSlot animationId="m1-l3" />
      </div>
    ),

    // Page 3: Fatigue is not a single event
    () => (
      <div>
        <Eyebrow>Lesson 3 — Spring Wear and Lifespan</Eyebrow>
        <SectionTitle>Fatigue is not a single event</SectionTitle>
        <Prose>
          <p>Even within the elastic range, the metal undergoes microscopic stress with every cycle. Over thousands of repetitions, tiny cracks initiate in the wire. For most of a spring's service life it feels completely normal — and then it doesn't. The closer it operates to its safe extension limit on each rep, the sooner it reaches the point where one of those cracks propagates far enough to cause permanent deformation or even break the wire.</p>
          <p>Garage door springs are a useful reference point here — there's extensive industry data on them because they're everywhere and their failure is inconvenient enough that manufacturers publish cycle ratings. A typical garage door spring is rated for 7,000 to 10,000 cycles. Pilates equipment manufacturers use similar thinking, which is why most publish replacement recommendations of one to two years for a working studio. That's not an arbitrary interval. It's an estimate of how many cycles a spring accumulates in normal professional use before its reliability becomes a concern.</p>
        </Prose>
      </div>
    ),

    // Page 4: What accelerates wear
    () => (
      <div>
        <Eyebrow>Lesson 3 — Spring Wear and Lifespan</Eyebrow>
        <SectionTitle>What accelerates wear</SectionTitle>
        <Prose>
          <p>Not all springs in a studio wear at the same rate. Usage patterns matter. Springs that get hooked up for every client — the middle springs, the standard footwork setup, whatever the studio default is — accumulate cycles faster than springs that rarely come off the bar. A spring that sees six sessions a day will reach its service limit faster than one that sees two.</p>
          <p>Beyond usage frequency, several environmental factors accelerate degradation. Humidity and temperature cycling cause the metal to expand and contract, stressing the coils even between sessions. Oils and lotions transferred from hands to spring coils during handling can degrade the surface of the wire over time. And coil slamming — allowing the carriage to return hard enough that the spring coils crash together at the end of the movement — introduces impact stress that the spring was not designed to absorb.</p>
          <p>None of these factors cause immediate failure. They shorten the service life incrementally, in ways that compound.</p>
        </Prose>
      </div>
    ),

    // Page 5: What you're actually managing
    () => (
      <div>
        <Eyebrow>Lesson 3 — Spring Wear and Lifespan</Eyebrow>
        <SectionTitle>What you're actually managing</SectionTitle>
        <Prose>
          <p>Spring replacement addresses two distinct risks, and it's worth being clear about both.</p>
          <p>The first is breakage. A spring that has exceeded its service life is more likely to fail under load — and a spring failure during a session is a safety event. The risk is low on well-maintained equipment, but it's real, and it's the reason manufacturer replacement recommendations exist as guidelines rather than suggestions.</p>
          <p>The second risk arrives earlier, and more quietly. Long before a spring breaks, its load curve drifts. The resistance at any given extension decreases. The experience your client feels is no longer the experience the equipment was designed to deliver. If you've been adjusting programming based on how exercises feel and how clients are progressing, some of that signal has been noise — the equipment changing underneath the training, invisibly, in a direction you weren't accounting for.</p>
          <p>Regular replacement manages both. It keeps the equipment within its safe operating range, and it keeps the baseline consistent enough that the feedback you're getting from your clients actually reflects their bodies — not the slow deterioration of a spring that passed its service life six months ago.</p>
        </Prose>
      </div>
    ),
  ],

  'm1-l4': [
    // Page 1: Lesson intro
    () => (
      <div>
        <div
          style={{
            borderTop: '2px solid var(--color-accent)',
            paddingTop: '28px',
            marginTop: '8px',
          }}
        >
          <p
            style={{
              fontFamily: '"DM Mono", monospace',
              fontSize: '12px',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: 'var(--color-accent)',
              marginBottom: '12px',
            }}
          >
            Lesson 4
          </p>
          <h2
            style={{
              fontFamily: '"DM Serif Display", serif',
              fontSize: 'clamp(28px, 4vw, 46px)',
              fontWeight: 400,
              lineHeight: 1.1,
              color: 'var(--color-ink)',
              marginBottom: '16px',
            }}
          >
            Real World Spring Comparisons
          </h2>
          <p
            style={{
              fontFamily: '"DM Serif Display", serif',
              fontStyle: 'italic',
              fontSize: 'clamp(16px, 2vw, 21px)',
              color: 'var(--color-ink-muted)',
              lineHeight: 1.5,
              marginBottom: '24px',
            }}
          >
            Memorizing settings isn't enough — you need intent and principles to teach across equipment
          </p>
          <div
            style={{
              fontSize: '15px',
              lineHeight: 1.7,
              color: 'var(--color-ink-muted)',
              borderLeft: '2px solid var(--color-rule)',
              paddingLeft: '18px',
            }}
          >
            This lesson takes everything from Lessons 1–3 into a real studio context — one where you might teach on multiple brands in the same week, or encounter equipment you've never used before.
          </div>
        </div>
      </div>
    ),

    // Page 2: Light springs
    () => (
      <div>
        <Eyebrow>Lesson 4 — Real World Spring Comparisons</Eyebrow>
        <SectionTitle>The light springs are nearly interchangeable</SectionTitle>
        <Prose>
          <p>By now you know that springs aren't a single weight, that their design determines their load curve, and that their load curve drifts over time. This lesson is about what happens when you take that knowledge into a real studio — one where you might teach on three different brands in a week, or pick up a guest teaching slot on equipment you've never used before.</p>
          <p>The short answer is that a spring conversion chart won't save you. The longer answer is worth understanding.</p>
          <p>When you plot the lightest spring from four major contemporary reformer manufacturers — Balanced Body, STOTT, Peak, and Align-Pilates — on the same graph, something reassuring happens. Across their full range of travel, they stay within about 5 pounds of each other. The load curves are similar in slope, similar in initial tension, similar in behavior. For practical teaching purposes, the light springs across these brands are close enough that switching between them doesn't require significant reprogramming.</p>
          <p>This makes intuitive sense. A light spring has a low <V>k</V> and a low <V>b</V>. There's less room for the curves to diverge when the values are small to begin with.</p>
        </Prose>
        <LessonImage
          filename="cross-brand-light-springs.png"
          alt="Lightest springs from Balanced Body, STOTT, Peak, and Align-Pilates plotted on the same axes. Lines remain within approximately 5 lbs of each other across the full range of carriage travel."
        />
      </div>
    ),

    // Page 3: Heavy springs
    () => (
      <div>
        <Eyebrow>Lesson 4 — Real World Spring Comparisons</Eyebrow>
        <SectionTitle>The heavy springs are where it gets interesting</SectionTitle>
        <Prose>
          <p>The picture changes significantly when you look at the heavy springs. Plot them on the same graph and three things become apparent.</p>
          <p>First, Balanced Body, STOTT, and Align all start with similar initial tension — their <V>b</V> values are close. But as you stretch those springs, the curves diverge. By 12 inches of extension, they differ by nearly 10 pounds. That's a meaningful difference, and 12 inches is squarely within normal footwork range for most clients.</p>
          <p>Second, Peak behaves differently from the start. Its heavy spring carries significantly more initial tension than the other three — it feels heavier from the moment the carriage begins to move. But its <V>k</V> is similar to Balanced Body's, which means the slope of its curve is comparable. The lines run roughly parallel, with Peak sitting higher. By about 20 inches of extension, Peak and STOTT cross — beyond that point, the Peak spring is actually lighter than the STOTT spring.</p>
          <p>Third, Align diverges most aggressively with extension. Its <V>k</V> is steeper than the others, meaning the resistance climbs faster per inch of carriage travel. A client working at the far end of their range on Align heavy springs is in meaningfully different territory than the same client on Balanced Body heavies.</p>
        </Prose>
        <LessonImage
          filename="cross-brand-heavy-springs.png"
          alt="Heaviest springs from Balanced Body, STOTT, Peak, and Align-Pilates on the same axes. Curves diverge significantly. Peak starts high, Align climbs steeply. Peak and STOTT cross at approximately 20 inches."
        />
      </div>
    ),

    // Page 4: What this means in practice
    () => (
      <div>
        <Eyebrow>Lesson 4 — Real World Spring Comparisons</Eyebrow>
        <SectionTitle>What this means in practice</SectionTitle>
        <Prose>
          <p>If you teach on multiple brands, the light springs give you reasonable continuity. You can translate your programming with minor adjustments and your clients' experience will be close to what you intended.</p>
          <p>The heavy springs do not give you that continuity. A client who has been training on Balanced Body heavies and walks into a studio with Peak equipment is going to feel a difference — particularly at the start of the movement, where Peak's higher initial tension is most noticeable. A client on Align heavies who is used to STOTT equipment will feel the resistance climb faster than expected as they move into range.</p>
          <p>None of this is a problem if you understand it. It becomes a problem when you reach for a conversion chart — a document that assigns equivalencies between brands based on a single number — and trust it to translate your programming accurately. A single number cannot represent a load curve. It can only describe one point on that curve, at one extension value, which may or may not correspond to where your client is actually working.</p>
        </Prose>
      </div>
    ),

    // Page 5: The three things you actually need
    () => (
      <div>
        <Eyebrow>Lesson 4 — Real World Spring Comparisons</Eyebrow>
        <SectionTitle>The three things you actually need</SectionTitle>
        <Prose>
          <p>The cross-brand comparison data makes one argument clearly: memorizing this chart is not the goal. You don't need to carry Balanced Body vs. Peak load curves in your head. What you need is a framework that travels with you — one that works on any equipment, in any studio, with any client.</p>
          <p>When you're planning to teach on unfamiliar equipment, or switching between brands in the same week, three questions do the work that no chart can.</p>
          <p>What is the intention of the exercise? Not the name of the movement — the intention. What should the spring load be doing at each point in the range of motion, and for this particular client at this point in their training?</p>
          <p>How does this specific equipment deliver load? Is this a brand with steep <V>k</V> values that climbs fast through range, or one with high initial tension that feels heavier from the first inch of travel? Knowing roughly where a brand sits on the spectrum tells you whether to expect the load to front-load or back-load the movement.</p>
          <p>What is your client telling you? When the load feels wrong to them — when a progression that should be accessible isn't, or a movement is catching them earlier in range than expected — that's information. The dialogue in the room is where the adjustment happens. No chart survives contact with a specific body on a specific day.</p>
          <p>Those three questions together are what make spring knowledge useful in practice. The comparison data in this lesson gives you a reference point. The framework gives you something to use when the equipment in front of you doesn't match anything you've taught on before — which, eventually, it will.</p>
        </Prose>
      </div>
    ),
  ],

  'm1-summary': [() => <ModuleSummaryPage />],
  'm1-quiz': [
    () => (
      <QuizQuestion
        number={1}
        total={5}
        question="A red Balanced Body spring at 6 inches of extension and the same spring at 18 inches of extension — which is heavier?"
        choices={[
          "They weigh the same — it's the same spring",
          'The spring at 6 inches is heavier',
          'The spring at 18 inches is heavier',
          'It depends on the reformer model',
        ]}
        correctIndex={2}
        feedback="Spring resistance increases with extension — F = kx + b. The further the spring is stretched, the higher the resistance delivered. The setting doesn't change; the client's range of motion determines which part of the load curve they're working in."
      />
    ),
    () => (
      <QuizQuestion
        number={2}
        total={5}
        question="In the equation F = kx + b, what does b represent?"
        choices={[
          "The spring's maximum safe extension",
          'The spring constant — how fast resistance climbs per inch',
          'The initial tension — resistance before the spring is stretched',
          'The total force at full extension',
        ]}
        correctIndex={2}
        feedback="b is the y-intercept of the load curve: the resistance the spring exerts before the carriage has moved at all. k is the spring constant — how fast resistance climbs per inch of extension."
      />
    ),
    () => (
      <QuizQuestion
        number={3}
        total={5}
        question="Two springs have the same color label but come from different manufacturers. Which statement is most accurate?"
        choices={[
          'They will feel identical — color labels are standardized across brands',
          'They will feel similar at low extension but may diverge significantly at higher extension',
          'They may have different k and b values and should not be assumed equivalent',
          'The heavier spring will always have a higher k value',
        ]}
        correctIndex={2}
        feedback="Color labels are not standardized across brands. Each manufacturer assigns colors to their own spring lineup based on independent design choices. The physics is determined by design, not by the color name."
      />
    ),
    () => (
      <QuizQuestion
        number={4}
        total={5}
        question="Which of the following factors does NOT influence how heavy a spring feels?"
        choices={[
          'How far you stretch it',
          'The wire diameter and material',
          'The length of the spring coil',
          'How fast you stretch the spring',
        ]}
        correctIndex={3}
        feedback="Hooke's Law describes spring behavior in terms of extension distance, not velocity. The other three — extension distance, wire diameter and material, and coil length — all directly influence the load the spring delivers."
      />
    ),
    () => (
      <QuizQuestion
        number={5}
        total={5}
        question="You're about to teach on a brand you've never used before. Which three things do you need to understand to deliver the intended experience for your client?"
        choices={[
          "The spring color equivalencies, the client's fitness level, and the exercise name",
          'The intention of the exercise, how this equipment delivers load, and what your client is telling you',
          "The manufacturer's recommended spring settings, the client's height, and the gear bar position",
          "The spring's wire diameter, the client's weight, and the reformer model",
        ]}
        correctIndex={1}
        feedback="These three questions form a portable framework that works on any equipment, in any studio, with any client — doing the work that no conversion chart can."
      />
    ),
  ],
}

// ── Small reusable layout primitives ─────────────────────────────────────────
function Eyebrow({ children }) {
  return (
    <p
      style={{
        fontFamily: '"DM Mono", monospace',
        fontSize: '11px',
        letterSpacing: '0.15em',
        textTransform: 'uppercase',
        color: 'var(--color-accent)',
        marginBottom: '18px',
      }}
    >
      {children}
    </p>
  )
}

function SectionTitle({ children }) {
  return (
    <h2
      style={{
        fontFamily: '"DM Serif Display", serif',
        fontSize: 'clamp(24px, 3.5vw, 38px)',
        fontWeight: 400,
        lineHeight: 1.2,
        color: 'var(--color-ink)',
        marginBottom: '24px',
      }}
    >
      {children}
    </h2>
  )
}

function Prose({ children }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        fontSize: 'clamp(15px, 1.5vw, 17px)',
        lineHeight: 1.78,
        color: 'var(--color-ink)',
      }}
    >
      {children}
    </div>
  )
}

// ── Meet Your Instructor page ────────────────────────────────────────────────
function MeetInstructorPage() {
  return (
    <div style={{ maxWidth: '840px', margin: '0 auto', padding: '48px 32px 40px' }}>
      <Eyebrow>Module 1 — Spring Basics</Eyebrow>
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '16/9',
          borderRadius: '8px',
          overflow: 'hidden',
          marginBottom: '36px',
        }}
      >
        <iframe
          src="https://www.youtube.com/embed/44L4UZvEX5E"
          title="Meet Your Instructor"
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '32px',
          alignItems: 'start',
        }}
      >
        <div>
          <h3
            style={{
              fontFamily: '"DM Serif Display", serif',
              fontSize: '22px',
              fontWeight: 400,
              color: 'var(--color-ink)',
              marginBottom: '12px',
            }}
          >
            Hi! I'm Kaleen.
          </h3>
          <p
            style={{
              fontSize: '15px',
              lineHeight: 1.72,
              color: 'var(--color-ink-muted)',
            }}
          >
            I'm a mechanical engineer and Pilates instructor. I've previously been a design engineer at Balanced Body, I started my own Pilates equipment technician business, and designed and built thousands of my own reformers with my own startup.
          </p>
        </div>
        <p
          style={{
            fontSize: '15px',
            lineHeight: 1.72,
            color: 'var(--color-ink-muted)',
            paddingTop: '4px',
          }}
        >
          I built Pilates Physics because the gap between how instructors are trained and what the equipment is actually doing is real, and it affects every session. This course is my attempt to close that gap.
        </p>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .instructor-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}

// ── Module Overview page ─────────────────────────────────────────────────────
function ModuleOverviewPage() {
  const lessons = [
    { id: 'L1', title: 'Springs 101', claim: 'Springs get heavier as they stretch — not the same as a weight stack' },
    { id: 'L2', title: 'Spring Design Basics', claim: 'Spring weights vary based on design, and that varies by manufacturer' },
    { id: 'L3', title: 'Spring Wear and Lifespan', claim: 'Springs degrade in predictable ways' },
    { id: 'L4', title: 'Real World Spring Comparisons', claim: "Memorizing settings isn't enough — you need intent and principles to teach across equipment" },
    { id: 'Quiz', title: 'Assessment Quiz', claim: '5 questions — pass to unlock Module 2' },
  ]

  return (
    <div style={{ maxWidth: '760px', margin: '0 auto', padding: '48px 32px 40px' }}>
      <Eyebrow>Module 1</Eyebrow>
      <h1
        style={{
          fontFamily: '"DM Serif Display", serif',
          fontSize: 'clamp(28px, 4vw, 44px)',
          fontWeight: 400,
          lineHeight: 1.15,
          color: 'var(--color-ink)',
          marginBottom: '28px',
        }}
      >
        Spring Basics
      </h1>
      <p
        style={{
          fontSize: 'clamp(15px, 1.5vw, 17px)',
          lineHeight: 1.75,
          color: 'var(--color-ink-muted)',
          marginBottom: '36px',
          paddingBottom: '32px',
          borderBottom: '1px solid var(--color-rule)',
        }}
      >
        The foundation. What a spring actually does mechanically, how resistance changes through range of motion, and why the settings you choose don't determine a weight — they determine a range of weights delivered to a specific body.
      </p>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {lessons.map((l, i) => (
          <li
            key={l.id}
            style={{
              display: 'grid',
              gridTemplateColumns: '56px 1fr',
              gap: '0 20px',
              padding: '16px 0',
              borderTop: i === 0 ? '1px solid var(--color-rule)' : 'none',
              borderBottom: '1px solid var(--color-rule)',
              alignItems: 'start',
            }}
          >
            <span
              style={{
                fontFamily: '"DM Mono", monospace',
                fontSize: '11px',
                letterSpacing: '0.1em',
                color: 'var(--color-accent)',
                paddingTop: '3px',
              }}
            >
              {l.id}
            </span>
            <div>
              <div
                style={{
                  fontSize: '15px',
                  fontWeight: 500,
                  color: 'var(--color-ink)',
                  marginBottom: '3px',
                }}
              >
                {l.title}
              </div>
              <div
                style={{
                  fontSize: '13px',
                  color: 'var(--color-ink-muted)',
                  lineHeight: 1.45,
                }}
              >
                {l.claim}
              </div>
            </div>
          </li>
        ))}
      </ul>
      <p
        style={{
          fontFamily: '"DM Serif Display", serif',
          fontStyle: 'italic',
          fontSize: 'clamp(15px, 1.5vw, 18px)',
          color: 'var(--color-ink-muted)',
          borderLeft: '2px solid var(--color-accent)',
          paddingLeft: '20px',
          marginTop: '32px',
          lineHeight: 1.65,
        }}
      >
        By the end of this module, you'll understand that Pilates springs are not interchangeable, that their load behavior is predictable and describable, and that this changes how you should be making decisions for clients.
      </p>
    </div>
  )
}

// ── Module Summary page ──────────────────────────────────────────────────────
function ModuleSummaryPage() {
  const takeaways = [
    "Spring resistance is a curve, not a number — it changes with every inch of carriage travel, and it responds to the client's body, not just the setting you chose",
    'The curve is determined by design choices that vary by manufacturer — color names are a convenience, not a specification, and two "red" springs from different brands are not the same spring',
    'Springs degrade over time in predictable ways — regular replacement keeps the equipment honest and keeps the feedback from your clients meaningful',
  ]

  return (
    <div style={{ maxWidth: '760px', margin: '0 auto', padding: '48px 32px 40px' }}>
      <Eyebrow>Module 1 Complete</Eyebrow>
      <h1
        style={{
          fontFamily: '"DM Serif Display", serif',
          fontSize: 'clamp(28px, 4vw, 44px)',
          fontWeight: 400,
          lineHeight: 1.15,
          color: 'var(--color-ink)',
          marginBottom: '28px',
        }}
      >
        Pilates springs are not interchangeable
      </h1>
      <ul style={{ listStyle: 'none', marginTop: '28px', padding: 0 }}>
        {takeaways.map((t, i) => (
          <li
            key={i}
            style={{
              display: 'flex',
              gap: '14px',
              padding: '16px 0',
              borderTop: i === 0 ? '1px solid var(--color-rule)' : 'none',
              borderBottom: '1px solid var(--color-rule)',
              fontSize: 'clamp(15px, 1.5vw, 17px)',
              lineHeight: 1.65,
              color: 'var(--color-ink)',
            }}
          >
            <span style={{ color: 'var(--color-accent)', flexShrink: 0 }}>→</span>
            <span>{t}</span>
          </li>
        ))}
      </ul>
      <p
        style={{
          fontFamily: '"DM Serif Display", serif',
          fontStyle: 'italic',
          fontSize: 'clamp(16px, 1.8vw, 20px)',
          color: 'var(--color-ink-muted)',
          borderLeft: '2px solid var(--color-accent)',
          paddingLeft: '20px',
          marginTop: '32px',
          lineHeight: 1.65,
        }}
      >
        Their load behavior is predictable and describable — and that changes how you should be making decisions for clients, even if you don't yet know how to make those decisions. That's what Modules 2 and 3 are for.
      </p>
    </div>
  )
}

// ── Fallback content for non-M1 lessons ──────────────────────────────────────
function getPlaceholderContent(lessonId) {
  return placeholderContent[lessonId] || [
    'Lesson content coming soon.',
    'This lesson is part of the course structure and will be populated with full content in a future update.',
  ]
}

// ── Flatten all lessons for navigation ───────────────────────────────────────
const allLessons = modules.flatMap((m) =>
  m.lessons.map((l) => ({
    ...l,
    moduleId: m.id,
    moduleNumber: m.number,
    moduleTitle: m.title,
    moduleColor: m.color,
  }))
)

// ── Main export ──────────────────────────────────────────────────────────────
export default function LessonContent({
  moduleId,
  lessonId,
  isLessonComplete,
  isModuleUnlocked,
  onMarkComplete,
  onSelectLesson,
}) {
  const [currentPage, setCurrentPage] = useState(0)

  const currentIndex = allLessons.findIndex((l) => l.id === lessonId)
  const lesson = allLessons[currentIndex]
  const mod = modules.find((m) => m.id === moduleId)

  // Reset page when lesson changes
  const [prevLessonId, setPrevLessonId] = useState(lessonId)
  if (lessonId !== prevLessonId) {
    setCurrentPage(0)
    setPrevLessonId(lessonId)
  }

  if (!lesson || !mod) {
    return (
      <div style={{ padding: '4rem 2rem', color: 'var(--color-ink-muted)' }}>
        Select a lesson to begin.
      </div>
    )
  }

  const done = isLessonComplete(lessonId)
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null
  const canGoNext = nextLesson && isModuleUnlocked(nextLesson.moduleId)
  const canGoPrev = prevLesson && isModuleUnlocked(prevLesson.moduleId)

  // Check if this lesson has multi-page M1 content
  const pages = m1Pages[lessonId]
  const isMultiPage = pages && pages.length > 0
  const totalPages = isMultiPage ? pages.length : 1

  // ── Render Module 1 special pages (intro, overview, summary) ───────────
  // These are structural pages that don't map to a lesson in courseData.
  // We detect them via the first lesson being active and page index.
  // For the "Meet Your Instructor" + "Module Overview" pattern, we render
  // them as part of the first lesson's multi-page flow, prepended.

  // ── Render content ─────────────────────────────────────────────────────
  function renderBody() {
    if (isMultiPage) {
      const PageComponent = pages[currentPage]
      return PageComponent ? <PageComponent /> : null
    }

    // Fallback: placeholder content for non-M1 lessons
    const content = getPlaceholderContent(lessonId)
    return (
      <>
        <p
          style={{
            fontSize: '0.68rem',
            fontWeight: '600',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: mod.color,
            margin: '0 0 1rem',
          }}
        >
          {mod.alwaysOpen
            ? 'Advanced Physics Portal'
            : `Module ${mod.number} — ${mod.title}`}
        </p>
        <h1
          style={{
            fontFamily: '"DM Serif Display", serif',
            fontSize: 'clamp(1.6rem, 3vw, 2.25rem)',
            lineHeight: '1.2',
            color: 'var(--color-ink)',
            margin: '0 0 2.5rem',
          }}
        >
          {lesson.title}
        </h1>
        {lesson.hasAnimation && <AnimationSlot animationId={lessonId} />}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
            fontSize: '1rem',
            lineHeight: '1.8',
            color: 'var(--color-ink-muted)',
            marginBottom: '3rem',
          }}
        >
          {content.map((para, i) => (
            <p key={i} style={{ margin: 0 }}>{para}</p>
          ))}
        </div>
      </>
    )
  }

  // Is this the last page of the lesson?
  const isLastPage = currentPage === totalPages - 1

  return (
    <article
      style={{
        maxWidth: '760px',
        margin: '0 auto',
        padding: '3rem 2.5rem 5rem',
      }}
    >
      {renderBody()}

      {/* Divider before controls */}
      <hr
        style={{
          border: 'none',
          borderTop: '1px solid var(--color-rule)',
          margin: '2rem 0',
        }}
      />

      {/* Mark complete — only show on last page, and not for intro/summary pages */}
      {isLastPage && !lesson.isIntro && !lesson.isSummary && (
        <div style={{ marginBottom: '2.5rem' }}>
          {done ? (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: mod.color,
                fontSize: '0.875rem',
                fontWeight: '500',
              }}
            >
              <CheckCircle size={16} strokeWidth={2} />
              Completed
            </div>
          ) : (
            <button
              onClick={() => onMarkComplete(lessonId)}
              style={{
                padding: '0.75rem 1.75rem',
                background: mod.color,
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500',
                fontFamily: '"DM Sans", sans-serif',
              }}
            >
              Mark Complete
            </button>
          )}
        </div>
      )}

      {/* Navigation: within-lesson pages + between lessons */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          flexWrap: 'wrap',
        }}
      >
        <div>
          {currentPage > 0 ? (
            <NavBtn
              direction="prev"
              label="Previous"
              onClick={() => {
                setCurrentPage(currentPage - 1)
                window.scrollTo({ top: 0 })
              }}
            />
          ) : canGoPrev ? (
            <NavBtn
              direction="prev"
              label={prevLesson.title}
              onClick={() => onSelectLesson(prevLesson.moduleId, prevLesson.id)}
            />
          ) : null}
        </div>

        {/* Page indicator for multi-page lessons */}
        {isMultiPage && totalPages > 1 && (
          <span
            style={{
              fontFamily: '"DM Mono", monospace',
              fontSize: '11px',
              letterSpacing: '0.1em',
              color: 'var(--color-ink-muted)',
            }}
          >
            {currentPage + 1} / {totalPages}
          </span>
        )}

        <div>
          {currentPage < totalPages - 1 ? (
            <NavBtn
              direction="next"
              label="Continue"
              onClick={() => {
                setCurrentPage(currentPage + 1)
                window.scrollTo({ top: 0 })
              }}
            />
          ) : canGoNext ? (
            <NavBtn
              direction="next"
              label={nextLesson.title}
              onClick={() => onSelectLesson(nextLesson.moduleId, nextLesson.id)}
            />
          ) : null}
        </div>
      </div>
    </article>
  )
}

function NavBtn({ direction, label, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'none',
        border: '1px solid var(--color-rule)',
        padding: '0.625rem 1.25rem',
        cursor: 'pointer',
        fontSize: '0.85rem',
        fontFamily: '"DM Sans", sans-serif',
        color: 'var(--color-ink-muted)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: direction === 'prev' ? 'flex-start' : 'flex-end',
        gap: '0.2rem',
        textAlign: direction === 'prev' ? 'left' : 'right',
      }}
    >
      <span
        style={{
          fontSize: '0.65rem',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}
      >
        {direction === 'prev' ? '← Previous' : 'Next →'}
      </span>
      <span style={{ color: 'var(--color-ink)' }}>{label}</span>
    </button>
  )
}
