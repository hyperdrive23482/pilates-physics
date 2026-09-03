import { useEffect, useMemo, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Check, Film } from 'lucide-react'
import { parseVimeoUrl } from '../../../lib/vimeo'
import { useCourseModules, useCourseProgress } from '../../../hooks/useCourse'
import ContentItem from '../ContentItem'
import ModuleList from './ModuleList'
import VimeoEmbed from './VimeoEmbed'
import './course.css'

/**
 * A course, delivered in the portal.
 *
 * The current position lives in ?module=, so a refresh, a bookmark or a link
 * pasted to yourself all land in the same place. Any valid index is accepted,
 * including on a first visit: the sequence is a recommended path, not a gate.
 * See the plan's Phase 2.
 */
export default function CoursePlayer({ workshop, userId }) {
  const { modules, attachments, loading } = useCourseModules(workshop?.id)
  const moduleIds = useMemo(() => modules.map((m) => m.id), [modules])
  const { completed, markComplete } = useCourseProgress(userId, moduleIds)

  const [params, setParams] = useSearchParams()
  const raw = params.get('module')

  const total = modules.length
  const isQuiz = raw === 'quiz'
  const parsed = Number.parseInt(raw ?? '', 10)
  const index = Number.isInteger(parsed) && parsed >= 0 && parsed < total ? parsed : null

  const select = useCallback(
    (key) => {
      const next = new URLSearchParams(params)
      next.set('module', key)
      setParams(next, { replace: false })
      // A module can be taller than the viewport on a phone, so a jump from
      // the list would otherwise land halfway down the previous one.
      window.scrollTo({ top: 0, behavior: 'smooth' })
    },
    [params, setParams],
  )

  // With no position in the URL, resume at the first unfinished module. Purely
  // a convenience: it never prevents reaching anything.
  useEffect(() => {
    if (loading || total === 0) return
    if (isQuiz || index !== null) return
    const firstIncomplete = modules.findIndex((m) => !completed.has(m.id))
    const next = new URLSearchParams(params)
    next.set('module', firstIncomplete === -1 ? 'quiz' : String(firstIncomplete))
    setParams(next, { replace: true })
  }, [loading, total, isQuiz, index, modules, completed, params, setParams])

  if (loading) return <Muted>Loading the course…</Muted>

  if (total === 0) {
    return (
      <Panel>
        <h2 style={headingStyle}>The modules are on their way</h2>
        <p style={bodyStyle}>
          This course does not have any modules yet. Your access is already
          active, so everything appears here as soon as it is published.
        </p>
      </Panel>
    )
  }

  const currentKey = isQuiz ? 'quiz' : String(index ?? 0)
  const current = isQuiz ? null : modules[index ?? 0]
  const doneCount = modules.filter((m) => completed.has(m.id)).length

  return (
    <div className="course-layout">
      <aside>
        <ProgressBar done={doneCount} total={total} />
        <ModuleList
          modules={modules}
          completed={completed}
          currentKey={currentKey}
          onSelect={select}
        />
      </aside>

      <div style={{ minWidth: 0 }}>
        {isQuiz ? (
          <QuizPlaceholder doneCount={doneCount} total={total} onSelect={select} />
        ) : (
          <ModuleView
            module={current}
            index={index ?? 0}
            total={total}
            isDone={completed.has(current.id)}
            attachments={attachments.filter((a) => a.module_id === current.id)}
            courseAttachments={attachments.filter((a) => !a.module_id)}
            webinarId={workshop.id}
            onComplete={() => markComplete(current.id, { webinarId: workshop.id })}
            onPrev={() => select(String((index ?? 0) - 1))}
            onNext={() => {
              markComplete(current.id, { webinarId: workshop.id })
              const nextIndex = (index ?? 0) + 1
              select(nextIndex >= total ? 'quiz' : String(nextIndex))
            }}
          />
        )}
      </div>
    </div>
  )
}

