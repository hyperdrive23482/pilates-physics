import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { MessageSquare, Send, Check } from 'lucide-react'

export default function QuestionForm({ webinarId, userId }) {
  const [question, setQuestion] = useState('')
  const [status, setStatus] = useState('idle') // idle | sending | sent | error
  const [questions, setQuestions] = useState([])
  const [loaded, setLoaded] = useState(false)

  // Load user's submitted questions on first render
  if (!loaded && userId && webinarId) {
    setLoaded(true)
    supabase
      .from('webinar_questions')
      .select('*')
      .eq('webinar_id', webinarId)
      .eq('user_id', userId)
      .order('submitted_at', { ascending: true })
      .then(({ data }) => {
        if (data) setQuestions(data)
      })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!question.trim()) return

    setStatus('sending')
    const { data, error } = await supabase
      .from('webinar_questions')
      .insert({ webinar_id: webinarId, user_id: userId, question: question.trim() })
      .select()
      .single()

    if (error) {
      setStatus('error')
      return
    }

    setQuestions((prev) => [...prev, data])
    setQuestion('')
    setStatus('sent')
    setTimeout(() => setStatus('idle'), 2000)
  }

  return (
    <div
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-rule)',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <MessageSquare size={18} style={{ color: 'var(--color-accent)' }} />
        <h3
          style={{
            fontFamily: '"DM Serif Display", serif',
            fontSize: '1.1rem',
            color: 'var(--color-ink)',
            margin: 0,
          }}
        >
          Submit a Question
        </h3>
      </div>

      <p
        style={{
          fontSize: '0.85rem',
          lineHeight: '1.6',
          color: 'var(--color-ink-muted)',
          margin: 0,
        }}
      >
        Have a question you'd like addressed during the session? Submit it here ahead of time.
      </p>

      {questions.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span
            style={{
              fontSize: '0.7rem',
              fontWeight: '600',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--color-ink-muted)',
            }}
          >
            Your submitted questions
          </span>
          {questions.map((q) => (
            <div
              key={q.id}
              style={{
                fontSize: '0.85rem',
                color: 'var(--color-ink)',
                padding: '0.625rem 0.75rem',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--color-rule)',
                lineHeight: '1.5',
              }}
            >
              {q.question}
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.5rem' }}>
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Type your question..."
          rows={2}
          style={{
            flex: 1,
            padding: '0.75rem',
            fontSize: '0.9rem',
            fontFamily: '"DM Sans", sans-serif',
            border: '1px solid var(--color-rule)',
            background: 'var(--color-bg)',
            color: 'var(--color-ink)',
            outline: 'none',
            resize: 'vertical',
          }}
        />
        <button
          type="submit"
          disabled={!question.trim() || status === 'sending'}
          style={{
            padding: '0.75rem',
            background: status === 'sent' ? '#98C379' : 'var(--color-accent)',
            color: '#1C1A17',
            border: 'none',
            cursor: !question.trim() || status === 'sending' ? 'default' : 'pointer',
            opacity: !question.trim() ? 0.5 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            alignSelf: 'flex-end',
            height: '40px',
            width: '40px',
            flexShrink: 0,
          }}
          title="Submit question"
        >
          {status === 'sent' ? <Check size={18} /> : <Send size={18} />}
        </button>
      </form>

      {status === 'error' && (
        <p style={{ fontSize: '0.8rem', color: '#e06c75', margin: 0 }}>
          Failed to submit. Please try again.
        </p>
      )}
    </div>
  )
}
