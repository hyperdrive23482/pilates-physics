import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'

const MONO = '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace'
const BAR_BG = 'var(--color-surface-raised)'
const BAR_INK = 'var(--color-ink)'
const HEIGHT_VAR = '--pp-announcement-height'

function isExternal(url) {
  return /^https?:\/\//i.test(url)
}

function AnnouncementContent({ announcement }) {
  const hasLink = !!announcement?.link_url && !!announcement?.link_text
  const linkStyle = {
    color: 'var(--color-accent)',
    borderBottom: '1px solid currentColor',
    paddingBottom: '1px',
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    fontWeight: 600,
  }
  return (
    <div
      style={{
        maxWidth: '1480px',
        margin: '0 auto',
        padding: '9px 22px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'center',
        columnGap: '8px',
        rowGap: '2px',
        fontFamily: MONO,
        fontSize: '12px',
        letterSpacing: '0.04em',
        lineHeight: 1.35,
        color: BAR_INK,
        textAlign: 'center',
      }}
    >
      <span>{announcement?.message}</span>
      {hasLink &&
        (isExternal(announcement.link_url) ? (
          <a
            href={announcement.link_url}
            target="_blank"
            rel="noopener noreferrer"
            style={linkStyle}
          >
            {announcement.link_text}
          </a>
        ) : (
          <Link to={announcement.link_url} style={linkStyle}>
            {announcement.link_text}
          </Link>
        ))}
    </div>
  )
}

export default function AnnouncementBar({ announcement, variant = 'bar' }) {
  const barRef = useRef(null)

  // The bar grows to fit its message, so publish its live height for the
  // navbar offset and the main content's top padding.
  useEffect(() => {
    const el = barRef.current
    if (!el) return
    const root = document.documentElement
    const apply = () => {
      root.style.setProperty(HEIGHT_VAR, `${el.offsetHeight}px`)
    }
    apply()
    const observer = new ResizeObserver(apply)
    observer.observe(el)
    return () => {
      observer.disconnect()
      root.style.removeProperty(HEIGHT_VAR)
    }
  }, [variant, announcement?.message, announcement?.link_text])

  if (!announcement?.message) return null

  if (variant === 'preview') {
    return (
      <div
        style={{
          position: 'relative',
          minHeight: '2.5rem',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          background: BAR_BG,
        }}
      >
        <div style={{ width: '100%' }}>
          <AnnouncementContent announcement={announcement} />
        </div>
      </div>
    )
  }

  return (
    <div
      ref={barRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 60,
        minHeight: '2.5rem',
        display: 'flex',
        alignItems: 'center',
        background: BAR_BG,
      }}
    >
      <div style={{ width: '100%' }}>
        <AnnouncementContent announcement={announcement} />
      </div>
    </div>
  )
}
