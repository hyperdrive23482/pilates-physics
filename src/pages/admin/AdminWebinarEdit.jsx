import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useEnrollment } from '../../hooks/useEnrollment'
import { useAdminWebinar } from '../../hooks/admin/useAllWebinars'
import { supabase } from '../../lib/supabase'
import AdminNav from '../../components/admin/AdminNav'
import WebinarForm from '../../components/admin/WebinarForm'
import ContentEditor from '../../components/admin/ContentEditor'

const TABS = [
  { id: 'details', label: 'Details' },
  { id: 'content', label: 'Content' },
  { id: 'questions', label: 'Questions' },
]

export default function AdminWebinarEdit() {
  const { slug } = useParams()
  const isNew = !slug
  const { user, signOut } = useEnrollment()
  const { webinar, loading, refetch } = useAdminWebinar(isNew ? null : slug)
  const navigate = useNavigate()
  const [tab, setTab] = useState('details')
  const [saving, setSaving] = useState(false)

  async function save(payload) {
    setSaving(true)
    try {
      if (isNew) {
        const { data, error } = await supabase
          .from('webinars')
          .insert(payload)
          .select()
          .single()
        if (error) throw error
        navigate(`/admin/webinars/${data.slug}/edit`, { replace: true })
      } else {
        const { error } = await supabase
          .from('webinars')
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq('id', webinar.id)
        if (error) throw error
        refetch()
        if (payload.slug !== slug) {
          navigate(`/admin/webinars/${payload.slug}/edit`, { replace: true })
        }
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <AdminNav user={user} onSignOut={signOut} />

      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '6rem 2rem 4rem' }}>
        <Link
          to="/admin/webinars"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.3rem',
            fontSize: '0.8rem',
            color: 'var(--color-ink-muted)',
            textDecoration: 'none',
            marginBottom: '1rem',
          }}
        >
          <ArrowLeft size={14} /> Back to webinars
        </Link>

        <h1
          style={{
            fontFamily: '"DM Serif Display", serif',
            fontSize: 'clamp(1.5rem, 3vw, 2rem)',
            color: 'var(--color-ink)',
            margin: '0 0 2rem',
          }}
        >
          {isNew ? 'New webinar' : webinar?.title ?? 'Edit webinar'}
        </h1>

        {!isNew && (
          <nav
            style={{
              display: 'flex',
              gap: '1.5rem',
              borderBottom: '1px solid var(--color-rule)',
              marginBottom: '2rem',
            }}
          >
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: tab === t.id ? 'var(--color-ink)' : 'var(--color-ink-muted)',
                  borderBottom: tab === t.id ? '2px solid var(--color-accent)' : '2px solid transparent',
                  padding: '0.5rem 0',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontFamily: '"DM Sans", sans-serif',
                }}
              >
                {t.label}
              </button>
            ))}
          </nav>
        )}

        {isNew || tab === 'details' ? (
          loading ? (
            <p style={{ color: 'var(--color-ink-muted)', fontSize: '0.9rem' }}>Loading…</p>
          ) : (
            <WebinarForm
              initial={webinar}
              onSubmit={save}
              submitLabel={isNew ? 'Create webinar' : 'Save changes'}
              busy={saving}
            />
          )
        ) : null}

        {!isNew && tab === 'content' && <ContentEditor webinarId={webinar?.id} />}

        {!isNew && tab === 'questions' && <QuestionsList webinarId={webinar?.id} />}
      </main>
    </div>
  )
}

function QuestionsList({ webinarId }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!webinarId) return
    supabase
      .from('webinar_questions')
      .select('*')
      .eq('webinar_id', webinarId)
      .order('submitted_at', { ascending: false })
      .then(({ data }) => {
        setRows(data ?? [])
        setLoading(false)
      })
  }, [webinarId])

  if (loading) return <p style={{ color: 'var(--color-ink-muted)', fontSize: '0.9rem' }}>Loading…</p>
  if (rows.length === 0) {
    return <p style={{ color: 'var(--color-ink-muted)', fontSize: '0.9rem' }}>No questions yet.</p>
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
      {rows.map((q) => (
        <div
          key={q.id}
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-rule)',
            padding: '0.9rem 1rem',
            fontSize: '0.9rem',
            color: 'var(--color-ink)',
          }}
        >
          <p style={{ margin: 0 }}>{q.question}</p>
          <p style={{ margin: '0.4rem 0 0', fontSize: '0.75rem', color: 'var(--color-ink-muted)' }}>
            {new Date(q.submitted_at).toLocaleString()} · {q.is_answered ? 'answered' : 'unanswered'}
          </p>
        </div>
      ))}
    </div>
  )
}
