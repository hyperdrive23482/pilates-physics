import { useState, useEffect, useCallback } from 'react'
import { Check, X, Award, RotateCcw } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import CertificateButton from '../CertificateButton'

/**
 * The graded assessment. Passing it is what issues the NPCP certificate.
 *
 * Nothing here holds the answer key. The questions arrive without it, and a
 * submitted attempt comes back saying only whether each answer was right,
 * never which option was correct, so retaking cannot assemble the key.
 *
 * The quiz is never locked. If someone has skipped modules they get a note
 * saying so, above a quiz they can still take. See the plan's Phase 3.
 */
export default function CourseQuiz({ workshop, user, modules, completed, onSelectModule }) {
  const [state, setState] = useState({ status: 'loading' })
  const [answers, setAnswers] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)

  const load = useCallback(async () => {
    setState({ status: 'loading' })
    setResult(null)
    setAnswers({})
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) throw new Error('Not signed in')

      const res = await fetch(`/api/course/quiz?webinarId=${workshop.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error ?? 'Could not load the quiz')
      setState({ status: 'ready', data: json })
    } catch (err) {
      setState({ status: 'error', message: err.message })
    }
  }, [workshop.id])

  useEffect(() => {
    load()
  }, [load])

  async function submit() {
    setSubmitting(true)
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const token = session?.access_token

      const res = await fetch('/api/course/quiz', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webinarId: workshop.id,
          answers: Object.entries(answers).map(([question_id, choice_index]) => ({
            question_id,
            choice_index,
          })),
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error ?? 'Could not submit the quiz')
      setResult(json)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      setState({ status: 'error', message: err.message })
    } finally {
      setSubmitting(false)
    }
  }

  if (state.status === 'loading') return <Muted>Loading the quiz…</Muted>
  if (state.status === 'error') {
    return <p style={{ color: '#ff7d7d', fontSize: '0.9rem' }}>{state.message}</p>
  }

  const { questions, pass_pct, passed, passed_at, best_attempt } = state.data

  if (!questions.length) {
    return (
      <Panel>
        <h2 style={{ ...headingStyle, marginTop: 0 }}>Final quiz</h2>
        <p style={bodyStyle}>
          The quiz has not been published yet. It appears here as soon as it is
          ready, and your progress is already saved.
        </p>
      </Panel>
    )
  }

  // A result just submitted, or a pass earned earlier. Either way they see the
  // outcome rather than a blank quiz.
  if (result) {
    return (
      <ResultView
        result={result}
        questions={questions}
        workshop={workshop}
        user={user}
        onRetake={load}
      />
    )
  }

  if (passed) {
    return (
      <PassedView
        workshop={workshop}
        user={user}
        best={best_attempt}
        passedAt={passed_at}
        // Reveals the questions again without discarding the pass. The server
        // keeps every attempt, and a later failure never removes an earlier
        // pass, so this is safe to offer.
        showQuiz={() => setState((s) => ({ ...s, data: { ...s.data, passed: false } }))}
      />
    )
  }

  const answered = questions.filter((q) => answers[q.id] != null).length
  const allAnswered = answered === questions.length
  const needed = Math.ceil((pass_pct / 100) * questions.length)

  return (
    <div>
      <h2 style={{ ...headingStyle, marginTop: 0 }}>Final quiz</h2>
      <p style={bodyStyle}>
        {questions.length} questions. You need {needed} right to pass and earn
        your certificate, and you can retake it as often as you like.
      </p>

      <SkippedNote modules={modules} completed={completed} onSelectModule={onSelectModule} />

      <ol style={{ listStyle: 'none', margin: '1.5rem 0 0', padding: 0 }}>
        {questions.map((q, i) => (
          <li key={q.id} style={{ marginBottom: '1.75rem' }}>
            <fieldset style={{ border: 'none', margin: 0, padding: 0 }}>
              <legend style={{ fontSize: '0.95rem', color: 'var(--color-ink)', marginBottom: '0.75rem' }}>
                <span style={{ color: 'var(--color-ink-muted)', marginRight: '0.4rem' }}>
                  {i + 1}.
                </span>
                {q.prompt}
              </legend>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {q.choices.map((choice, ci) => {
                  const selected = answers[q.id] === ci
                  return (
                    <label
                      key={ci}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.6rem',
                        padding: '0.6rem 0.75rem',
                        border: `1px solid ${selected ? 'var(--color-accent)' : 'var(--color-rule)'}`,
                        background: selected ? 'var(--color-surface)' : 'transparent',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        lineHeight: 1.5,
                      }}
                    >
                      <input
                        type="radio"
                        name={q.id}
                        checked={selected}
                        onChange={() => setAnswers((a) => ({ ...a, [q.id]: ci }))}
                        style={{ marginTop: '0.2rem', accentColor: 'var(--color-accent)' }}
                      />
                      <span>{choice}</span>
                    </label>
                  )
                })}
              </div>
            </fieldset>
          </li>
        ))}
      </ol>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          flexWrap: 'wrap',
          borderTop: '1px solid var(--color-rule)',
          paddingTop: '1.25rem',
        }}
      >
        <button
          type="button"
          onClick={submit}
          disabled={!allAnswered || submitting}
          style={{
            ...btnBase,
            background: 'var(--color-accent)',
            color: 'var(--color-accent-ink)',
            border: 'none',
            opacity: !allAnswered || submitting ? 0.5 : 1,
            cursor: !allAnswered || submitting ? 'not-allowed' : 'pointer',
          }}
        >
          {submitting ? 'Marking…' : 'Submit answers'}
        </button>
        <span style={{ fontSize: '0.83rem', color: 'var(--color-ink-muted)' }}>
          {allAnswered
            ? 'All questions answered.'
            : `${answered} of ${questions.length} answered.`}
        </span>
      </div>
    </div>
  )
}

// Informs, never blocks. Someone who jumped straight here probably did so by
// accident, and someone who did it deliberately is allowed to.
function SkippedNote({ modules, completed, onSelectModule }) {
  if (!modules?.length || !completed) return null
  const skipped = modules
    .map((m, i) => ({ ...m, index: i }))
    .filter((m) => !completed.has(m.id))
  if (skipped.length === 0) return null

  return (
    <div
      style={{
        border: '1px solid var(--color-rule)',
        borderLeft: '3px solid #c9a227',
        background: 'var(--color-surface)',
        padding: '0.85rem 1rem',
        fontSize: '0.87rem',
        lineHeight: 1.6,
      }}
    >
      You have not finished{' '}
      {skipped.length === modules.length
        ? 'any of the modules'
        : skipped.length === 1
        ? 'one module'
        : `${skipped.length} modules`}{' '}
      yet. You can still take the quiz.
      <div style={{ marginTop: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
        {skipped.slice(0, 8).map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => onSelectModule?.(String(m.index))}
            style={{
              padding: '0.25rem 0.55rem',
              background: 'transparent',
              border: '1px solid var(--color-rule)',
              color: 'var(--color-ink-muted)',
              fontSize: '0.75rem',
              fontFamily: 'var(--font-serif)',
              cursor: 'pointer',
            }}
          >
            {m.index + 1}. {m.title}
          </button>
        ))}
      </div>
    </div>
  )
}

function ResultView({ result, questions, workshop, user, onRetake }) {
  const { score, total, passed, needed, results } = result
  const byId = new Map(results.map((r) => [r.question_id, r]))

  return (
    <div>
      <div
        style={{
          border: '1px solid var(--color-rule)',
          borderLeft: `3px solid ${passed ? 'var(--color-accent)' : '#c9a227'}`,
          background: 'var(--color-surface)',
          padding: '1.5rem',
          marginBottom: '2rem',
        }}
      >
        <h2 style={{ ...headingStyle, marginTop: 0, marginBottom: '0.5rem' }}>
          {passed ? 'You passed' : 'Not quite yet'}
        </h2>
        <p style={{ ...bodyStyle, fontSize: '1.05rem' }}>
          {score} out of {total} correct. {needed} were needed to pass.
        </p>
        {passed ? (
          <>
            <p style={bodyStyle}>
              Your certificate is ready. It carries your name, the course, and
              today's date.
            </p>
            <CertificateButton workshop={workshop} user={user} />
          </>
        ) : (
          <>
            <p style={bodyStyle}>
              Have another look at the modules covering what you missed, then
              take it again. There is no limit on attempts.
            </p>
            <button
              type="button"
              onClick={onRetake}
              style={{
                ...btnBase,
                background: 'var(--color-accent)',
                color: 'var(--color-accent-ink)',
                border: 'none',
              }}
            >
              <RotateCcw size={15} /> Retake the quiz
            </button>
          </>
        )}
      </div>

      <h3 style={{ ...headingStyle, fontSize: '1.1rem' }}>Your answers</h3>
      <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {questions.map((q, i) => {
          const r = byId.get(q.id)
          if (!r) return null
          return (
            <li
              key={q.id}
              style={{
                borderTop: '1px solid var(--color-rule)',
                padding: '1rem 0',
              }}
            >
              <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
                <Mark correct={r.correct} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '0.92rem', color: 'var(--color-ink)' }}>
                    <span style={{ color: 'var(--color-ink-muted)', marginRight: '0.35rem' }}>
                      {i + 1}.
                    </span>
                    {q.prompt}
                  </div>
                  <div
                    style={{
                      fontSize: '0.85rem',
                      color: 'var(--color-ink-muted)',
                      marginTop: '0.35rem',
                    }}
                  >
                    You answered:{' '}
                    {r.chosen_index == null ? 'nothing' : q.choices[r.chosen_index]}
                  </div>
                  {r.explanation && (
                    <p
                      style={{
                        fontSize: '0.86rem',
                        lineHeight: 1.6,
                        color: 'var(--color-ink)',
                        margin: '0.55rem 0 0',
                        paddingLeft: '0.75rem',
                        borderLeft: '2px solid var(--color-rule)',
                      }}
                    >
                      {r.explanation}
                    </p>
                  )}
                </div>
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

function PassedView({ workshop, user, best, passedAt, showQuiz }) {
  return (
    <Panel>
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          color: 'var(--color-accent)',
          marginBottom: '0.75rem',
        }}
      >
        <Award size={20} />
        <strong style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem' }}>
          Course complete
        </strong>
      </div>
      <p style={bodyStyle}>
        You passed
        {best ? ` with ${best.score} out of ${best.total}` : ''}
        {passedAt ? ` on ${new Date(passedAt).toLocaleDateString()}` : ''}. Your
        certificate is below, and you can download it again any time.
      </p>
      <div style={{ margin: '1.25rem 0' }}>
        <CertificateButton workshop={workshop} user={user} />
      </div>
      <button
        type="button"
        onClick={showQuiz}
        style={{
          ...btnBase,
          background: 'transparent',
          color: 'var(--color-ink)',
          border: '1px solid var(--color-rule)',
        }}
      >
        <RotateCcw size={15} /> Take it again
      </button>
      <p style={{ fontSize: '0.78rem', color: 'var(--color-ink-muted)', marginTop: '0.75rem' }}>
        Retaking never removes a pass you already hold.
      </p>
    </Panel>
  )
}

function Mark({ correct }) {
  return (
    <span
      aria-label={correct ? 'Correct' : 'Incorrect'}
      style={{
        flexShrink: 0,
        width: '20px',
        height: '20px',
        marginTop: '0.1rem',
        borderRadius: '50%',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: correct ? 'var(--color-accent)' : 'transparent',
        border: correct ? 'none' : '1px solid #c9a227',
        color: correct ? 'var(--color-accent-ink)' : '#c9a227',
      }}
    >
      {correct ? <Check size={12} strokeWidth={3} /> : <X size={12} strokeWidth={3} />}
    </span>
  )
}

function Panel({ children }) {
  return (
    <div
      style={{
        border: '1px solid var(--color-rule)',
        background: 'var(--color-surface)',
        padding: '1.5rem',
      }}
    >
      {children}
    </div>
  )
}

function Muted({ children }) {
  return <p style={{ color: 'var(--color-ink-muted)', fontSize: '0.9rem' }}>{children}</p>
}

const headingStyle = {
  fontFamily: 'var(--font-serif)',
  fontSize: 'clamp(1.3rem, 3vw, 1.7rem)',
  lineHeight: 1.2,
  color: 'var(--color-ink)',
  margin: '0 0 1rem',
}

const bodyStyle = {
  fontSize: '0.95rem',
  lineHeight: 1.65,
  color: 'var(--color-ink)',
  margin: '0 0 0.75rem',
}

const btnBase = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.4rem',
  padding: '0.7rem 1.2rem',
  fontSize: '0.88rem',
  fontWeight: 500,
  fontFamily: 'var(--font-serif)',
  cursor: 'pointer',
}