function ModuleView({
  module: m,
  index,
  total,
  isDone,
  attachments,
  courseAttachments,
  webinarId,
  onComplete,
  onPrev,
  onNext,
}) {
  const video = parseVimeoUrl(m.vimeo_url)
  const isLast = index === total - 1

  return (
    <article>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          fontSize: '0.72rem',
          fontWeight: 600,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--color-ink-muted)',
          marginBottom: '0.6rem',
        }}
      >
        <span>
          Module {index + 1} of {total}
        </span>
        {isDone && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: 'var(--color-accent)' }}>
            <Check size={12} strokeWidth={3} /> Done
          </span>
        )}
      </div>

      <h2 style={{ ...headingStyle, marginTop: 0 }}>{m.title}</h2>

      {video ? (
        <VimeoEmbed id={video.id} hash={video.hash} title={m.title} onEnded={onComplete} />
      ) : (
        <ComingSoon />
      )}

      {m.summary && <p style={{ ...bodyStyle, marginTop: '1.25rem' }}>{m.summary}</p>}

      {attachments.length > 0 && (
        <Attachments title="For this module" items={attachments} webinarId={webinarId} />
      )}

      <nav
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: '1rem',
          marginTop: '2rem',
          paddingTop: '1.25rem',
          borderTop: '1px solid var(--color-rule)',
        }}
      >
        <button
          type="button"
          onClick={onPrev}
          disabled={index === 0}
          style={{
            ...btnBase,
            background: 'transparent',
            color: 'var(--color-ink)',
            border: '1px solid var(--color-rule)',
            opacity: index === 0 ? 0.4 : 1,
            cursor: index === 0 ? 'not-allowed' : 'pointer',
          }}
        >
          <ChevronLeft size={15} /> Previous
        </button>

        <button
          type="button"
          onClick={onNext}
          style={{
            ...btnBase,
            background: 'var(--color-accent)',
            color: 'var(--color-accent-ink)',
            border: 'none',
          }}
        >
          {isLast ? 'Take the quiz' : 'Next module'} <ChevronRight size={15} />
        </button>
      </nav>

      {courseAttachments.length > 0 && (
        <Attachments
          title="Course resources"
          items={courseAttachments}
          webinarId={webinarId}
          muted
        />
      )}
    </article>
  )
}

// A module whose video has not been uploaded yet. Next still works from here,
// so a gap in the curriculum never traps anyone mid-course.
function ComingSoon() {
  return (
    <div
      style={{
        width: '100%',
        aspectRatio: '16 / 9',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.6rem',
        background: 'var(--color-surface)',
        border: '1px dashed var(--color-rule)',
        color: 'var(--color-ink-muted)',
        textAlign: 'center',
        padding: '1rem',
      }}
    >
      <Film size={26} />
      <strong style={{ fontFamily: 'var(--font-serif)', fontSize: '1rem', color: 'var(--color-ink)' }}>
        This module is coming soon
      </strong>
      <span style={{ fontSize: '0.85rem', maxWidth: '34ch' }}>
        The video is still in production. It appears here automatically, at no
        extra cost, the moment it is published.
      </span>
    </div>
  )
}

// Phase 3 replaces this with the graded quiz. Until then the row still exists
// in the list and is still reachable, so the shape of the course is honest.
function QuizPlaceholder({ doneCount, total, onSelect }) {
  return (
    <Panel>
      <h2 style={{ ...headingStyle, marginTop: 0 }}>Final quiz</h2>
      <p style={bodyStyle}>
        Ten questions covering the whole course. Passing it is what issues your
        NPCP certificate, and you can retake it as many times as you need.
      </p>
      <p style={bodyStyle}>
        The quiz is not open yet. It appears here as soon as it is published,
        and your progress is already saved.
      </p>
      <p style={{ ...bodyStyle, color: 'var(--color-ink-muted)', fontSize: '0.85rem' }}>
        You have finished {doneCount} of {total} modules.
      </p>
      {doneCount < total && (
        <button
          type="button"
          onClick={() => {
            const first = Math.max(0, doneCount)
            onSelect(String(Math.min(first, total - 1)))
          }}
          style={{ ...btnBase, background: 'var(--color-accent)', color: 'var(--color-accent-ink)', border: 'none' }}
        >
          Back to the modules
        </button>
      )}
    </Panel>
  )
}

function Attachments({ title, items, webinarId, muted }) {
  return (
    <section style={{ marginTop: muted ? '2.5rem' : '1.75rem' }}>
      <h3
        style={{
          fontSize: '0.72rem',
          fontWeight: 600,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--color-ink-muted)',
          margin: '0 0 0.75rem',
        }}
      >
        {title}
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {items.map((item) => (
          <ContentItem key={item.id} item={item} webinarId={webinarId} />
        ))}
      </div>
    </section>
  )
}

function ProgressBar({ done, total }) {
  const pct = total ? Math.round((done / total) * 100) : 0
  return (
    <div style={{ marginBottom: '1.25rem' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '0.72rem',
          color: 'var(--color-ink-muted)',
          marginBottom: '0.4rem',
        }}
      >
        <span>
          {done} of {total} modules
        </span>
        <span>{pct}%</span>
      </div>
      <div
        style={{ height: '3px', background: 'var(--color-rule)', overflow: 'hidden' }}
        role="progressbar"
        aria-valuenow={done}
        aria-valuemin={0}
        aria-valuemax={total}
      >
        <div style={{ width: `${pct}%`, height: '100%', background: 'var(--color-accent)' }} />
      </div>
    </div>
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
