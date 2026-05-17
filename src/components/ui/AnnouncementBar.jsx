import { Link } from 'react-router-dom'

const MONO = '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace'
const BAR_BG = 'var(--color-surface-raised)'
const BAR_INK = 'var(--color-ink)'

function isExternal(url) {
  return /^https?:\/\//i.test(url)
}

function AnnouncementContent({ announcement }) {
  const hasLink = !!announcement?.link_url && !!announcement?.link_text
  const linkStyle = {
    color: 'var(--color-accent)',
    borderBottom: '1px solid currentColor',
    paddingBottom: '1px',
    marginLeft: '6px',
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    fontWeight: 600,
  }
  return (
    <div
      style={{
        maxWidth: '1480px',
        margin: '0 auto',
        height: '100%',
        padding: '0 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: MONO,
        fontSize: '12px',
        letterSpacing: '0.04em',
        color: BAR_INK,
        textAlign: 'center',
      }}
    >
      <span style={{ lineHeight: 1.2 }}>{announcement?.message}</span>
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
  if (!announcement?.message) return null

  if (variant === 'preview') {
    return (
      <div
        style={{
          position: 'relative',
          height: '2.5rem',
          width: '100%',
          background: BAR_BG,
        }}
      >
        <AnnouncementContent announcement={announcement} />
      </div>
    )
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 60,
        height: '2.5rem',
        background: BAR_BG,
      }}
    >
      <AnnouncementContent announcement={announcement} />
    </div>
  )
}
