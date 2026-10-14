import { BAD, Muted, SoftErrors } from './primitives'

/**
 * The loading, error and stale states every tab shares. Data already on
 * screen stays visible, dimmed, while a new range loads, so the page never
 * flashes back to a spinner on a range change.
 */
export default function TabFrame({ data, error, loading, stale, errors, children }) {
  if (error && !data) return <p style={{ color: BAD, fontSize: '0.85rem' }}>{error}</p>
  if (!data) return <Muted style={{ fontSize: '0.9rem' }}>Loading…</Muted>
  return (
    <div style={{ opacity: loading || stale ? 0.55 : 1, transition: 'opacity 0.15s ease' }}>
      {error ? <p style={{ color: BAD, fontSize: '0.85rem' }}>{error}</p> : null}
      <SoftErrors errors={errors} />
      {children}
    </div>
  )
}
