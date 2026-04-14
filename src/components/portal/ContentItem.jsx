import { Download, FileText, PlayCircle, Gift, Link as LinkIcon, Presentation } from 'lucide-react'

const typeConfig = {
  recording: { icon: PlayCircle, accent: 'var(--color-accent)' },
  download: { icon: Download, accent: '#5B9BD5' },
  bonus: { icon: Gift, accent: '#C678DD' },
  slide_deck: { icon: Presentation, accent: '#98C379' },
  resource: { icon: FileText, accent: 'var(--color-ink-muted)' },
  link: { icon: LinkIcon, accent: 'var(--color-accent)' },
}

export default function ContentItem({ item }) {
  const { icon: Icon, accent } = typeConfig[item.type] || typeConfig.resource

  // Recordings render as an embedded player
  if (item.type === 'recording' && item.file_url) {
    return (
      <div
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-rule)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '1rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            borderBottom: '1px solid var(--color-rule)',
          }}
        >
          <Icon size={16} style={{ color: accent, flexShrink: 0 }} />
          <span style={{ fontSize: '0.9rem', fontWeight: '500', color: 'var(--color-ink)' }}>
            {item.title}
          </span>
        </div>
        <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
          <iframe
            src={item.file_url}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              border: 'none',
            }}
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            title={item.title}
          />
        </div>
        {item.description && (
          <p
            style={{
              padding: '0.75rem 1.25rem',
              fontSize: '0.85rem',
              color: 'var(--color-ink-muted)',
              margin: 0,
              lineHeight: '1.6',
            }}
          >
            {item.description}
          </p>
        )}
      </div>
    )
  }

  // All other content types render as a row with a link
  return (
    <a
      href={item.file_url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        padding: '1rem 1.25rem',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-rule)',
        textDecoration: 'none',
        transition: 'border-color 0.15s',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = accent)}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--color-rule)')}
    >
      <div
        style={{
          width: '36px',
          height: '36px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: `${accent}15`,
          borderRadius: '4px',
          flexShrink: 0,
        }}
      >
        <Icon size={18} style={{ color: accent }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.9rem', fontWeight: '500', color: 'var(--color-ink)' }}>
          {item.title}
        </div>
        {item.description && (
          <div
            style={{
              fontSize: '0.8rem',
              color: 'var(--color-ink-muted)',
              marginTop: '0.2rem',
              lineHeight: '1.5',
            }}
          >
            {item.description}
          </div>
        )}
      </div>
      {item.type === 'download' && (
        <Download size={16} style={{ color: 'var(--color-ink-muted)', flexShrink: 0 }} />
      )}
    </a>
  )
}
