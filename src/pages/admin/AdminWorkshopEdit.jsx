import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useEnrollment } from '../../hooks/useEnrollment'
import { useAdminWorkshop } from '../../hooks/admin/useAllWorkshops'
import { useAdminAPI } from '../../hooks/admin/useAdminAPI'
import { supabase } from '../../lib/supabase'
import AdminNav from '../../components/admin/AdminNav'
import WorkshopForm from '../../components/admin/WorkshopForm'
import ContentEditor from '../../components/admin/ContentEditor'
import WorkshopFeedbackPanel from '../../components/admin/WorkshopFeedbackPanel'
import SurveyConfigEditor from '../../components/admin/SurveyConfigEditor'

const TABS = [
  { id: 'details', label: 'Details' },
  { id: 'content', label: 'Content' },
  { id: 'questions', label: 'Pre-workshop Q&A' },
  { id: 'survey', label: 'Post-workshop survey' },
  { id: 'feedback', label: 'Feedback' },
]

export default function AdminWorkshopEdit() {
  const { slug } = useParams()
  const isNew = !slug
  const { user, signOut } = useEnrollment()
  const { workshop, loading, refetch } = useAdminWorkshop(isNew ? null : slug)
  const { request } = useAdminAPI()
  const navigate = useNavigate()
  const [tab, setTab] = useState('details')
  const [saving, setSaving] = useState(false)
  const [bonusOptions, setBonusOptions] = useState([])
  const [backfilling, setBackfilling] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      let q = supabase.from('webinars').select('id, title, kind, slug').order('title')
      if (workshop?.id) q = q.neq('id', workshop.id)
      const { data, error } = await q
      if (!cancelled && !error) setBonusOptions(data ?? [])
    }
    load()
    return () => {
      cancelled = true
    }
  }, [workshop?.id])

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
        navigate(`/admin/workshops/${data.slug}/edit`, { replace: true })
      } else {
        const { error } = await supabase
          .from('webinars')
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq('id', workshop.id)
        if (error) throw error
        refetch()
        if (payload.slug !== slug) {
          navigate(`/admin/workshops/${payload.slug}/edit`, { replace: true })
        }
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleBackfill() {
    if (!workshop?.id) return
    const bonusTitle =
      bonusOptions.find((w) => w.id === workshop.bonus_webinar_id)?.title ?? 'the bonus'
    const start = new Date(workshop.bonus_starts_at).toLocaleString()
    const end = new Date(workshop.bonus_ends_at).toLocaleString()
    if (
      !window.confirm(
        `Grant "${bonusTitle}" to everyone who purchased "${workshop.title}" between ${start} and ${end}? This is idempotent.`,
      )
    ) {
      return
    }
    setBackfilling(true)
    try {
      const result = await request('/api/admin/apply-bonus-backfill', {
        method: 'POST',
        body: { webinar_id: workshop.id },
      })
      window.alert(
        `Done. Newly granted: ${result.newly_granted}. Already had it: ${result.already_granted}.`,
      )
    } catch (err) {
      window.alert(`Backfill failed: ${err.message}`)
    } finally {
      setBackfilling(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      <AdminNav user={user} onSignOut={signOut} />

      <main className="pp-main" style={{ maxWidth: '900px', margin: '0 auto' }}>
        <Link
          to="/admin/workshops"
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
          <ArrowLeft size={14} /> Back to workshops
        </Link>

        <h1
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(1.5rem, 3vw, 2rem)',
            color: 'var(--color-ink)',
            margin: '0 0 2rem',
          }}
        >
          {isNew ? 'New workshop' : workshop?.title ?? 'Edit workshop'}
        </h1>

        {!isNew && (
          <nav
            className="pp-tabs-scroll"
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
                  fontFamily: 'var(--font-serif)',
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
            <WorkshopForm
              initial={workshop}
              onSubmit={save}
              submitLabel={isNew ? 'Create workshop' : 'Save changes'}
              busy={saving}
              workshops={bonusOptions}
              onBackfill={isNew ? undefined : handleBackfill}
              backfilling={backfilling}
            />
          )
        ) : null}

        {!isNew && tab === 'content' && <ContentEditor workshopId={workshop?.id} />}

        {!isNew && tab === 'questions' && <QuestionsList workshopId={workshop?.id} />}

        {!isNew && tab === 'survey' && <SurveyTab workshop={workshop} onSaved={refetch} />}

        {!isNew && tab === 'feedback' && <FeedbackTab workshop={workshop} />}
      </main>
    </div>
  )
}

function SurveyTab({ workshop, onSaved }) {
  const { request } = useAdminAPI()
  const [responseCount, setResponseCount] = useState(0)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!workshop?.id) return
    request('/api/admin/workshop-feedback')
      .then((data) => {
        const bucket = data?.by_workshop?.[`wid:${workshop.id}`]
        setResponseCount(bucket?.response_count ?? 0)
      })
      .catch(() => setResponseCount(0))
  }, [workshop?.id, request])

  async function handleSave(payload) {
    if (!workshop?.id) return
    setSaving(true)
    try {
      const { error } = await supabase
        .from('webinars')
        .update({ survey_config: payload, updated_at: new Date().toISOString() })
        .eq('id', workshop.id)
      if (error) throw error
      onSaved?.()
    } finally {
      setSaving(false)
    }
  }

  if (!workshop?.id) {
    return <p style={{ color: 'var(--color-ink-muted)', fontSize: '0.9rem' }}>Loading...</p>
  }

  return (
    <SurveyConfigEditor
      value={workshop.survey_config}
      responseCount={responseCount}
      onSave={handleSave}
      saving={saving}
    />
  )
}

function FeedbackTab({ workshop }) {
  const { request } = useAdminAPI()
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    request('/api/admin/workshop-feedback')
      .then(setData)
      .catch((e) => setError(e.message))
  }, [request])

  if (error) {
    return <p style={{ color: '#ff7d7d', fontSize: '0.85rem' }}>{error}</p>
  }
  if (!data) {
    return <p style={{ color: 'var(--color-ink-muted)', fontSize: '0.9rem' }}>Loading…</p>
  }

  // Feedback buckets are now keyed by webinar id, which is stable
  // even if the workshop title or date changes.
  const date = workshop?.scheduled_at?.slice(0, 10)
  const key = workshop?.id ? `wid:${workshop.id}` : null
  const entry = key ? data.by_workshop?.[key] : null

  return (
    <WorkshopFeedbackPanel
      workshopTitle={workshop?.title}
      workshopDate={date}
      data={entry}
    />
  )
}

function questionerName(q) {
  const full = `${q.first_name ?? ''} ${q.last_name ?? ''}`.trim()
  if (full) return full
  return q.email || '(unknown)'
}

function QuestionsList({ workshopId }) {
  const { request } = useAdminAPI()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!workshopId) return
    let cancelled = false
    setLoading(true)
    request(`/api/admin/workshop-questions?webinar_id=${encodeURIComponent(workshopId)}`)
      .then((data) => {
        if (cancelled) return
        setRows(data?.questions ?? [])
        setLoading(false)
      })
      .catch(() => {
        if (cancelled) return
        setRows([])
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [workshopId, request])

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
          <p style={{ margin: '0.4rem 0 0', fontSize: '0.8rem', color: 'var(--color-ink)' }}>
            {questionerName(q)}
          </p>
          <p style={{ margin: '0.2rem 0 0', fontSize: '0.75rem', color: 'var(--color-ink-muted)' }}>
            {new Date(q.submitted_at).toLocaleString()} · {q.is_answered ? 'answered' : 'unanswered'}
          </p>
        </div>
      ))}
    </div>
  )
}
