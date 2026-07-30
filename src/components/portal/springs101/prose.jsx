import { proseStyle, sectionHeadingStyle } from './proseStyles'

// Shared prose primitives for the Springs 101 primer and any page that
// renders a slice of it (the Spring Load Calculator embeds SpringBasics).
// Styles live in ./proseStyles so both hosts render identically.

export function Prose({ children }) {
  return <p style={proseStyle}>{children}</p>
}

// One-line "the gist" callout under a section heading, so someone skimming
// gets the point before deciding whether to read the full prose.
export function Takeaway({ children }) {
  return (
    <div
      style={{
        borderLeft: '3px solid var(--color-accent)',
        padding: '0.1rem 0 0.1rem 1rem',
        margin: '0 0 1.5rem',
      }}
    >
      <div
        style={{
          fontSize: '0.65rem',
          textTransform: 'uppercase',
          letterSpacing: '0.15em',
          fontWeight: 600,
          color: 'var(--color-accent)',
          marginBottom: '0.35rem',
        }}
      >
        tldr;
      </div>
      <p
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: '1.05rem',
          lineHeight: '1.5',
          color: 'var(--color-ink)',
          margin: 0,
        }}
      >
        {children}
      </p>
    </div>
  )
}

export function Section({ id, label, takeaway, children }) {
  return (
    <section id={id} style={{ marginBottom: '3rem', scrollMarginTop: '1.5rem' }}>
      <h2 style={sectionHeadingStyle}>{label}</h2>
      {takeaway ? <Takeaway>{takeaway}</Takeaway> : null}
      {children}
    </section>
  )
}
