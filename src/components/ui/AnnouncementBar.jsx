import { Link } from 'react-router-dom'

function isExternal(url) {
  return /^https?:\/\//i.test(url)
}

function AnnouncementContent({ announcement }) {
  const hasLink = !!announcement?.link_url && !!announcement?.link_text
  const linkStyle = {
    color: 'var(--color-accent)',
    textDecoration: 'underline',
    whiteSpace: 'nowrap',
    fontWeight: 500,
  }
  return (
    <div
      style={{
        maxWidth: '1100px',
        margin: '0 auto',
        height: '100%',
        padding: '0 1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.75rem',
        fontFamily: '"DM Sans", sans-serif',
        fontSize: '0.78rem',
        color: 'var(--color-ink)',
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
          background: 'var(--color-surface-raised)',
          border: '1px solid var(--color-rule)',
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
        background: 'var(--color-surface-raised)',
      }}
    >
      <AnnouncementContent announcement={announcement} />
    </div>
  )
}
