import { useState } from 'react'
import { ClipboardCheck, Copy } from 'lucide-react'
import TabFrame from '../TabFrame'
import { useTabData } from '../useTabData'
import { EmptyPanel, Fraction, Note, Row, Section, Table, Td } from '../primitives'
import { NO_VALUE, formatCount, formatDateTime, formatDays, formatFraction } from '../shared'

/**
 * Courses only. The range select does not apply: a completion funnel is
 * about a cohort of buyers, and the API reports all time.
 */
export default function LearnersTab() {
  const { data, error, loading, stale } = useTabData('learners', 'all')
  const courses = data?.courses ?? []

  return (
    <TabFrame data={data} error={error} loading={loading} stale={stale} errors={data?.errors}>
      {courses.length === 0 ? (
        <EmptyPanel title="No courses yet">
          This tab reports module completion, quiz results and stalled learners for products of kind course. The
          first one appears here once it exists.
        </EmptyPanel>
      ) : (
        courses.map((c) => <CourseBlock key={c.id} course={c} usersMissing={Boolean(data?.errors?.users)} />)
      )}
    </TabFrame>
  )
}

function CourseBlock({ course: c, usersMissing }) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <h2
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: '1.25rem',
          color: 'var(--color-ink)',
          margin: '0 0 0.25rem',
        }}
      >
        {c.title}
      </h2>
      <p style={{ margin: '0 0 1.5rem', fontSize: '0.78rem', color: 'var(--color-ink-muted)' }}>
        {formatCount(c.enrolled)} enrolled · {formatCount(c.module_count)} modules · {formatCount(c.question_count)}{' '}
        quiz questions, pass mark {c.pass_pct}% · all time
        {c.unenrolled_active
          ? ` · ${c.unenrolled_active} with activity but no current entitlement, left out of the funnel`
          : ''}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
        <Section title="Completion funnel" note="Each step out of everyone enrolled" style={{ marginBottom: 0 }}>
          <div className="pp-card" style={{ padding: '0.5rem 1.25rem' }}>
            {c.funnel.map((step, i) => (
              <div
                key={step.key}
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: '0.75rem',
                  padding: '0.55rem 0',
                  borderBottom: i < c.funnel.length - 1 ? '1px solid var(--color-rule)' : 'none',
                  fontSize: '0.85rem',
                }}
              >
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--color-ink-dim)', width: '1.2rem' }}>
                  {i + 1}
                </span>
                <span style={{ flex: 1, color: 'var(--color-ink)' }}>{step.label}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--color-ink-muted)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                  {step.count === null ? NO_VALUE : i === 0 ? formatCount(step.count) : formatFraction(step.count, step.of)}
                </span>
              </div>
            ))}
          </div>
          <Note>
            Module steps are bookmarks: the Next button marks a module done without proving it was watched. The
            passed quiz is the record that carries the CEC. Certificate downloads come from the activity log.
          </Note>
        </Section>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <Section title="Time to progress" note="Median, from access granted" style={{ marginBottom: 0 }}>
            <div className="pp-card" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <Stat label="To first module" value={formatDays(c.timing.to_first_module_days)} hint={`${formatCount(c.timing.to_first_module_n)} learners`} />
              <Stat label="To a passed quiz" value={formatDays(c.timing.to_completion_days)} hint={`${formatCount(c.timing.to_completion_n)} learners`} />
            </div>
          </Section>

          <Section title="Quiz" style={{ marginBottom: 0 }}>
            <div className="pp-card" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
              <Stat label="Attempts" value={formatCount(c.quiz.attempts)} hint={`${formatCount(c.quiz.attempted)} people`} />
              <Stat label="Passed" value={<Fraction value={c.quiz.pass_rate} />} hint="of those who attempted" />
              <Stat label="Passed first try" value={<Fraction value={c.quiz.first_attempt_pass_rate} />} hint="of those who attempted" />
              <Stat label="Attempts per passer" value={c.quiz.attempts_per_passer ?? NO_VALUE} />
            </div>
          </Section>
        </div>
      </div>

      <Section title="Questions by miss rate" note="Share of graded attempts that got each question wrong">
        {c.quiz.questions.length === 0 ? (
          <EmptyPanel>No quiz questions.</EmptyPanel>
        ) : (
          <>
            <Table head={[['#', 'right'], ['Question'], ['Missed', 'right']]}>
              {[...c.quiz.questions]
                .sort((a, b) => (b.miss_rate ?? -1) - (a.miss_rate ?? -1) || a.position - b.position)
                .map((q) => (
                  <Row key={q.id}>
                    <Td align="right" mono muted>
                      {q.position}
                    </Td>
                    <Td>{q.prompt}</Td>
                    <Td align="right" mono>
                      {q.attempts > 0 ? formatFraction(q.misses, q.attempts) : NO_VALUE}
                    </Td>
                  </Row>
                ))}
            </Table>
            <Note>
              A question most people miss is either a teaching gap or a bad question, and both matter.
              {c.quiz.unmatched_attempts
                ? ` ${c.quiz.unmatched_attempts} attempt${c.quiz.unmatched_attempts === 1 ? '' : 's'} predate a change to the question list and ${c.quiz.unmatched_attempts === 1 ? 'is' : 'are'} left out.`
                : ''}
            </Note>
          </>
        )}
      </Section>

      <Section title="Stalled learners" note="Access granted over 14 days ago, under half the modules done, no pass">
        <StalledList rows={c.stalled} usersMissing={usersMissing} />
      </Section>
    </div>
  )
}

