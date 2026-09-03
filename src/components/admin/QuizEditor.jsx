import { useState, useEffect, useCallback } from 'react'
import { Trash2, Plus, ArrowUp, ArrowDown, Pencil, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'

// The graded quiz. This is the only assessment in a course, and passing it is
// what issues the NPCP certificate, so the number of questions and the pass
// mark have to agree with each other.
//
// These rows carry the answer key. RLS on quiz_questions has an admin policy
// and nothing else, so a buyer's token cannot read this table at all; they
// only ever see questions through the grading endpoint, which strips
// correct_index. That is why this editor can write straight from the browser
// with no admin API route. See migration 044.
//
// Reordering uses the reorder_quiz_questions RPC for the same deferred
// constraint reason as the curriculum.

const MIN_CHOICES = 2
const MAX_CHOICES = 6

const emptyDraft = () => ({
  prompt: '',
  choices: ['', '', '', ''],
  correct_index: 0,
  explanation: '',
})

export default function QuizEditor({ workshop }) {
  const workshopId = workshop?.id
  const passPct = workshop?.quiz_pass_pct ?? 80

  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [draft, setDraft] = useState(null)
  const [saving, setSaving] = useState(false)
  const [busy, setBusy] = useState(false)

  const refetch = useCallback(async () => {
    if (!workshopId) {
      setQuestions([])
      setLoading(false)
      return
    }
    setLoading(true)
    const { data, error: err } = await supabase
      .from('quiz_questions')
      .select('*')
      .eq('webinar_id', workshopId)
      .order('sort_order', { ascending: true })
    if (err) setError(err.message)
    else setQuestions(data ?? [])
    setLoading(false)
  }, [workshopId])

  useEffect(() => {
    refetch()
  }, [refetch])

  function startEdit(q) {
    setError(null)
    setEditingId(q.id)
    setDraft({
      prompt: q.prompt ?? '',
      choices: Array.isArray(q.choices) ? [...q.choices] : ['', ''],
      correct_index: q.correct_index ?? 0,
      explanation: q.explanation ?? '',
    })
  }

  function startAdd() {
    if (!workshopId) return
    setError(null)
    setEditingId('new')
    setDraft(emptyDraft())
  }

  function cancel() {
    setEditingId(null)
    setDraft(null)
    setError(null)
  }

  async function save() {
    if (!draft) return

    const prompt = draft.prompt.trim()
    if (!prompt) return setError('The question text is required')

    // Blank choices are dropped rather than saved, so a half-filled row of
    // four inputs does not become an unanswerable question.
    const kept = []
    let correct = -1
    draft.choices.forEach((c, i) => {
      if (c.trim()) {
        if (i === draft.correct_index) correct = kept.length
        kept.push(c.trim())
      }
    })

    if (kept.length < MIN_CHOICES) return setError(`Give at least ${MIN_CHOICES} answer choices`)
    if (correct < 0) return setError('Mark which choice is correct. The one you marked is blank.')

    const payload = {
      prompt,
      choices: kept,
      correct_index: correct,
      explanation: draft.explanation.trim() || null,
    }

    setSaving(true)
    setError(null)
    if (editingId === 'new') {
      const nextOrder = questions.length
        ? Math.max(...questions.map((q) => q.sort_order ?? 0)) + 1
        : 0
      const { error: err } = await supabase
        .from('quiz_questions')
        .insert({ webinar_id: workshopId, sort_order: nextOrder, ...payload })
      setSaving(false)
      if (err) return setError(err.message)
    } else {
      const { error: err } = await supabase
        .from('quiz_questions')
        .update(payload)
        .eq('id', editingId)
      setSaving(false)
      if (err) return setError(err.message)
    }
    setEditingId(null)
    setDraft(null)
    refetch()
  }

  async function remove(q) {
    if (!confirm('Delete this question?')) return
    const { error: err } = await supabase.from('quiz_questions').delete().eq('id', q.id)
    if (err) return setError(err.message)
    refetch()
  }

  async function move(id, direction) {
    const idx = questions.findIndex((q) => q.id === id)
    const swap = direction === 'up' ? idx - 1 : idx + 1
    if (idx < 0 || swap < 0 || swap >= questions.length) return

    const next = [...questions]
    ;[next[idx], next[swap]] = [next[swap], next[idx]]
    setQuestions(next.map((q, i) => ({ ...q, sort_order: i })))
    setBusy(true)
    const { error: err } = await supabase.rpc('reorder_quiz_questions', {
      p_webinar_id: workshopId,
      p_question_ids: next.map((q) => q.id),
    })
    setBusy(false)
    if (err) setError(err.message)
    refetch()
  }

  if (!workshopId) return <Muted>Save the course first to start writing questions.</Muted>
  if (loading) return <Muted>Loading quiz…</Muted>

  const isEditing = editingId !== null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <PassMarkBanner count={questions.length} passPct={passPct} />

      {error && <p style={{ color: '#ff7d7d', fontSize: '0.85rem', margin: 0 }}>{error}</p>}

      {questions.length === 0 && editingId !== 'new' ? (
        <Muted>No questions yet.</Muted>
      ) : (
        questions.map((q, idx) =>
          editingId === q.id ? (
            <QuestionForm
              key={q.id}
              draft={draft}
              saving={saving}
              setDraft={setDraft}
              onSave={save}
              onCancel={cancel}
            />
          ) : (
            <QuestionRow
              key={q.id}
              question={q}
              index={idx}
              isFirst={idx === 0}
              isLast={idx === questions.length - 1}
              disabled={isEditing || busy}
              onEdit={() => startEdit(q)}
              onMoveUp={() => move(q.id, 'up')}
              onMoveDown={() => move(q.id, 'down')}
              onDelete={() => remove(q)}
            />
          ),
        )
      )}

      {editingId === 'new' ? (
        <QuestionForm
          draft={draft}
          saving={saving}
          setDraft={setDraft}
          onSave={save}
          onCancel={cancel}
        />
      ) : (
        <div>
          <button type="button" onClick={startAdd} disabled={isEditing} style={primaryBtn(isEditing)}>
            <Plus size={14} /> Add question
          </button>
        </div>
      )}
    </div>
  )
}

