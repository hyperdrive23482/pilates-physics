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

function formatCellValue(question, value) {
  if (value == null) return ''
  if (question?.type === 'multi_select' && Array.isArray(value)) {
    return value.join(', ')
  }
  if (typeof value === 'string') return value
  return String(value)
}

function downloadCsv(filename, headers, rows) {
  const headerLine = headers.map((h) => csvEscape(h.label)).join(',')
  const body = rows
    .map((r) => headers.map((h) => csvEscape(h.value(r))).join(','))
    .join('\n')
  const blob = new Blob([`${headerLine}\n${body}`], {
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

function shareValueFromResponse(r) {
  const normalized = r.responses_normalized ?? {}
  return normalized.share_permission ?? r.share_permission ?? null
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
  const config = data.survey_config
  const questions = Array.isArray(config?.questions) ? config.questions : []
  const npsQuestion = questions.find((q) => q.type === 'nps')

  const csvHeaders = [
    { label: 'submitted_at', value: (r) => r.created_at },
    { label: 'name', value: (r) => r.name },
    { label: 'email', value: (r) => r.email },
    { label: 'user_id', value: (r) => r.user_id ?? '' },
    ...questions.map((q) => ({
      label: q.label,
      value: (r) => formatCellValue(q, (r.responses_normalized ?? {})[q.id]),
    })),
  ]
  const csvName = `feedback-${(data.workshop_title ?? 'workshop')
    .replace(/\s+/g, '-')
    .toLowerCase()}-${data.workshop_date ?? 'undated'}.csv`

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
          onClick={() => downloadCsv(csvName, csvHeaders, data.responses)}
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
        {data.nps && (
          <>
            <StatCard label="Avg NPS" value={data.nps.avg ?? '-'} />
            <StatCard
              label="Promoters (9-10)"
              value={data.nps.promoter_count ?? 0}
              sublabel={formatPercent(data.nps.promoter_count ?? 0, total)}
            />
            <StatCard
              label="Detractors (1-6)"
              value={data.nps.detractor_count ?? 0}
              sublabel={formatPercent(data.nps.detractor_count ?? 0, total)}
            />
          </>
        )}
      </div>

      {data.nps && (
        <Section title="NPS distribution">
          <BarList counts={data.nps.distribution} total={total} sort="key-asc" />
        </Section>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '2rem',
        }}
      >
        {questions
          .filter((q) => q.type === 'single_select' || q.type === 'multi_select')
          .map((q) => (
            <Section key={q.id} title={q.label}>
              <BarList counts={data.aggregates?.[q.id] ?? {}} total={total} />
            </Section>
          ))}
      </div>

      <Section title={`Free-text responses (${total})`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {data.responses.map((r) => (
            <ResponseCard key={r.id} response={r} questions={questions} npsQuestion={npsQuestion} />
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
  let entries = Object.entries(counts ?? {})
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

function ResponseCard({ response: r, questions, npsQuestion }) {
  const normalized = r.responses_normalized ?? {}
  const shareValue = shareValueFromResponse(r)
  const shareBadge = shareValue ? SHARE_BADGES[shareValue] : null
  const npsValue = npsQuestion ? normalized[npsQuestion.id] : null

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
        <span
          style={{
            marginLeft: 'auto',
            display: 'inline-flex',
            gap: '0.4rem',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          {npsValue != null && <NpsChip score={npsValue} />}
          <Badge
            label={r.user_id ? 'Portal' : 'Public'}
            color="#9ca3af"
            bg="rgba(156,163,175,0.15)"
          />
          {shareBadge && <Badge {...shareBadge} />}
        </span>
      </header>

      <div style={{ display: 'grid', gap: '1rem', fontSize: '0.9rem', lineHeight: 1.55 }}>
        {questions
          .filter((q) => q.type !== 'nps')
          .map((q) => {
            const value = normalized[q.id]
            const empty =
              value == null ||
              (typeof value === 'string' && value.trim() === '') ||
              (Array.isArray(value) && value.length === 0)
            if (empty) return null
            return (
              <Field key={q.id} label={q.label}>
                {formatCellValue(q, value)}
              </Field>
            )
          })}
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