function StalledList({ rows, usersMissing }) {
  const [copied, setCopied] = useState(false)
  const emails = rows.map((r) => r.email).filter(Boolean)

  async function copy() {
    try {
      await navigator.clipboard.writeText(emails.join('\n'))
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // Clipboard access is a per-browser convenience.
    }
  }

  if (rows.length === 0) return <EmptyPanel>Nobody is stalled.</EmptyPanel>

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.75rem' }}>
        <button
          type="button"
          onClick={copy}
          disabled={emails.length === 0}
          className="pp-btn"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}
          title="Copy one email per line for a nudge broadcast"
        >
          {copied ? <ClipboardCheck size={12} /> : <Copy size={12} />}
          {copied ? 'Copied' : `Copy ${emails.length} email${emails.length === 1 ? '' : 's'}`}
        </button>
      </div>
      <Table head={[['Learner'], ['Access granted'], ['Days', 'right'], ['Modules', 'right'], ['Attempts', 'right'], ['Last active'], ['Last sign in']]}>
        {rows.map((r) => (
          <Row key={r.user_id}>
            <Td>
              {r.email ?? <span style={{ color: 'var(--color-ink-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>{r.user_id}</span>}
              {r.source && r.source !== 'stripe' ? <span style={{ marginLeft: '0.5rem', fontSize: '0.62rem', color: 'var(--color-ink-dim)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{r.source.replace('_', ' ')}</span> : null}
            </Td>
            <Td mono muted>
              {formatDateTime(r.granted_at)}
            </Td>
            <Td align="right" mono>
              {formatCount(r.days_since_purchase)}
            </Td>
            <Td align="right" mono>
              {r.modules_done} of {r.module_count}
            </Td>
            <Td align="right" mono muted>
              {formatCount(r.attempts)}
            </Td>
            <Td mono muted>
              {r.last_active_at ? formatDateTime(r.last_active_at) : 'Never started'}
            </Td>
            <Td mono muted>
              {r.last_sign_in_at ? formatDateTime(r.last_sign_in_at) : usersMissing ? NO_VALUE : 'Never'}
            </Td>
          </Row>
        ))}
      </Table>
      {usersMissing ? <Note tone="warn">Emails need admin_auth_users_brief (migration 063); ids are shown instead.</Note> : null}
    </>
  )
}

function Stat({ label, value, hint }) {
  return (
    <div>
      <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--color-ink-muted)' }}>{label}</p>
      <p style={{ margin: '0.15rem 0 0', fontFamily: 'var(--font-serif)', fontSize: '1.25rem', color: 'var(--color-ink)', fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </p>
      {hint ? <p style={{ margin: '0.15rem 0 0', fontSize: '0.68rem', color: 'var(--color-ink-dim)' }}>{hint}</p> : null}
    </div>
  )
}
