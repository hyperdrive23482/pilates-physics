import SpringLoadCalculator from './SpringLoadCalculator'
import AnimationTool from './AnimationTool'

const animation = (slug) => () => <AnimationTool slug={slug} />

// Dispatcher for portal tools. Each tool slug maps to a component.
// Add new tools here as they ship.
const REGISTRY = {
  'spring-load-calculator': SpringLoadCalculator,
  'animation-spring': animation('animation-spring'),
  'animation-bicep-curl': animation('animation-bicep-curl'),
  'animation-bicep-curl-vertical': animation('animation-bicep-curl-vertical'),
  'animation-horizontal-spring-vertical-dumbbell': animation(
    'animation-horizontal-spring-vertical-dumbbell'
  ),
  'animation-tall-short': animation('animation-tall-short'),
  'animation-elastic-plastic': animation('animation-elastic-plastic'),
}

export default function ToolHost({ webinar }) {
  const Tool = REGISTRY[webinar.slug]
  if (!Tool) {
    return (
      <p style={{ color: 'var(--color-ink-muted)', fontSize: '0.9rem' }}>
        This tool isn&apos;t available yet.
      </p>
    )
  }
  return <Tool />
}
