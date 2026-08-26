import { useEffect, useRef } from 'react'
import { track } from '../../lib/track'
import SpringLoadCalculator from './SpringLoadCalculator'
import AnimationTool from './AnimationTool'
import ReformerForceModeler from './reformer/ReformerForceModeler'
import Springs101 from './springs101/Springs101'
import ClassSimulator from './classSimulator/ClassSimulator'

const animation = (slug) => () => <AnimationTool slug={slug} />

// Dispatcher for portal tools. Each tool slug maps to a component.
// Add new tools here as they ship.
const REGISTRY = {
  'spring-load-calculator': SpringLoadCalculator,
  'springs-101': Springs101,
  'reformer-force-modeler': ReformerForceModeler,
  'class-simulator': ClassSimulator,
  'animation-spring': animation('animation-spring'),
  'animation-bicep-curl': animation('animation-bicep-curl'),
  'animation-bicep-curl-vertical': animation('animation-bicep-curl-vertical'),
  'animation-horizontal-spring-vertical-dumbbell': animation(
    'animation-horizontal-spring-vertical-dumbbell'
  ),
  'animation-tall-short': animation('animation-tall-short'),
  'animation-elastic-plastic': animation('animation-elastic-plastic'),
  'animation-bridge-knee-torque': animation('animation-bridge-knee-torque'),
  'animation-feet-in-straps-hip-torque': animation('animation-feet-in-straps-hip-torque'),
  'animation-chair-pedal-force': animation('animation-chair-pedal-force'),
  'animation-push-through-bar-force': animation('animation-push-through-bar-force'),
}

export default function ToolHost({ workshop }) {
  const Tool = REGISTRY[workshop.slug]

  // The animation-* tools fetch their HTML from api/portal/animation.js, which
  // logs tool_open server-side. The remaining four are pure client components
  // that make no server call, so a browser-asserted event is the only coverage
  // available for them. Logging every tool here would double-count the
  // animations, so this deliberately skips them.
  const logged = useRef(null)
  useEffect(() => {
    if (!Tool || workshop.slug.startsWith('animation-')) return
    if (logged.current === workshop.slug) return
    logged.current = workshop.slug
    track('tool_open', { webinar_id: workshop.id, tool_slug: workshop.slug })
  }, [Tool, workshop.id, workshop.slug])

  if (!Tool) {
    return (
      <p style={{ color: 'var(--color-ink-muted)', fontSize: '0.9rem' }}>
        This tool isn&apos;t available yet.
      </p>
    )
  }
  return <Tool />
}
