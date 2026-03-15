import { CheckCircle } from 'lucide-react'
import { AnimationSlot } from './AnimationSlot'
import { modules } from '../../utils/courseData'

// Placeholder content per lesson — replaced with real copy in a future phase.
const placeholderContent = {
  'm1-l1': [
    `A spring is not a weight. This distinction, obvious when stated plainly, has enormous consequences for how Pilates equipment behaves — and for how you should program it.`,
    `Springs store potential energy as they deform. The force they exert is proportional to how far they have been displaced from their natural length. This relationship — F = kx, where k is the spring constant and x is the extension — means the resistance a client encounters at the start of a movement is fundamentally different from the resistance they encounter at the end of it.`,
    `This lesson establishes the mechanical vocabulary for everything that follows: spring constant, natural length, extension, pretension, and the difference between assistive and resistive loading. These are not abstract concepts. They are the reason the same spring setting feels different on a Gratz than on a Balanced Body.`,
  ],
  'm1-l2': [
    `This lesson is paired with an interactive animation. Use the diagram above to move the carriage through its range and observe how spring force changes at every inch of travel — then compare that to the constant-load behavior of a weight stack via pulley.`,
    `The key insight: a weight stack delivers the same force throughout the movement. A spring delivers increasing force as the carriage moves away from center. At some point in the range of motion, the spring becomes heavier than the client's own bodyweight working against gravity. Where that crossover happens depends on the spring constant, the client's mass, and the exercise geometry.`,
    `This is not a small distinction. It changes which part of the movement is hardest, how much assistance the spring provides on the return, and why two clients with different body weights should rarely be on the same spring setting for the same exercise.`,
  ],
  'm1-l3': [
    `Not all springs sold for Pilates equipment are equal, and the differences matter more than most instructors realize. Wire gauge, coil count, and free length together determine a spring's constant (k) — its stiffness — and its maximum safe extension.`,
    `Higher wire gauge means thicker wire, which means higher k values. More coils mean lower k values, all else equal. Free length determines where the spring begins contributing resistance, which is directly related to the pretension built into the reformer design.`,
    `This lesson gives you a working mental model for comparing springs across brands, identifying springs that are mismatched to their intended use, and understanding why "one yellow spring" is not a universal prescription.`,
  ],
  'm1-l4': [
    `Springs fatigue. The spring constant (k) decreases over time as the metal undergoes plastic deformation from repeated cycling. A spring that measures at specification when new will be measurably softer after two to three years of heavy use — and considerably softer after five.`,
    `Instructors rarely account for this. When a client's load feels lighter than expected, the first question should sometimes be: when were these springs last replaced? A worn spring does not break. It just quietly becomes a different spring.`,
    `This lesson covers how to identify wear through visual inspection and basic force testing, the replacement schedules recommended by major manufacturers, and why equipment with mixed-age springs creates uneven resistance across the carriage.`,
  ],
  'm1-l5': [
    `On a properly set up reformer, the springs are not at their natural length when the carriage is at the stopper. They are already under tension — pre-extended. This is pretension, and it is a deliberate design choice with mechanical consequences.`,
    `Pretension ensures that the client encounters resistance immediately, even at the very start of movement. Without it, the first portion of the range would feel unloaded, the spring curve would have a dead zone at the beginning, and the force profile would be qualitatively different from what instructors expect.`,
    `Understanding pretension helps explain why springs behave differently when moved between reformers with different footbar-to-stopper geometries — and why the same spring can feel different on different frames.`,
  ],
  'm1-quiz': [
    `This assessment covers the core concepts from Module 1: spring constants, the F = kx relationship, the distinction between spring resistance and constant-load resistance, spring design variables, wear indicators, and pretension.`,
    `Complete the questions below to unlock Module 2. You can retake the assessment as many times as needed.`,
  ],
  'm2-l1': [
    `A taller client has a longer moment arm. When they perform a footwork series with the same spring setting as a shorter client, the torques at the hip and knee are different — not proportionally, but geometrically. The spring load at the foot is the same. The demand on the joint structures is not.`,
    `This lesson introduces the concept of moment arms and mechanical advantage as they apply to Pilates programming. It explains why height is not a simple modifier to spring settings, but a variable that changes the entire mechanical picture of an exercise.`,
    `By the end, you will be able to sketch a rough force diagram for a client of any proportions and identify which joints are being loaded most heavily at any point in the movement.`,
  ],
  'm2-l2': [
    `On a reformer, the carriage does not only work against the springs. It also works against friction in the rollers and, in exercises where the carriage tilts, against components of gravity. The net force a client experiences is the sum of all of these — and body weight is a significant term in that sum.`,
    `This lesson separates the three resistive forces a client encounters (spring, friction, gravity component) and shows how body weight interacts with each. A heavier client does not simply "load the springs more" — they change the friction term and, in tilted or vertical exercises, alter the gravity vector substantially.`,
    `Programming for heavier clients without understanding this decomposition leads to systematic errors in spring selection.`,
  ],
  'm2-l3': [
    `Moving the foot strap from short loops to long loops does two things: it increases the effective rope length and changes the angle of pull. Both matter, and they matter differently depending on the exercise.`,
    `A longer rope increases the range of motion available before the strap becomes taut, and changes when in the range the spring load becomes the dominant resistance. A different angle of pull changes the force vector at the foot — the spring may be pulling at a different angle relative to the leg, which changes the effective load on the hip and knee joints.`,
    `This is a frequently overlooked variable. Instructors often adjust loop length for comfort or limb proportion without recognizing that they have also changed the force environment of the exercise.`,
  ],
  'm2-l4': [
    `A spring can behave assistively or resistively depending on its orientation relative to the direction of movement. On a footwork series pushing the carriage away from the footbar, the spring resists the push. On a long-box pulling series, the spring assists the pull.`,
    `This distinction changes everything about how you sequence and program. The appropriate spring weight for an assisted movement is not the same as for a resisted movement — and the force curve behaves differently in each case, with different points of peak load within the range.`,
    `This lesson maps the common reformer exercises into assistive and resistive categories and explains the programming implications of each.`,
  ],
  'm2-quiz': [
    `This assessment covers Module 2: moment arms and height, the decomposition of reformer resistance, the effects of rope length adjustment, and the distinction between supportive and resistive spring configurations.`,
    `Complete all questions to unlock Module 3.`,
  ],
  'm3-l1': [
    `Force is a vector: it has both magnitude and direction. When we talk about spring load, we usually talk about the magnitude — how heavy the spring feels. But direction determines which structures absorb that load and how.`,
    `This lesson introduces vector decomposition as a practical tool for movement analysis. You do not need to calculate exact angles. You need to develop the habit of asking: which direction is this force pulling, and what body structures are in line with it?`,
    `By the end, you will be able to identify the dominant force vector in any exercise setup and predict which joints and muscles will be most challenged — before the client moves.`,
  ],
  'm3-l2': [
    `Standing footwork on a reformer is not footwork with different spring settings. The force environment is fundamentally different. In seated footwork, the client works against the spring along a roughly horizontal axis, with gravity acting perpendicular to the movement. In standing, gravity is now in the same direction as the movement.`,
    `This changes the required force to move the carriage, the stabilization demands on the trunk, and the appropriate spring load for a given client. Instructors who treat standing reformer as "harder footwork" are missing the mechanical reason why — and are likely miscalibrating the assistance.`,
  ],
  'm3-l3': [
    `Pulley height changes the angle at which the rope meets the carriage, which changes the direction of the force vector. At low pulley height, the pull is more horizontal. At high pulley height, the pull has a larger vertical component.`,
    `This matters most in exercises where the client is pulling or pushing against the rope — long-box pulling, kneeling series, standing arm work. The effective load changes with pulley height even when the spring setting does not change, because the angle determines how much of the spring force is directed along the intended line of movement versus perpendicular to it.`,
  ],
  'm3-l4': [
    `In plank and pike on the reformer, the client's center of mass is elevated relative to a horizontal footwork position, and the movement is no longer a simple horizontal push. The force vector the client works against has a significant vertical component — and the stabilization demands are substantially higher.`,
    `This lesson analyzes the plank and pike setup as a force problem: where the center of mass is, which direction the spring pulls, and what the trunk must do to maintain spinal integrity through the movement. It also explains why this exercise is highly sensitive to spring setting changes — small changes in load have large effects on the difficulty of stabilization.`,
  ],
  'm3-quiz': [
    `Final assessment for the core course: force vectors, standing vs. seated mechanics, pulley height effects, and the plank/pike force analysis.`,
    `Completing this assessment finishes the structured portion of the course. Module 4 is always open.`,
  ],
  'm4-l1': [
    `Angular velocity (ω) describes how quickly a segment rotates about a joint. Linear velocity (v) — the speed of the foot or hand at the end of a limb — is related to angular velocity by: v = ω · r, where r is the distance from the joint to the point of interest.`,
    `This relationship explains a puzzle that confuses many instructors: two clients performing the same footwork at the same tempo will have different foot speeds if their leg lengths differ. The longer leg sweeps a larger arc. The foot moves faster. The spring encounters that foot speed and responds differently.`,
    `This has direct implications for programming tall versus short clients, and for understanding why "same tempo, same springs" is not the same exercise for different bodies.`,
  ],
  'm4-l2': [
    `The Wunda Chair presents a force analysis problem that the reformer does not: the pedal moves through an arc, not a line. As the pedal angle changes, so does the direction of the force the client works against, and so does the mechanical advantage of the spring.`,
    `This lesson works through the chair mechanics step by step, identifying how the pedal arc changes the effective load at different points in the range, and why chair exercises are often harder at the bottom of the pedal travel than at the top — even though the spring is more compressed at the top.`,
  ],
  'm4-l3': [
    `The Cadillac is the most mechanically complex piece of standard Pilates equipment. Bars, springs, and pulleys interact in configurations that change fundamentally depending on attachment point, bar height, and client position.`,
    `This lesson works through three common Cadillac setups — the push-through bar, the roll-down bar, and the arm springs — as mechanical systems. For each, we identify the dominant force vector, the point of peak load, and the stabilization demands on the client.`,
  ],
}

