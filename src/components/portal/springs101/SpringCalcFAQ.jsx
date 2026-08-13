import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

// FAQ accordion for the Spring Load Calculator. Lived inside
// SpringLoadCalculator.jsx until it became one of three tabbed panels; moved
// here so it sits with the other Springs 101 content the calculator embeds.

const FAQ_ITEMS = [
  {
    id: 'data-source',
    q: 'Where does this spring data come from?',
    a: (
      <>
        <p style={{ margin: '0 0 0.75rem' }}>
          Spring data was compiled from publicly available manufacturer
          specifications with the exception of Gratz, which was a measurement of
          two new Gratz Reformer springs done by Kaleen.
        </p>
        <p style={{ margin: 0 }}>
          Reformer brands: Balanced Body, Stott, Align Pilates, Peak Pilates,
          BASI, and Gratz. Tower and Chair brands: Balanced Body, Merrithew, and
          BASI.
        </p>
      </>
    ),
  },
  {
    id: 'basic-equation',
    q: 'What is the basic spring force equation?',
    a: (
      <>
        <p style={{ margin: '0 0 0.75rem' }}>
          A linear spring follows{' '}
          <code style={{ fontWeight: 600 }}>F(x) = k · x + b</code>, where:
        </p>
        <ul style={{ margin: '0 0 0.75rem', paddingLeft: '1.25rem' }}>
          <li><code>F</code> — force in pounds</li>
          <li><code>x</code> — extension in inches (how far the spring is stretched from rest)</li>
          <li><code>k</code> — spring stiffness (how much heavier the load gets per additional inch)</li>
          <li><code>b</code> — preload (the load already on the spring at zero extension)</li>
        </ul>
        <p style={{ margin: 0 }}>
          <strong>Your takeaway:</strong> Springs get heavier the more they stretch.
        </p>
      </>
    ),
  },
  {
    id: 'represent-my-springs',
    q: 'Does this information represent my springs?',
    a: (
      <>
        <p style={{ margin: '0 0 0.75rem' }}>
          Probably very close, but not exactly. Real springs vary based on age and
          use plus environmental conditions.
        </p>
        <p style={{ margin: 0 }}>
          Use this as a teaching reference and a starting point — not a calibrated
          load measurement that&apos;s exactly representative of your setup.
        </p>
      </>
    ),
  },
  {
    id: 'multiple-springs',
    q: 'What is the formula for finding the load of multiple springs at once?',
    a: (
      <p style={{ margin: 0 }}>
        Simply add the total weight of each spring at that extension. For example,
        two reds and a green Balanced Body springs at 10″ extension are 18 lbs,
        18 lbs, and 21.7 lbs. So the total weight of all those springs is{' '}
        18 + 18 + 21.7 = 57.7 lbs.
      </p>
    ),
  },
  {
    id: 'modes',
    q: "What's the difference between Sum and Compare modes?",
    a: (
      <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
        <li>
          <strong>Sum</strong> — sums every selected spring (with quantity) into one
          combined load curve. Use this to plan a real Reformer setup.
        </li>
        <li style={{ marginTop: '0.5rem' }}>
          <strong>Compare</strong> — shows each unique spring as its own line
          (quantity is ignored). Use this to see how brands or colors stack up
          against each other.
        </li>
      </ul>
    ),
  },
  {
    id: 'apparatus',
    q: 'What apparatus are these springs for?',
    a: (
      <p style={{ margin: 0 }}>
        Use the <strong>Apparatus</strong> toggle to switch between{' '}
        <strong>Reformer</strong>, <strong>Tower</strong>, and{' '}
        <strong>Chair</strong> springs. Each apparatus has its own spring set and
        extension range, since the springs and their travel differ. Other
        apparatus are not covered here yet.
      </p>
    ),
  },
  {
    id: 'units',
    q: 'Can I see loads in kilograms instead of pounds?',
    a: (
      <p style={{ margin: 0 }}>
        Yes. Use the <strong>Units</strong> toggle to switch the whole graph
        between pounds and inches (lbs · in) and kilograms and centimeters
        (kg · cm). The curves stay the same, only the numbers and axis labels
        change.
      </p>
    ),
  },
  {
    id: 'preload',
    q: 'Why does the force start above zero?',
    a: (
      <p style={{ margin: 0 }}>
        At zero extension (springs at rest) each spring has some level of
        pretension. This is the force it takes to initially open the spring.
      </p>
    ),
  },
]

function FAQItem({ item, isOpen, onToggle }) {
  return (
    <div style={{ borderBottom: '1px solid var(--color-rule)' }}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          padding: '1rem 0',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          color: 'var(--color-ink)',
          fontFamily: 'var(--font-serif)',
          fontSize: '0.95rem',
          fontWeight: '500',
        }}
      >
        <span>{item.q}</span>
        <ChevronDown
          size={16}
          style={{
            color: 'var(--color-ink-muted)',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
            flexShrink: 0,
          }}
        />
      </button>
      {isOpen && (
        <div
          style={{
            padding: '0 0 1.25rem',
            color: 'var(--color-ink-muted)',
            fontFamily: 'var(--font-serif)',
            fontSize: '0.9rem',
            lineHeight: '1.65',
          }}
        >
          {item.a}
        </div>
      )}
    </div>
  )
}

export default function SpringCalcFAQ() {
  const [openIds, setOpenIds] = useState(new Set())
  function toggle(id) {
    setOpenIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }
  return (
    <section className="spring-calc-faq">
      <div style={{ borderTop: '1px solid var(--color-rule)' }}>
        {FAQ_ITEMS.map((item) => (
          <FAQItem
            key={item.id}
            item={item}
            isOpen={openIds.has(item.id)}
            onToggle={() => toggle(item.id)}
          />
        ))}
      </div>
    </section>
  )
}
