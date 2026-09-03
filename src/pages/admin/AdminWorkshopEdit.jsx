import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useEnrollment } from '../../hooks/useEnrollment'
import { useAdminWorkshop } from '../../hooks/admin/useAllWorkshops'
import { useAdminAPI } from '../../hooks/admin/useAdminAPI'
import { supabase } from '../../lib/supabase'
import AdminNav from '../../components/admin/AdminNav'
import WorkshopForm from '../../components/admin/WorkshopForm'
import ContentEditor from '../../components/admin/ContentEditor'
import CurriculumEditor from '../../components/admin/CurriculumEditor'
import QuizEditor from '../../components/admin/QuizEditor'
import CourseResultsPanel from '../../components/admin/CourseResultsPanel'
import WorkshopFeedbackPanel from '../../components/admin/WorkshopFeedbackPanel'
import SurveyConfigEditor from '../../components/admin/SurveyConfigEditor'

const CLONE_DEFAULT_OPTIONS = {
  copy_content: true,
  include_recordings: false,
  copy_survey: true,
}

// Fields a clone must not inherit: they belong to the session that was cloned.
// The endpoint resets these too; blanking them here means the admin sees an
// honest form before creating. kit_tag is cleared because it auto-grants
// access, so it should be a deliberate paste rather than an inherited default.
function cloneDefaults(source) {
  return {
    ...source,
    title: `${source.title} (copy)`,
    slug: `${source.slug}-copy`,
    status: 'draft',
    scheduled_at: null,
    zoom_link: null,
    zoom_passcode: null,
    recording_url: null,
    kit_tag: null,
    bonus_webinar_id: null,
    bonus_starts_at: null,
    bonus_ends_at: null,
  }
}

// The tab set depends on what the product is. A course is delivered here
// rather than on Zoom, so it trades the event tabs for a curriculum, a graded
// quiz and the completion record. Its attachments live inside Curriculum,
// scoped per module, which is why it has no separate Content tab.
const WORKSHOP_TABS = [
  { id: 'details', label: 'Details' },
  { id: 'content', label: 'Content' },
  { id: 'questions', label: 'Pre-workshop Q&A' },
  { id: 'survey', label: 'Post-workshop survey' },
  { id: 'feedback', label: 'Feedback' },
  { id: 'enrolled', label: 'Enrolled users' },
]

const COURSE_TABS = [
  { id: 'details', label: 'Details' },
  { id: 'curriculum', label: 'Curriculum' },
  { id: 'quiz', label: 'Quiz' },
  { id: 'results', label: 'Results' },
  { id: 'survey', label: 'Survey' },
  { id: 'feedback', label: 'Feedback' },
  { id: 'enrolled', label: 'Enrolled users' },
]

function tabsFor(kind) {
  return kind === 'course' ? COURSE_TABS : WORKSHOP_TABS
}