function getContent(lessonId) {
  return placeholderContent[lessonId] || [
    'Lesson content coming soon.',
    'This lesson is part of the course structure and will be populated with full content in a future update.',
  ]
}

// Flatten all lessons with module context for navigation
const allLessons = modules.flatMap((m) =>
  m.lessons.map((l) => ({
    ...l,
    moduleId: m.id,
    moduleNumber: m.number,
    moduleTitle: m.title,
    moduleColor: m.color,
  }))
)

export default function LessonContent({
  moduleId,
  lessonId,
  isLessonComplete,
  isModuleUnlocked,
  onMarkComplete,
  onSelectLesson,
}) {
  const currentIndex = allLessons.findIndex((l) => l.id === lessonId)
  const lesson = allLessons[currentIndex]
  const mod = modules.find((m) => m.id === moduleId)

  if (!lesson || !mod) {
    return (
      <div style={{ padding: '4rem 2rem', color: 'var(--color-ink-muted)' }}>
        Select a lesson to begin.
      </div>
    )
  }

  const content = getContent(lessonId)
  const done = isLessonComplete(lessonId)

  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null

  const canGoNext = nextLesson && isModuleUnlocked(nextLesson.moduleId)
  const canGoPrev = prevLesson && isModuleUnlocked(prevLesson.moduleId)

  return (
    <article
      style={{
        maxWidth: '720px',
        margin: '0 auto',
        padding: '3rem 2.5rem 5rem',
      }}
    >
      {/* Module label */}
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

      {/* Lesson title */}
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

      {/* Animation slot — appears before body text if this lesson has one */}
      {lesson.hasAnimation && <AnimationSlot lessonId={lessonId} />}

      {/* Body content */}
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
          <p key={i} style={{ margin: 0 }}>
            {para}
          </p>
        ))}
      </div>

      {/* Divider */}
      <hr
        style={{
          border: 'none',
          borderTop: '1px solid var(--color-rule)',
          marginBottom: '2rem',
        }}
      />

      {/* Mark complete */}
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

      {/* Prev / Next navigation */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: '1rem',
          flexWrap: 'wrap',
        }}
      >
        <div>
          {canGoPrev && (
            <button
              onClick={() => onSelectLesson(prevLesson.moduleId, prevLesson.id)}
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
                alignItems: 'flex-start',
                gap: '0.2rem',
              }}
            >
              <span
                style={{
                  fontSize: '0.65rem',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                ← Previous
              </span>
              <span style={{ color: 'var(--color-ink)' }}>{prevLesson.title}</span>
            </button>
          )}
        </div>
        <div>
          {canGoNext && (
            <button
              onClick={() => onSelectLesson(nextLesson.moduleId, nextLesson.id)}
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
                alignItems: 'flex-end',
                gap: '0.2rem',
                textAlign: 'right',
              }}
            >
              <span
                style={{
                  fontSize: '0.65rem',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                Next →
              </span>
              <span style={{ color: 'var(--color-ink)' }}>{nextLesson.title}</span>
            </button>
          )}
        </div>
      </div>
    </article>
  )
}
