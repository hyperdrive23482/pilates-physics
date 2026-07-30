// Shared prose styles for the Springs 101 primer and any page that renders a
// slice of it (the Spring Load Calculator embeds SpringBasics). Kept in a
// component-free module so react-refresh stays happy.

export const sectionLabelStyle = {
  fontSize: '0.7rem',
  textTransform: 'uppercase',
  letterSpacing: '0.15em',
  color: 'var(--color-ink-muted)',
  marginBottom: '1rem',
}

export const proseStyle = {
  fontSize: '0.95rem',
  lineHeight: '1.75',
  color: 'var(--color-ink-muted)',
  margin: '0 0 1.1rem',
}

export const strongStyle = { color: 'var(--color-ink)', fontWeight: 600 }

// Section titles: large serif in full ink so they read as skimmable anchors,
// not the small uppercase eyebrow used for minor labels (Units, brand names).
export const sectionHeadingStyle = {
  fontFamily: 'var(--font-serif)',
  fontSize: '1.85rem',
  lineHeight: '1.2',
  fontWeight: 600,
  color: 'var(--color-ink)',
  margin: '0 0 1.1rem',
}

// Ids and headings for the three foundational sections in SpringBasics, which
// both the primer and the Spring Load Calculator render. Exported so the
// primer's "On this page" contents list cannot drift from the real headings.
export const BASICS_SECTIONS = [
  { id: 'range', label: 'A spring is a range of weights, not a single one' },
  { id: 'read-graphs', label: "A spring's full range is one line on a graph" },
  { id: 'two-numbers', label: 'Two numbers define every spring' },
]
