import { Download, FileText, PlayCircle, Gift, Link as LinkIcon, Presentation, ExternalLink } from 'lucide-react'
import { supabase } from '../../lib/supabase'

const STORAGE_BUCKET = 'webinar-content'
const SIGNED_URL_TTL_SECONDS = 3600

const typeConfig = {
  recording: { icon: PlayCircle, accent: 'var(--color-accent)' },
  download: { icon: Download, accent: '#5B9BD5' },
  bonus: { icon: Gift, accent: '#C678DD' },
  slide_deck: { icon: Presentation, accent: '#98C379' },
  resource: { icon: FileText, accent: 'var(--color-ink-muted)' },
  link: { icon: LinkIcon, accent: 'var(--color-accent)' },
}

function isStoragePath(url) {
  return !!url && !/^https?:\/\//i.test(url)
}

async function signStoragePath(path) {
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS)
  if (error) throw error
  return data?.signedUrl ?? null
}

export default function ContentItem({ item }) {
  const { icon: Icon, accent } = typeConfig[item.type] || typeConfig.resource

  // All content types render as a row with a link that opens in a new window
  async function handleClick(e) {
    if (!isStoragePath(item.file_url)) return
    e.preventDefault()
    try {
      const url = await signStoragePath(item.file_url)
      if (url) window.open(url, '_blank', 'noopener,noreferrer')
    } catch (err) {
      window.alert(`Could not open file: ${err.message ?? 'unknown error'}`)
    }
  }

  return (
    <a
      href={item.file_url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
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
      {item.type === 'recording' && (
        <ExternalLink size={16} style={{ color: 'var(--color-ink-muted)', flexShrink: 0 }} />
      )}
    </a>
  )
}
