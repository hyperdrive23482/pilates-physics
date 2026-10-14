import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { COLORS, PERIOD_NOUN, formatCents, formatCount } from './shared'

/**
 * The chart under a tab's KPI boxes.
 *
 *   kind 'period'  period-comparison bars; the rightmost (current) bar is the
 *                  full accent and earlier periods recede.
 *   kind 'trend'   a daily area, for snapshot metrics that are point-in-time
 *                  values rather than sums.
 *
 * `series` is `[{label, rangeLabel, value}]` from shared.js. `format` picks the
 * axis and tooltip formatting: 'count' | 'currency' | 'percent'.
 */
export default function MetricChart({
  title,
  subtitle,
  series,
  range,
  kind = 'period',
  format = 'count',
  emptyText = 'No data to chart yet.',
  height = 300,
  selectable = false,
}) {
  const fmt = (v) =>
    format === 'currency' ? formatCents(v) : format === 'percent' ? `${Math.round(Number(v))}%` : formatCount(v)
  const axisFmt = (v) =>
    format === 'currency' ? `$${Math.round(Number(v) / 100).toLocaleString('en-US')}` : format === 'percent' ? `${v}%` : v

  const heading =
    title ?? (kind === 'trend' ? 'Daily trend' : `By ${PERIOD_NOUN[range] ?? 'period'}`)
  const note =
    subtitle ??
    (kind === 'trend'
      ? 'Recorded once a day. History accrues from when the daily snapshot began, so early on it may be sparse.'
      : `Each bar is one period of the selected length. The rightmost is the current ${range === 'all' ? 'month' : 'period'}.`) +
      (selectable ? ' Click a metric box above to change this chart.' : '')

  const axisProps = { tick: { fontSize: 11, fill: COLORS.axis }, stroke: COLORS.grid, tickLine: false }

  return (
    <div className="pp-card" style={{ padding: '1.25rem 1.5rem' }}>
      <div style={{ marginBottom: '1rem' }}>
        <h3 style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: '1rem', color: 'var(--color-ink)' }}>
          {heading}
        </h3>
        <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: 'var(--color-ink-muted)' }}>{note}</p>
      </div>

      {!series || series.length === 0 ? (
        <p
          style={{
            margin: 0,
            padding: '2.5rem 0',
            textAlign: 'center',
            fontSize: '0.85rem',
            color: 'var(--color-ink-muted)',
          }}
        >
          {emptyText}
        </p>
      ) : (
        <div style={{ width: '100%', height }}>
          <ResponsiveContainer width="100%" height="100%">
            {kind === 'trend' ? (
              <AreaChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} vertical={false} />
                <XAxis dataKey="label" {...axisProps} minTickGap={24} />
                <YAxis allowDecimals={false} tickFormatter={axisFmt} {...axisProps} width={56} />
                <Tooltip content={<ChartTooltip fmt={fmt} />} cursor={{ stroke: COLORS.muted }} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={COLORS.primary}
                  fill={COLORS.primary}
                  fillOpacity={0.18}
                  strokeWidth={2}
                  isAnimationActive={false}
                />
              </AreaChart>
            ) : (
              <BarChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} vertical={false} />
                <XAxis dataKey="label" {...axisProps} interval={0} minTickGap={8} />
                <YAxis
                  allowDecimals={false}
                  domain={format === 'percent' ? [0, 100] : undefined}
                  tickFormatter={axisFmt}
                  {...axisProps}
                  width={56}
                />
                <Tooltip content={<ChartTooltip fmt={fmt} />} cursor={{ fill: 'rgba(227,227,227,0.04)' }} />
                <Bar dataKey="value" radius={[3, 3, 0, 0]} isAnimationActive={false}>
                  {series.map((d, i) => (
                    <Cell key={i} fill={i === series.length - 1 ? COLORS.primary : COLORS.tertiary} />
                  ))}
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

function ChartTooltip({ active, payload, fmt }) {
  if (!active || !payload?.length) return null
  const point = payload[0].payload
  return (
    <div
      style={{
        background: 'var(--color-surface-raised)',
        border: '1px solid var(--color-rule)',
        borderRadius: 6,
        padding: '0.5rem 0.75rem',
        fontSize: '0.78rem',
        color: 'var(--color-ink)',
      }}
    >
      <div style={{ color: 'var(--color-ink-muted)', marginBottom: 2 }}>{point.rangeLabel ?? point.label}</div>
      <div style={{ fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>{fmt(point.value)}</div>
    </div>
  )
}
