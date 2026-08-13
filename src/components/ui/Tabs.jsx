import { useRef, useState } from 'react'

// Underline-style tabs rather than the pill of SegmentedToggle
// (portal/classSimulator/ui.jsx): tab labels here are phrases, not one-word
// modes, and a three-up pill row breaks at narrow widths.
//
// Inactive panels are unmounted, not hidden with CSS. Callers depend on this to
// keep heavy children (an embedded video iframe) from loading until their tab
// is actually opened.

const barStyle = {
  display: 'flex',
  gap: '1.5rem',
  borderBottom: '1px solid var(--color-rule)',
  overflowX: 'auto',
}

function tabStyle(active) {
  return {
    padding: '0.6rem 0',
    marginBottom: '-1px',
    background: 'transparent',
    border: 'none',
    borderBottom: `2px solid ${active ? 'var(--color-accent)' : 'transparent'}`,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    fontFamily: 'var(--font-serif)',
    fontSize: '0.8rem',
    fontWeight: active ? 600 : 500,
    letterSpacing: '0.02em',
    color: active ? 'var(--color-ink)' : 'var(--color-ink-muted)',
  }
}

/**
 * @param {object} props
 * @param {{ id: string, label: string, render: () => import('react').ReactNode }[]} props.tabs
 * @param {string} [props.defaultId]  Tab open on mount. Falls back to the first tab.
 * @param {string} props.ariaLabel    Names the tablist for screen readers.
 */
export default function Tabs({ tabs, defaultId, ariaLabel }) {
  const [activeId, setActiveId] = useState(defaultId ?? tabs[0]?.id)
  const btnRefs = useRef({})

  if (!tabs?.length) return null

  const foundIndex = tabs.findIndex((t) => t.id === activeId)
  const activeIndex = foundIndex === -1 ? 0 : foundIndex
  const active = tabs[activeIndex]

  // Arrow keys move selection and focus together — the APG's "automatic
  // activation" pattern, appropriate here because switching is instant.
  function handleKeyDown(e) {
    let next = null
    if (e.key === 'ArrowRight') next = (activeIndex + 1) % tabs.length
    else if (e.key === 'ArrowLeft') next = (activeIndex - 1 + tabs.length) % tabs.length
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = tabs.length - 1
    if (next === null) return
    e.preventDefault()
    setActiveId(tabs[next].id)
    btnRefs.current[tabs[next].id]?.focus()
  }

  return (
    <div className="pp-tabs">
      <div className="pp-tabs__bar" role="tablist" aria-label={ariaLabel} style={barStyle}>
        {tabs.map((tab, i) => {
          const isActive = i === activeIndex
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`pp-tab-${tab.id}`}
              aria-selected={isActive}
              aria-controls={`pp-panel-${tab.id}`}
              /* Roving tabindex: one stop for the whole bar, arrows do the rest. */
              tabIndex={isActive ? 0 : -1}
              ref={(el) => {
                btnRefs.current[tab.id] = el
              }}
              onClick={() => setActiveId(tab.id)}
              onKeyDown={handleKeyDown}
              style={tabStyle(isActive)}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      <div
        role="tabpanel"
        id={`pp-panel-${active.id}`}
        aria-labelledby={`pp-tab-${active.id}`}
        tabIndex={0}
        style={{ paddingTop: '1.75rem', outline: 'none' }}
      >
        {active.render()}
      </div>

      <style>{`
        .pp-tabs__bar {
          scrollbar-width: none;
        }
        .pp-tabs__bar::-webkit-scrollbar {
          display: none;
        }
        .pp-tabs__bar [role='tab']:hover {
          color: var(--color-ink);
        }
        .pp-tabs__bar [role='tab']:focus-visible {
          outline: 2px solid var(--color-accent);
          outline-offset: 2px;
        }
      `}</style>
    </div>
  )
}
