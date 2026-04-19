import { useState, useRef } from 'react'
import { Upload, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'

// Upload a file to the webinar-content bucket under {webinarId}/{timestamp}-{filename}.
// On success, returns the stored path. Caller resolves to a signed URL or persists the path.
export default function FileUpload({ webinarId, value, onChange, accept }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const inputRef = useRef(null)

  async function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!webinarId) {
      setError('Save the webinar first before uploading files')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const safeName = file.name.replace(/[^\w.\-]+/g, '_')
      const path = `${webinarId}/${Date.now()}-${safeName}`
      const { error: upErr } = await supabase.storage
        .from('webinar-content')
        .upload(path, file, { cacheControl: '3600', upsert: false })
      if (upErr) throw upErr
      onChange(path)
    } catch (err) {
      setError(err.message ?? 'Upload failed')
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy || !webinarId}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.45rem 0.85rem',
            background: 'var(--color-bg)',
            color: 'var(--color-ink)',
            border: '1px solid var(--color-rule)',
            cursor: busy || !webinarId ? 'not-allowed' : 'pointer',
            fontSize: '0.8rem',
            fontFamily: '"DM Sans", sans-serif',
            opacity: busy || !webinarId ? 0.6 : 1,
          }}
        >
          <Upload size={14} />
          {busy ? 'Uploading…' : 'Upload file'}
        </button>

        {value && (
          <>
            <code
              style={{
                fontSize: '0.72rem',
                color: 'var(--color-ink-muted)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '260px',
              }}
              title={value}
            >
              {value}
            </code>
            <button
              type="button"
              onClick={() => onChange('')}
              aria-label="Clear file"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-ink-muted)',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              <X size={14} />
            </button>
          </>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFile}
        style={{ display: 'none' }}
      />

      {!webinarId && (
        <span style={{ fontSize: '0.72rem', color: 'var(--color-ink-muted)' }}>
          Save the webinar first to enable uploads.
        </span>
      )}
      {error && <span style={{ fontSize: '0.75rem', color: '#ff7d7d' }}>{error}</span>}
    </div>
  )
}