export default function AdminWorkshopEdit() {
  const { slug } = useParams()
  const isNew = !slug
  const { user, signOut } = useEnrollment()
  const { workshop, loading, refetch } = useAdminWorkshop(isNew ? null : slug)
  const { request } = useAdminAPI()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [tab, setTab] = useState('details')
  const [saving, setSaving] = useState(false)
  const [bonusOptions, setBonusOptions] = useState([])
  const [backfilling, setBackfilling] = useState(false)
  const [cloneSource, setCloneSource] = useState(null)
  const [cloneLoading, setCloneLoading] = useState(false)
  const [cloneOptions, setCloneOptions] = useState(CLONE_DEFAULT_OPTIONS)
  const [moduleTotalMin, setModuleTotalMin] = useState(null)

  const cloneSlug = isNew ? searchParams.get('from') : null
  const isCourse = workshop?.kind === 'course'
  const tabs = tabsFor(workshop?.kind)

  // A course's runtime is the sum of its module runtimes, so the Details tab
  // can show it read-only and save the same figure the certificate prints.
  useEffect(() => {
    if (!isCourse || !workshop?.id) {
      setModuleTotalMin(null)
      return
    }
    let cancelled = false
    supabase
      .from('course_modules')
      .select('duration_min')
      .eq('webinar_id', workshop.id)
      .then(({ data, error }) => {
        if (cancelled || error) return
        const total = (data ?? []).reduce((sum, m) => sum + (m.duration_min ?? 0), 0)
        setModuleTotalMin(total)
      })
    return () => {
      cancelled = true
    }
  }, [isCourse, workshop?.id, tab])

  // Kind can change (a row saved as a course, say), and the old tab may not
  // exist in the new set. Fall back to Details rather than rendering nothing.
  useEffect(() => {
    if (!tabs.some((t) => t.id === tab)) setTab('details')
  }, [tabs, tab])

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

  // Load the full source row whenever ?from=<slug> changes, so the form can be
  // prefilled with everything the clone will carry over.
  useEffect(() => {
    if (!cloneSlug) {
      setCloneSource(null)
      setCloneLoading(false)
      return
    }
    let cancelled = false
    setCloneLoading(true)
    supabase
      .from('webinars')
      .select('*')
      .eq('slug', cloneSlug)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return
        setCloneSource(error ? null : data ?? null)
        setCloneLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [cloneSlug])

  function selectCloneSource(slug) {
    setSearchParams(slug ? { from: slug } : {}, { replace: true })
  }

  async function save(payload) {
    // Guard the window between picking a source and its row arriving, so a
    // fast submit can't quietly create a blank workshop instead of a copy.
    if (isNew && cloneSlug && cloneLoading) {
      throw new Error('Still loading the workshop you are copying. Try again in a moment.')
    }
    if (isNew && cloneSlug && !cloneSource) {
      throw new Error(`No workshop found with the slug "${cloneSlug}".`)
    }
    setSaving(true)
    try {
      if (isNew && cloneSource) {
        const result = await request('/api/admin/clone-workshop', {
          method: 'POST',
          body: { source_id: cloneSource.id, overrides: payload, options: cloneOptions },
        })
        if (result?.warnings?.length) {
          window.alert(
            `Workshop created, but with warnings:\n\n${result.warnings.join('\n\n')}`,
          )
        }
        navigate(`/admin/workshops/${result.slug}/edit`, { replace: true })
      } else if (isNew) {
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
            {tabs.map((t) => (
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

        {isNew && (
          <ClonePicker
            options={bonusOptions}
            selectedSlug={cloneSlug ?? ''}
            onSelect={selectCloneSource}
            notFound={!!cloneSlug && !cloneLoading && !cloneSource}
            cloneOptions={cloneOptions}
            onToggle={(key, value) => setCloneOptions((o) => ({ ...o, [key]: value }))}
          />
        )}

        {isNew || tab === 'details' ? (
          loading ? (
            <p style={{ color: 'var(--color-ink-muted)', fontSize: '0.9rem' }}>Loading…</p>
          ) : (
            <WorkshopForm
              key={isNew ? cloneSource?.id ?? 'blank' : workshop?.id}
              initial={isNew ? (cloneSource ? cloneDefaults(cloneSource) : null) : workshop}
              onSubmit={save}
              submitLabel={
                isNew ? (cloneSource ? 'Create copy' : 'Create workshop') : 'Save changes'
              }
              busy={saving}
              workshops={bonusOptions}
              onBackfill={isNew ? undefined : handleBackfill}
              backfilling={backfilling}
              derivedDurationMin={moduleTotalMin}
              lockKind={!isNew}
            />
          )
        ) : null}

        {!isNew && tab === 'content' && <ContentEditor workshopId={workshop?.id} />}

        {!isNew && tab === 'curriculum' && <CurriculumEditor workshopId={workshop?.id} />}

        {!isNew && tab === 'quiz' && <QuizEditor workshop={workshop} />}

        {!isNew && tab === 'results' && <CourseResultsPanel workshop={workshop} />}

        {!isNew && tab === 'questions' && <QuestionsList workshopId={workshop?.id} />}

        {!isNew && tab === 'survey' && <SurveyTab workshop={workshop} onSaved={refetch} />}

        {!isNew && tab === 'feedback' && <FeedbackTab workshop={workshop} />}

        {!isNew && tab === 'enrolled' && <EnrolledUsersTab workshopId={workshop?.id} />}
      </main>
    </div>
  )
}

// Lets a new workshop start as a copy of an existing one. Picking a source
// prefills the form below; submitting then routes through /api/admin/clone-workshop,
// which also duplicates the content items and their uploaded files.
function ClonePicker({ options, selectedSlug, onSelect, notFound, cloneOptions, onToggle }) {
  // Courses are clonable too, which is how a second one (the chair edition,
  // say) starts from an existing curriculum rather than from nothing. Tools
  // and resources are not: they are single components keyed by slug, so a
  // copy would render the same thing under a different name.
  const sources = options.filter((w) => w.kind === 'webinar' || w.kind === 'course')
  return (
    <div
      style={{
        border: '1px solid var(--color-rule)',
        background: 'var(--color-surface)',
        padding: '1rem 1.25rem',
        marginBottom: '2rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
      }}
    >
      <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        <span
          style={{
            fontSize: '0.7rem',
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--color-ink-muted)',
          }}
        >
          Start from an existing workshop
        </span>
        <select
          value={selectedSlug}
          onChange={(e) => onSelect(e.target.value)}
          style={{
            padding: '0.6rem 0.75rem',
            background: 'var(--color-bg)',
            color: 'var(--color-ink)',
            border: '1px solid var(--color-rule)',
            fontSize: '0.9rem',
            fontFamily: 'var(--font-serif)',
            outline: 'none',
          }}
        >
          <option value="">Start blank</option>
          {sources.map((w) => (
            <option key={w.id} value={w.slug}>
              {w.title}
            </option>
          ))}
        </select>
      </label>

      {notFound && (
        <p style={{ color: '#ff7d7d', fontSize: '0.8rem', margin: 0 }}>
          No workshop found with the slug &ldquo;{selectedSlug}&rdquo;. Pick one from the list.
        </p>
      )}

      {selectedSlug && !notFound && (
        <>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem 1.5rem' }}>
            <CloneCheck
              label="Copy content items"
              checked={cloneOptions.copy_content}
              onChange={(v) => onToggle('copy_content', v)}
            />
            <CloneCheck
              label="Include recording files"
              checked={cloneOptions.include_recordings}
              disabled={!cloneOptions.copy_content}
              onChange={(v) => onToggle('include_recordings', v)}
            />
            <CloneCheck
              label="Copy survey questions"
              checked={cloneOptions.copy_survey}
              onChange={(v) => onToggle('copy_survey', v)}
            />
          </div>
          <span
            style={{ fontSize: '0.72rem', color: 'var(--color-ink-muted)', lineHeight: 1.6 }}
          >
            The date, Zoom details, recording URL, Kit tag, early-bonus window and survey
            dates are left blank on purpose. Enrolled users, questions and feedback are
            never copied.
          </span>
        </>
      )}
    </div>
  )
}

function CloneCheck({ label, checked, disabled, onChange }) {
  return (
    <label
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.45rem',
        fontSize: '0.85rem',
        color: disabled ? 'var(--color-ink-muted)' : 'var(--color-ink)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <input
        type="checkbox"
        checked={checked && !disabled}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      {label}
    </label>
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

function enrolleeName(e) {
  const full = `${e.first_name ?? ''} ${e.last_name ?? ''}`.trim()
  if (full) return full
  return e.email || '(unknown user)'
}

function EnrolledUsersTab({ workshopId }) {
  const { request } = useAdminAPI()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!workshopId) return
    let cancelled = false
    setLoading(true)
    setError(null)
    request(`/api/admin/workshop-enrollments?webinar_id=${encodeURIComponent(workshopId)}`)
      .then((data) => {
        if (cancelled) return
        setRows(data?.enrollments ?? [])
        setLoading(false)
      })
      .catch((err) => {
        if (cancelled) return
        setError(err.message)
        setRows([])
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [workshopId, request])

  if (loading) return <p style={{ color: 'var(--color-ink-muted)', fontSize: '0.9rem' }}>Loading…</p>
  if (error) return <p style={{ color: '#ff7d7d', fontSize: '0.85rem' }}>{error}</p>
  if (rows.length === 0) {
    return <p style={{ color: 'var(--color-ink-muted)', fontSize: '0.9rem' }}>No one is enrolled yet.</p>
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
      <p style={{ margin: '0 0 0.2rem', fontSize: '0.8rem', color: 'var(--color-ink-muted)' }}>
        {rows.length} enrolled
      </p>
      {rows.map((e) => (
        <div
          key={e.id}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '1rem',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-rule)',
            padding: '0.9rem 1rem',
            fontSize: '0.9rem',
            color: 'var(--color-ink)',
          }}
        >
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: 0 }}>{enrolleeName(e)}</p>
            {e.email && (
              <p
                style={{
                  margin: '0.25rem 0 0',
                  fontSize: '0.8rem',
                  color: 'var(--color-ink-muted)',
                  wordBreak: 'break-all',
                }}
              >
                {e.email}
              </p>
            )}
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <span
              style={{
                display: 'inline-block',
                fontSize: '0.7rem',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                color: 'var(--color-ink-muted)',
                border: '1px solid var(--color-rule)',
                borderRadius: '999px',
                padding: '0.1rem 0.5rem',
              }}
            >
              {e.source}
            </span>
            {e.granted_at && (
              <p style={{ margin: '0.35rem 0 0', fontSize: '0.75rem', color: 'var(--color-ink-muted)' }}>
                Enrolled {new Date(e.granted_at).toLocaleDateString()}
              </p>
            )}
            {e.expires_at && (
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.75rem', color: 'var(--color-ink-muted)' }}>
                Expires {new Date(e.expires_at).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
