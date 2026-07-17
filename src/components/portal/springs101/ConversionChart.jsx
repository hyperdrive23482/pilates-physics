import springSpecs from '../../../data/springSpecs.json'
import { luminance } from './graphUtils'

// Color-grid conversion chart: columns are rough equivalence tiers, rows are
// brands, chips are the physical springs in their real colors. Modeled on the
// conversion grid from the "A Spring Is Not One Weight" blog post.

function Chip({ spring }) {
  const light = luminance(spring.displayColor) > 140
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '3px 8px',
        borderRadius: '2px',
        background: spring.displayColor,
        border: '1px solid var(--color-rule)',
        color: light ? '#1C1A17' : '#F1EFE8',
        fontSize: '0.72rem',
        fontWeight: 600,
        lineHeight: 1.3,
        whiteSpace: 'nowrap',
      }}
    >
      {spring.label}
    </span>
  )
}

export default function ConversionChart({ chart }) {
  const apparatus = springSpecs.apparatuses.find((a) => a.id === chart.apparatusId)
  const cols = chart.columns.length

  const headerCellStyle = {
    fontSize: '0.65rem',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: 'var(--color-ink-muted)',
    padding: '0.5rem 0.6rem',
    borderBottom: '1px solid var(--color-rule)',
  }

  return (
    <div className="pp-card" style={{ padding: '1.5rem', marginBottom: '1.25rem' }}>
      <h4
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: '1.1rem',
          color: 'var(--color-ink)',
          margin: '0 0 1rem',
        }}
      >
        {apparatus.name}
      </h4>
      <div style={{ overflowX: 'auto' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `minmax(96px, auto) repeat(${cols}, minmax(110px, 1fr))`,
            minWidth: `${96 + cols * 118}px`,
            alignItems: 'stretch',
          }}
        >
          {/* Header row */}
          <div style={headerCellStyle}></div>
          {chart.columns.map((col) => (
            <div key={col} style={{ ...headerCellStyle, textAlign: 'center' }}>
              {col}
            </div>
          ))}

          {/* Brand rows */}
          {chart.rows.map((row) => {
            const brand = apparatus.brands.find((b) => b.id === row.brandId)
            return [
              <div
                key={`${row.brandId}-name`}
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: 'var(--color-ink)',
                  padding: '0.75rem 0.6rem',
                  borderBottom: '1px solid var(--color-rule)',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {brand.name}
              </div>,
              ...row.cells.map((cell, ci) => (
                <div
                  key={`${row.brandId}-${ci}`}
                  style={{
                    padding: '0.75rem 0.6rem',
                    borderBottom: '1px solid var(--color-rule)',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '0.35rem',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {cell.length === 0 ? (
                    <span style={{ color: 'var(--color-ink-muted)', fontSize: '0.75rem' }}>·</span>
                  ) : (
                    cell.map((colorKey) => {
                      const spring = brand.springs.find((s) => s.color === colorKey)
                      return spring ? <Chip key={colorKey} spring={spring} /> : null
                    })
                  )}
                </div>
              )),
            ]
          })}
        </div>
      </div>
      {chart.note && (
        <p
          style={{
            fontSize: '0.8rem',
            lineHeight: 1.6,
            color: 'var(--color-ink-muted)',
            margin: '1rem 0 0',
          }}
        >
          {chart.note}
        </p>
      )}
    </div>
  )
}
