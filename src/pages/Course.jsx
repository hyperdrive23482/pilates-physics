import { useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { useEnrollment } from '../hooks/useEnrollment'
import ProfileDropdown from '../components/ui/ProfileDropdown'
import { useCourseProgress } from '../hooks/useCourseProgress'
import CourseGate from '../components/course/CourseGate'
import CourseSidebar from '../components/course/CourseSidebar'
import LessonContent from '../components/course/LessonContent'
import ProgressBar from '../components/ui/ProgressBar'
import { modules } from '../utils/courseData'

// Default to first lesson of first module
const DEFAULT_MODULE = modules[0].id
const DEFAULT_LESSON = modules[0].lessons[0].id

export default function Course() {
  const { user, loading, signOut } = useEnrollment()
  const navigate = useNavigate()
  const {
    markComplete,
    isLessonComplete,
    isModuleUnlocked,
    moduleCompletionCount,
    overallPercent,
  } = useCourseProgress(user?.id)

  const [searchParams, setSearchParams] = useSearchParams()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const currentModuleId = searchParams.get('m') || DEFAULT_MODULE
  const currentLessonId = searchParams.get('l') || DEFAULT_LESSON

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  function handleSelectLesson(moduleId, lessonId) {
    setSearchParams({ m: moduleId, l: lessonId })
    setSidebarOpen(false)
    window.scrollTo({ top: 0 })
  }

  function handleMarkComplete(lessonId) {
    markComplete(lessonId)
  }

  // Find current module for the top bar label
  const currentModule = modules.find((m) => m.id === currentModuleId)

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'var(--color-bg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: '"DM Sans", sans-serif',
          color: 'var(--color-ink-muted)',
          fontSize: '0.9rem',
        }}
      >
        Loading…
      </div>
    )
  }

  if (!user) {
    return <CourseGate />
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden',
        background: 'var(--color-bg)',
        fontFamily: '"DM Sans", sans-serif',
      }}
    >
      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <header
        style={{
          height: '64px',
          borderBottom: '1px solid var(--color-rule)',
          background: 'var(--color-surface)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 1.25rem',
          gap: '1rem',
          flexShrink: 0,
          zIndex: 10,
        }}
      >
        {/* Mobile sidebar toggle */}
        <button
          onClick={() => setSidebarOpen((v) => !v)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--color-ink)',
            display: 'none',
            padding: '0.25rem',
          }}
          className="sidebar-toggle"
          aria-label="Toggle sidebar"
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        {/* Brand */}
        <Link
          to="/"
          style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: '1px', flexShrink: 0 }}
        >
          <span style={{
            fontFamily: '"DM Sans", sans-serif',
            fontWeight: '500',
            fontSize: '0.85rem',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: 'var(--color-ink)',
            borderBottom: '1px solid var(--color-accent)',
            paddingBottom: '2px',
            display: 'block',
          }}>
            Pilates
          </span>
          <span style={{
            fontFamily: '"DM Sans", sans-serif',
            fontWeight: '500',
            fontSize: '0.85rem',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: 'var(--color-accent)',
            display: 'block',
          }}>
            Physics
          </span>
        </Link>

        {/* Divider */}
        <span
          style={{
            width: '1px',
            height: '16px',
            background: 'var(--color-rule)',
            flexShrink: 0,
          }}
        />

        {/* Current location */}
        {currentModule && (
          <span
            style={{
              fontSize: '0.9rem',
              color: 'var(--color-ink-muted)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {currentModule.alwaysOpen
              ? 'Advanced Physics Portal'
              : `Module ${currentModule.number} — ${currentModule.title}`}
          </span>
        )}

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Overall progress */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            flexShrink: 0,
          }}
        >
          <div style={{ width: '100px' }}>
            <ProgressBar percent={overallPercent} height={3} />
          </div>
          <span
            style={{
              fontSize: '0.85rem',
              fontWeight: '600',
              color: 'var(--color-ink)',
              minWidth: '32px',
              textAlign: 'right',
            }}
          >
            {overallPercent}%
          </span>
        </div>

        <ProfileDropdown user={user} onSignOut={handleSignOut} />
      </header>

      {/* ── Body: sidebar + content ──────────────────────────────────────── */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(26,24,20,0.4)',
              zIndex: 20,
              display: 'none',
            }}
            className="mobile-overlay"
          />
        )}

        {/* Sidebar */}
        <div
          className={`course-sidebar${sidebarOpen ? ' sidebar-open' : ''}`}
          style={{ display: 'flex' }}
        >
          <CourseSidebar
            currentLessonId={currentLessonId}
            isLessonComplete={isLessonComplete}
            isModuleUnlocked={isModuleUnlocked}
            moduleCompletionCount={moduleCompletionCount}
            overallPercent={overallPercent}
            onSelectLesson={handleSelectLesson}
          />
        </div>

        {/* Main content */}
        <main
          style={{
            flex: 1,
            overflowY: 'auto',
            background: 'var(--color-bg)',
          }}
        >
          <LessonContent
            moduleId={currentModuleId}
            lessonId={currentLessonId}
            isLessonComplete={isLessonComplete}
            isModuleUnlocked={isModuleUnlocked}
            onMarkComplete={handleMarkComplete}
            onSelectLesson={handleSelectLesson}
          />
        </main>
      </div>

      <style>{`
        .sidebar-toggle {
          display: none;
        }

        .course-sidebar {
          flex-shrink: 0;
        }

        @media (max-width: 768px) {
          .sidebar-toggle {
            display: flex !important;
          }

          .mobile-overlay {
            display: block !important;
          }

          .course-sidebar {
            position: absolute;
            top: 0;
            left: 0;
            bottom: 0;
            z-index: 30;
            transform: translateX(-100%);
            transition: transform 0.25s ease;
          }

          .course-sidebar.sidebar-open {
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  )
}
