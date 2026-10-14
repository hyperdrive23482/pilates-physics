import { DATE_RANGES, DATE_RANGE_LABELS } from './shared'

/** The one range control every analytics page shares. */
export default function DateRangeSelect({ value, onChange, id = 'date-range' }) {
  return (
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem' }}>
      <span className="pp-section-label" style={{ fontSize: '0.6rem' }} htmlFor={id}>
        Range
      </span>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          background: 'var(--color-surface)',
          color: 'var(--color-ink)',
          border: '1px solid var(--color-rule)',
          borderRadius: 4,
          padding: '0.4rem 0.6rem',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.75rem',
        }}
      >
        {DATE_RANGES.map((r) => (
          <option key={r} value={r}>
            {DATE_RANGE_LABELS[r]}
          </option>
        ))}
      </select>
    </label>
  )
}
