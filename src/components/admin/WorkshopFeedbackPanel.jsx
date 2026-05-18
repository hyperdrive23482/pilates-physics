import { Download } from 'lucide-react'
import StatCard from './StatCard'

const SHARE_BADGES = {
  'Yes, with my first name': {
    label: 'Quotable',
    color: '#4caf50',
    bg: 'rgba(76,175,80,0.15)',
  },
  'Yes, but keep me anonymous': {
    label: 'Anonymous',
    color: '#ffc107',
    bg: 'rgba(255,193,7,0.15)',
  },
  'No, please keep my responses private': {
    label: 'Private',
    color: '#f44336',
    bg: 'rgba(244,67,54,0.15)',
  },
}

const CSV_COLUMNS = [
  'created_at',
  'name',
  'email',
  'user_id',
  'years_teaching',
  'nps_score',
  'change_this_week',
  'aha_moment',
  'valuable_sections',
  'rushed_section',
  'confusing',
  'length_feedback',
  'share_permission',
  'next_workshop_topic',
  'anything_else',
]

function formatPercent(n, total) {
  if (!total) return '0%'
  return `${Math.round((n / total) * 100)}%`
}

function csvEscape(value) {
  if (value == null) return ''
  const str = Array.isArray(value) ? value.join('; ') : String(value)
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`
  return str
}

function downloadCsv(filename, rows) {
  const header = CSV_COLUMNS.join(',')
  const body = rows
    .map((r) => CSV_COLUMNS.map((c) => csvEscape(r[c])).join(','))
    .join('\n')
  const blob = new Blob([`${header}\n${body}`], {
    type: 'text/csv;charset=utf-8',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export default function WorkshopFeedbackPanel({ workshopTitle, workshopDate, data }) {
  if (!data || data.response_count === 0) {
    return (
      <p style={{ color: 'var(--color-ink-muted)', fontSize: '0.9rem' }}>
        No feedback submitted yet
        {workshopTitle ? ` for ${workshopTitle}` : ''}
        {workshopDate ? ` on ${workshopDate}` : ''}.
      </p>
    )
  }

  const total = data.response_count
  const csvName = `feedback-${data.workshop_title
    .replace(/\s+/g, '-')
    .toLowerCase()}-${data.workshop_date}.csv`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <p
            style={{
              fontSize: '0.7rem',
              fontWeight: 600,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: 'var(--color-ink-muted)',
              margin: '0 0 0.4rem',
            }}
          >
            {data.workshop_date}
          </p>
          <h2
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '1.4rem',
              color: 'var(--color-ink)',
              margin: 0,
            }}
          >
            {data.workshop_title}
          </h2>
        </div>
        <button
          type="button"
          onClick={() => downloadCsv(csvName, data.responses)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.6rem 1rem',
            background: 'transparent',
            color: 'var(--color-ink)',
            border: '1px solid var(--color-rule)',
            fontSize: '0.85rem',
            cursor: 'pointer',
            fontFamily: 'var(--font-serif)',
          }}
        >
          <Download size={14} /> Export CSV
        </button>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '1rem',
        }}
      >
        <StatCard label="Responses" value={total} />
        <StatCard label="Avg NPS" value={data.avg_nps ?? '—'} />
        <StatCard
          label="Promoters (9–10)"
          value={data.promoter_count}
          sublabel={formatPercent(data.promoter_count, total)}
        />
        <StatCard
          label="Detractors (1–6)"
          value={data.detractor_count}
          sublabel={formatPercent(data.detractor_count, total)}
        />
      </div>

      <Section title="NPS distribution">
        <BarList counts={data.nps_distribution} total={total} sort="key-asc" />
      </Section>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '2rem',
        }}
      >
        <Section title="Years teaching">
          <BarList counts={data.years_teaching_counts} total={total} />
        </Section>
        <Section title="Most valuable sections">
          <BarList counts={data.valuable_sections_counts} total={total} />
        </Section>
        <Section title="Rushed section">
          <BarList counts={data.rushed_section_counts} total={total} />
        </Section>
        <Section title="Length feedback">
          <BarList counts={data.length_feedback_counts} total={total} />
        </Section>
        <Section title="Share permission">
          <BarList counts={data.share_permission_counts} total={total} />
        </Section>
      </div>

      <Section title={`Free-text responses (${total})`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {data.responses.map((r) => (
            <ResponseCard key={r.id} response={r} />
          ))}
        </div>
      </Section>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <section>
      <h3
        style={{
          fontSize: '0.7rem',
          fontWeight: 600,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          color: 'var(--color-ink-muted)',
          margin: '0 0 1rem',
        }}
      >
        {title}
      </h3>
      {children}
    </section>
  )
}

function BarList({ counts, total, sort = 'value-desc' }) {
  let entries = Object.entries(counts)
  if (sort === 'key-asc') {
    entries.sort(([a], [b]) => Number(a) - Number(b))
  } else {
    entries.sort(([, a], [, b]) => b - a)
  }
  if (sort !== 'key-asc') entries = entries.filter(([, c]) => c > 0)

  if (!entries.length) {
    return (
      <p style={{ color: 'var(--color-ink-muted)', fontSize: '0.85rem' }}>
        No data
      </p>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {entries.map(([label, count]) => {
        const pct = total ? (count / total) * 100 : 0
        return (
          <div
            key={label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              fontSize: '0.85rem',
            }}
          >
            <div
              style={{
                width: '180px',
                flexShrink: 0,
                color: 'var(--color-ink)',
              }}
            >
              {label}
            </div>
            <div
              style={{
                flex: 1,
                position: 'relative',
                background: 'var(--color-rule)',
                height: '20px',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: `${pct}%`,
                  background: 'var(--color-accent)',
                }}
              />
            </div>
            <div
              style={{
                width: '70px',
                textAlign: 'right',
                fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                fontSize: '0.8rem',
                color: 'var(--color-ink-muted)',
              }}
            >
              {count} · {Math.round(pct)}%
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ResponseCard({ response: r }) {
  const shareBadge = SHARE_BADGES[r.share_permission] ?? null
  return (
    <article
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-rule)',
        padding: '1.5rem',
      }}
    >
      <header
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '0.5rem 1rem',
          marginBottom: '1.25rem',
          paddingBottom: '1rem',
          borderBottom: '1px solid var(--color-rule)',
        }}
      >
        <strong style={{ fontSize: '0.95rem', color: 'var(--color-ink)' }}>
          {r.name}
        </strong>
        <span style={{ fontSize: '0.8rem', color: 'var(--color-ink-muted)' }}>
          {r.email}
        </span>
        <span style={{ fontSize: '0.8rem', color: 'var(--color-ink-muted)' }}>
          · {r.years_teaching}
        </span>
        <span
          style={{
            marginLeft: 'auto',
            display: 'inline-flex',
            gap: '0.4rem',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <NpsChip score={r.nps_score} />
          <Badge
            label={r.user_id ? 'Portal' : 'Public'}
            color="#9ca3af"
            bg="rgba(156,163,175,0.15)"
          />
          {shareBadge && <Badge {...shareBadge} />}
        </span>
      </header>

      <div style={{ display: 'grid', gap: '1rem', fontSize: '0.9rem', lineHeight: 1.55 }}>
        <Field label="Q2 — Change this week">{r.change_this_week}</Field>
        <Field label="Q3 — Aha moment">{r.aha_moment}</Field>
        <Field label="Q4 — Valuable sections">
          {(r.valuable_sections ?? []).join(', ')}
        </Field>
        <Field label="Q5 — Rushed">{r.rushed_section}</Field>
        <Field label="Q6 — Confusing">{r.confusing}</Field>
        <Field label="Q7 — Length">{r.length_feedback}</Field>
        {r.next_workshop_topic && (
          <Field label="Q9 — Next workshop topic">{r.next_workshop_topic}</Field>
        )}
        {r.anything_else && (
          <Field label="Q10 — Anything else">{r.anything_else}</Field>
        )}
      </div>

      <p style={{ marginTop: '1rem', fontSize: '0.7rem', color: 'var(--color-ink-muted)' }}>
        Submitted {new Date(r.created_at).toLocaleString()}
      </p>
    </article>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <div
        style={{
          fontSize: '0.7rem',
          fontWeight: 600,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--color-ink-muted)',
          marginBottom: '0.3rem',
        }}
      >
        {label}
      </div>
      <div style={{ color: 'var(--color-ink)', whiteSpace: 'pre-wrap' }}>{children}</div>
    </div>
  )
}

function NpsChip({ score }) {
  let bg = 'rgba(156,163,175,0.15)'
  let color = '#9ca3af'
  if (score >= 9) {
    bg = 'rgba(76,175,80,0.15)'
    color = '#4caf50'
  } else if (score <= 6) {
    bg = 'rgba(244,67,54,0.15)'
    color = '#f44336'
  }
  return (
    <span
      style={{
        fontSize: '0.75rem',
        fontWeight: 600,
        padding: '0.2rem 0.5rem',
        background: bg,
        color,
        fontFamily: 'ui-monospace, SFMono-Regular, monospace',
      }}
    >
      NPS {score}
    </span>
  )
}

function Badge({ label, color, bg }) {
  return (
    <span
      style={{
        fontSize: '0.7rem',
        fontWeight: 600,
        letterSpacing: '0.05em',
        padding: '0.2rem 0.5rem',
        background: bg,
        color,
        textTransform: 'uppercase',
      }}
    >
      {label}
    </span>
  )
}
