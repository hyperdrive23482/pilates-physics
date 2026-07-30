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

// Content types meant to be viewed/streamed in a new tab rather than downloaded.
const VIEW_TYPES = new Set(['recording', 'link'])

function isStoragePath(url) {
  return !!url && !/^https?:\/\//i.test(url)
}

function basename(path) {
  const clean = String(path).split('?')[0].split('#')[0]
  const parts = clean.split('/')
  return parts[parts.length - 1] || ''
}

// `download` may be a filename string (sets Content-Disposition: attachment;
// filename=...) or boolean true. This is what forces a real download instead of
// opening a tab — the anchor `download` attribute is ignored for cross-origin URLs.
async function signStoragePath(path, download) {
  const options = download ? { download } : undefined
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS, options)
  if (error) throw error
  return data?.signedUrl ?? null
}

function triggerDownload(url, filename) {
  const a = document.createElement('a')
  a.href = url
  if (filename) a.download = filename
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
}

export default function ContentItem({ item }) {
  const { icon: Icon, accent } = typeConfig[item.type] || typeConfig.resource

  async function handleClick(e) {
    // External http(s) URLs: let the native anchor open them in a new tab.
    if (!isStoragePath(item.file_url)) return
    e.preventDefault()

    // Recordings / links stored in the bucket should open in a tab. Open it
    // synchronously so the browser keeps the user-gesture and doesn't block it,
    // then point it at the signed URL once we have it.
    if (VIEW_TYPES.has(item.type)) {
      const win = window.open('about:blank', '_blank')
      try {
        const url = await signStoragePath(item.file_url)
        if (url && win) {
          win.opener = null
          win.location.href = url
        } else if (win) {
          win.close()
        }
      } catch (err) {
        if (win) win.close()
        window.alert(`Could not open file: ${err.message ?? 'unknown error'}`)
      }
      return
    }

    // Everything else (PDFs, slide decks, resources, bonuses): force a real
    // download so pop-up blockers never come into play.
    try {
      const filename = basename(item.file_url)
      const url = await signStoragePath(item.file_url, filename || true)
      if (url) triggerDownload(url, filename)
    } catch (err) {
      window.alert(`Could not download file: ${err.message ?? 'unknown error'}`)
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
