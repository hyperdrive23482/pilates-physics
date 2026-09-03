import { Check, HelpCircle, PlayCircle } from 'lucide-react'

/**
 * The syllabus and the navigation, in one list.
 *
 * Every row is reachable from the first visit. There are no locks and no
 * disabled states: the order is the recommended path, not a gate. Someone who
 * wants friction first can have it, and someone returning a year later does
 * not click through seven modules to reach the one they came back for.
 */
export default function ModuleList({ modules, completed, currentKey, onSelect }) {
  const rows = [
    ...modules.map((m, i) => ({
      key: String(i),
      label: m.title,
      meta: m.duration_min ? `${m.duration_min} min` : null,
      done: completed.has(m.id),
      icon: PlayCircle,
      muted: !m.vimeo_url,
    })),
    {
      key: 'quiz',
      label: 'Final quiz',
      meta: null,
      done: false,
      icon: HelpCircle,
      muted: false,
      isQuiz: true,
    },
  ]

  return (
    <>
      {/* Wide: a persistent sidebar. */}
      <nav className="course-sidebar" aria-label="Course modules">
        <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {rows.map((r, i) => {
            const active = currentKey === r.key
            return (
              <li key={r.key}>
                <button
                  type="button"
                  onClick={() => onSelect(r.key)}
                  aria-current={active ? 'true' : undefined}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    padding: '0.6rem 0.7rem',
                    background: active ? 'var(--color-surface)' : 'transparent',
                    border: 'none',
                    borderLeft: `2px solid ${active ? 'var(--color-accent)' : 'transparent'}`,
                    color: active ? 'var(--color-ink)' : 'var(--color-ink-muted)',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-serif)',
                    fontSize: '0.85rem',
                    lineHeight: 1.35,
                  }}
                >
                  <Marker done={r.done} index={i} isQuiz={r.isQuiz} />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    {r.label}
                    {r.muted && (
                      <span
                        style={{
                          display: 'block',
                          fontSize: '0.7rem',
                          color: 'var(--color-ink-muted)',
                          opacity: 0.8,
                        }}
                      >
                        coming soon
                      </span>
                    )}
                  </span>
                  {r.meta && (
                    <span style={{ fontSize: '0.7rem', color: 'var(--color-ink-muted)', flexShrink: 0 }}>
                      {r.meta}
                    </span>
                  )}
                </button>
              </li>
            )
          })}
        </ol>
      </nav>

      {/* Narrow: the same list collapsed into a select, so the player keeps
          the full width of a phone. */}
      <div className="course-sidebar-compact">
        <label style={{ display: 'block' }}>
          <span
            style={{
              display: 'block',
              fontSize: '0.68rem',
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--color-ink-muted)',
              marginBottom: '0.35rem',
            }}
          >
            Jump to
          </span>
          <select
            value={currentKey}
            onChange={(e) => onSelect(e.target.value)}
            style={{
              width: '100%',
              padding: '0.6rem 0.7rem',
              background: 'var(--color-bg)',
              color: 'var(--color-ink)',
              border: '1px solid var(--color-rule)',
              fontFamily: 'var(--font-serif)',
              fontSize: '0.9rem',
            }}
          >
            {rows.map((r, i) => (
              <option key={r.key} value={r.key}>
                {r.isQuiz ? '' : `${i + 1}. `}
                {r.label}
                {r.done ? ' ✓' : ''}
              </option>
            ))}
          </select>
        </label>
      </div>
    </>
  )
}

function Marker({ done, index, isQuiz }) {
  const size = 22
  if (done) {
    return (
      <span
        aria-hidden="true"
        style={{
          width: size,
          height: size,
          flexShrink: 0,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '50%',
          background: 'var(--color-accent)',
          color: 'var(--color-accent-ink)',
        }}
      >
        <Check size={13} strokeWidth={3} />
      </span>
    )
  }
  return (
    <span
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        flexShrink: 0,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '50%',
        border: '1px solid var(--color-rule)',
        fontSize: '0.7rem',
        color: 'var(--color-ink-muted)',
      }}
    >
      {isQuiz ? '?' : index + 1}
    </span>
  )
}
