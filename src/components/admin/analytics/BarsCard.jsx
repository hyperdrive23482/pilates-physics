import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { COLORS, formatCount } from './shared'

/**
 * A small bar chart over fixed categories (weekdays, hours of the day). The
 * largest bar is the full accent so the peak reads at a glance.
 *
 * `data` is `[{label, value}]`.
 */
export default function BarsCard({ title, subtitle, data, height = 200, emptyText = 'Nothing recorded yet.' }) {
  const max = Math.max(0, ...(data ?? []).map((d) => d.value))
  const axisProps = { tick: { fontSize: 10, fill: COLORS.axis }, stroke: COLORS.grid, tickLine: false }
  return (
    <div className="pp-card" style={{ padding: '1.25rem 1.5rem' }}>
      <div style={{ marginBottom: '0.75rem' }}>
        <h3 style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: '1rem', color: 'var(--color-ink)' }}>{title}</h3>
        {subtitle ? (
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: 'var(--color-ink-muted)' }}>{subtitle}</p>
        ) : null}
      </div>
      {max === 0 ? (
        <p style={{ margin: 0, padding: '1.5rem 0', textAlign: 'center', fontSize: '0.85rem', color: 'var(--color-ink-muted)' }}>
          {emptyText}
        </p>
      ) : (
        <div style={{ width: '100%', height }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} vertical={false} />
              <XAxis dataKey="label" {...axisProps} interval={data.length > 12 ? 2 : 0} />
              <YAxis allowDecimals={false} {...axisProps} width={36} />
              <Tooltip
                cursor={{ fill: 'rgba(227,227,227,0.04)' }}
                content={({ active, payload }) =>
                  active && payload?.length ? (
                    <div
                      style={{
                        background: 'var(--color-surface-raised)',
                        border: '1px solid var(--color-rule)',
                        borderRadius: 6,
                        padding: '0.4rem 0.6rem',
                        fontSize: '0.75rem',
                        color: 'var(--color-ink)',
                      }}
                    >
                      {payload[0].payload.label}: {formatCount(payload[0].value)}
                    </div>
                  ) : null
                }
              />
              <Bar dataKey="value" radius={[3, 3, 0, 0]} isAnimationActive={false}>
                {data.map((d, i) => (
                  <Cell key={i} fill={d.value === max ? COLORS.primary : COLORS.tertiary} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
