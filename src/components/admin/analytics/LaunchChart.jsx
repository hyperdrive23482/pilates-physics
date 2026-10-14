import { Bar, BarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { COLORS, formatCents, formatCount, formatDate } from './shared'

/**
 * Daily orders for one workshop launch, from the first order to the workshop
 * day, with the early bird close and the workshop date as reference lines.
 * Period funnels hide launch shape; this is where it lives.
 *
 * `launch` is one entry of the Revenue API's `launches` list.
 */
export default function LaunchChart({ launch, height = 260 }) {
  const data = (launch?.daily ?? []).map((d) => ({
    ...d,
    label: formatDate(d.date),
    full_price: d.orders - d.early_bird,
  }))
  const axisProps = { tick: { fontSize: 10, fill: COLORS.axis }, stroke: COLORS.grid, tickLine: false }
  const earlyBirdLabel = launch?.early_bird_day ? formatDate(launch.early_bird_day) : null
  const scheduledLabel = launch?.scheduled_day ? formatDate(launch.scheduled_day) : null
  const inSeries = (label) => label && data.some((d) => d.label === label)

  if (data.length === 0) {
    return (
      <p style={{ margin: 0, padding: '2rem 0', textAlign: 'center', fontSize: '0.85rem', color: 'var(--color-ink-muted)' }}>
        No orders recorded for this workshop yet.
      </p>
    )
  }

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 16, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} vertical={false} />
          <XAxis dataKey="label" {...axisProps} minTickGap={24} />
          <YAxis allowDecimals={false} {...axisProps} width={36} />
          <Tooltip cursor={{ fill: 'rgba(227,227,227,0.04)' }} content={<LaunchTooltip />} />
          <Bar dataKey="early_bird" stackId="orders" fill={COLORS.secondary} isAnimationActive={false} />
          <Bar dataKey="full_price" stackId="orders" fill={COLORS.primary} radius={[3, 3, 0, 0]} isAnimationActive={false} />
          {inSeries(earlyBirdLabel) ? (
            <ReferenceLine
              x={earlyBirdLabel}
              stroke={COLORS.warning}
              strokeDasharray="4 3"
              label={{ value: 'Early bird ends', position: 'top', fill: COLORS.warning, fontSize: 10 }}
            />
          ) : null}
          {inSeries(scheduledLabel) ? (
            <ReferenceLine
              x={scheduledLabel}
              stroke={COLORS.muted}
              strokeDasharray="4 3"
              label={{ value: 'Workshop', position: 'top', fill: COLORS.axis, fontSize: 10 }}
            />
          ) : null}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function LaunchTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
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
      <div style={{ color: 'var(--color-ink-muted)', marginBottom: 2 }}>{d.label}</div>
      <div style={{ fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>
        {formatCount(d.orders)} order{d.orders === 1 ? '' : 's'}
        {d.early_bird ? ` (${d.early_bird} early bird)` : ''} · {formatCents(d.net)}
      </div>
    </div>
  )
}
