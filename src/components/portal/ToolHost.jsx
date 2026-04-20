import SpringLoadCalculator from './SpringLoadCalculator'

// Dispatcher for portal tools. Each tool slug maps to a component.
// Add new tools here as they ship.
const REGISTRY = {
  'spring-load-calculator': SpringLoadCalculator,
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