// A pass mark is a percentage, so the number of questions decides what it
// actually costs to fail one. Spelling that out here stops the two drifting
// apart silently.
function PassMarkBanner({ count, passPct }) {
  const needed = count > 0 ? Math.ceil((passPct / 100) * count) : 0
  const ok = count === 10
  return (
    <div
      style={{
        border: '1px solid var(--color-rule)',
        borderLeft: `3px solid ${ok ? 'var(--color-accent)' : '#c9a227'}`,
        background: 'var(--color-surface)',
        padding: '0.8rem 1rem',
        fontSize: '0.85rem',
      }}
    >
      <strong>
        {count} question{count === 1 ? '' : 's'}
      </strong>
      <span style={{ color: 'var(--color-ink-muted)' }}>
        {' '}
        · pass mark {passPct}%
        {count > 0 && `, so ${needed} of ${count} correct to pass`}
      </span>
      {count !== 10 && (
        <div style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)', marginTop: '0.3rem' }}>
          {count < 10
            ? `The course is specified as a ten question assessment. ${10 - count} to go.`
            : 'More than ten questions. Intentional?'}
        </div>
      )}
      <div style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)', marginTop: '0.3rem' }}>
        Change the pass mark on the Details tab.
      </div>
    </div>
  )
}

function QuestionRow({ question: q, index, isFirst, isLast, disabled, onEdit, onMoveUp, onMoveDown, onDelete }) {
  const choices = Array.isArray(q.choices) ? q.choices : []
  return (
    <div
      style={{
        border: '1px solid var(--color-rule)',
        background: 'var(--color-surface)',
        padding: '1rem',
        display: 'flex',
        gap: '0.75rem',
      }}
    >
      <span
        aria-hidden="true"
        style={{
          flexShrink: 0,
          width: '26px',
          height: '26px',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid var(--color-rule)',
          fontSize: '0.75rem',
          color: 'var(--color-ink-muted)',
        }}
      >
        {index + 1}
      </span>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.92rem', color: 'var(--color-ink)', marginBottom: '0.45rem' }}>
          {q.prompt}
        </div>
        <ol style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.82rem' }}>
          {choices.map((c, i) => (
            <li
              key={i}
              style={{
                color: i === q.correct_index ? '#4a9d5f' : 'var(--color-ink-muted)',
                fontWeight: i === q.correct_index ? 600 : 400,
              }}
            >
              {c}
              {i === q.correct_index && ' ✓'}
            </li>
          ))}
        </ol>
        {q.explanation && (
          <div
            style={{
              fontSize: '0.78rem',
              color: 'var(--color-ink-muted)',
              marginTop: '0.5rem',
              fontStyle: 'italic',
            }}
          >
            {q.explanation}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.25rem', flexShrink: 0 }}>
        <IconBtn disabled={disabled} onClick={onEdit} aria-label="Edit">
          <Pencil size={14} />
        </IconBtn>
        <IconBtn disabled={disabled || isFirst} onClick={onMoveUp} aria-label="Move up">
          <ArrowUp size={14} />
        </IconBtn>
        <IconBtn disabled={disabled || isLast} onClick={onMoveDown} aria-label="Move down">
          <ArrowDown size={14} />
        </IconBtn>
        <IconBtn disabled={disabled} onClick={onDelete} aria-label="Delete">
          <Trash2 size={14} />
        </IconBtn>
      </div>
    </div>
  )
}

function QuestionForm({ draft, saving, setDraft, onSave, onCancel }) {
  function setChoice(i, value) {
    setDraft((d) => {
      const choices = [...d.choices]
      choices[i] = value
      return { ...d, choices }
    })
  }

  function addChoice() {
    setDraft((d) => (d.choices.length >= MAX_CHOICES ? d : { ...d, choices: [...d.choices, ''] }))
  }

  function removeChoice(i) {
    setDraft((d) => {
      if (d.choices.length <= MIN_CHOICES) return d
      const choices = d.choices.filter((_, idx) => idx !== i)
      let correct = d.correct_index
      if (i === correct) correct = 0
      else if (i < correct) correct -= 1
      return { ...d, choices, correct_index: correct }
    })
  }

  return (
    <div
      style={{
        border: '1px solid var(--color-accent)',
        background: 'var(--color-surface)',
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
      }}
    >
      <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
        <span style={labelStyle}>Question *</span>
        <textarea
          value={draft.prompt}
          onChange={(e) => setDraft((d) => ({ ...d, prompt: e.target.value }))}
          rows={2}
          style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
          autoFocus
        />
      </label>

      <div>
        <span style={labelStyle}>Choices, and which one is right *</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.4rem' }}>
          {draft.choices.map((c, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="radio"
                name="correct"
                checked={draft.correct_index === i}
                onChange={() => setDraft((d) => ({ ...d, correct_index: i }))}
                aria-label={`Choice ${i + 1} is correct`}
                style={{ accentColor: 'var(--color-accent)' }}
              />
              <input
                type="text"
                value={c}
                onChange={(e) => setChoice(i, e.target.value)}
                placeholder={`Choice ${i + 1}`}
                style={{ ...inputStyle, flex: 1 }}
              />
              <IconBtn
                disabled={draft.choices.length <= MIN_CHOICES}
                onClick={() => removeChoice(i)}
                aria-label={`Remove choice ${i + 1}`}
              >
                <X size={13} />
              </IconBtn>
            </div>
          ))}
        </div>
        {draft.choices.length < MAX_CHOICES && (
          <button type="button" onClick={addChoice} style={{ ...ghostBtn, marginTop: '0.5rem' }}>
            Add a choice
          </button>
        )}
        <p style={{ fontSize: '0.72rem', color: 'var(--color-ink-muted)', margin: '0.5rem 0 0' }}>
          Blank choices are dropped when you save. The radio marks the correct answer.
        </p>
      </div>

      <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
        <span style={labelStyle}>Explanation</span>
        <textarea
          value={draft.explanation}
          onChange={(e) => setDraft((d) => ({ ...d, explanation: e.target.value }))}
          rows={2}
          placeholder="Shown after they answer, right or wrong."
          style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
        />
      </label>

      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
        <button type="button" onClick={onCancel} disabled={saving} style={ghostBtn}>
          Cancel
        </button>
        <button type="button" onClick={onSave} disabled={saving} style={primaryBtn(saving)}>
          {saving ? 'Saving…' : 'Save question'}
        </button>
      </div>
    </div>
  )
}

function Muted({ children }) {
  return <p style={{ color: 'var(--color-ink-muted)', fontSize: '0.9rem' }}>{children}</p>
}

function IconBtn({ children, disabled, onClick, ...rest }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      style={{
        background: 'transparent',
        border: '1px solid var(--color-rule)',
        color: 'var(--color-ink-muted)',
        width: '28px',
        height: '28px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        flexShrink: 0,
      }}
      {...rest}
    >
      {children}
    </button>
  )
}

const inputStyle = {
  padding: '0.5rem 0.7rem',
  background: 'var(--color-bg)',
  color: 'var(--color-ink)',
  border: '1px solid var(--color-rule)',
  fontSize: '0.85rem',
  fontFamily: 'var(--font-serif)',
  outline: 'none',
}

const labelStyle = {
  fontSize: '0.7rem',
  fontWeight: 600,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--color-ink-muted)',
}

const ghostBtn = {
  padding: '0.45rem 0.9rem',
  background: 'transparent',
  color: 'var(--color-ink)',
  border: '1px solid var(--color-rule)',
  cursor: 'pointer',
  fontSize: '0.8rem',
  fontFamily: 'var(--font-serif)',
}

function primaryBtn(disabled) {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.4rem',
    padding: '0.55rem 1rem',
    background: 'var(--color-accent)',
    color: 'var(--color-accent-ink)',
    border: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    fontSize: '0.85rem',
    fontWeight: 500,
    fontFamily: 'var(--font-serif)',
  }
}
