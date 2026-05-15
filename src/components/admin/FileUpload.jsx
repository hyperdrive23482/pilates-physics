import { useState, useRef } from 'react'
import { Upload, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'

// Upload a file to a Supabase storage bucket.
// Defaults preserve the original webinar-content private-bucket behavior:
//   - bucket: 'webinar-content'
//   - pathPrefix: workshopId (so path becomes {workshopId}/{ts}-{filename})
//   - returnUrl: false (onChange receives the storage path, caller signs it)
// For public buckets, pass returnUrl so onChange receives the public URL directly.
export default function FileUpload({
  workshopId,
  bucket = 'webinar-content',
  pathPrefix,
  returnUrl = false,
  value,
  onChange,
  accept,
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const inputRef = useRef(null)

  // Back-compat: if pathPrefix isn't supplied, fall back to workshopId.
  const resolvedPrefix = pathPrefix ?? workshopId ?? ''
  const disabled = !resolvedPrefix

  async function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!resolvedPrefix) {
      setError('Save first before uploading files')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const safeName = file.name.replace(/[^\w.\-]+/g, '_')
      const path = `${resolvedPrefix}/${Date.now()}-${safeName}`
      const { error: upErr } = await supabase.storage
        .from(bucket)
        .upload(path, file, { cacheControl: '3600', upsert: false })
      if (upErr) throw upErr
      if (returnUrl) {
        const { data } = supabase.storage.from(bucket).getPublicUrl(path)
        onChange(data.publicUrl)
      } else {
        onChange(path)
      }
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
          disabled={busy || disabled}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.45rem 0.85rem',
            background: 'var(--color-bg)',
            color: 'var(--color-ink)',
            border: '1px solid var(--color-rule)',
            cursor: busy || disabled ? 'not-allowed' : 'pointer',
            fontSize: '0.8rem',
            fontFamily: '"DM Sans", sans-serif',
            opacity: busy || disabled ? 0.6 : 1,
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

      {disabled && (
        <span style={{ fontSize: '0.72rem', color: 'var(--color-ink-muted)' }}>
          Save first to enable uploads.
        </span>
      )}
      {error && <span style={{ fontSize: '0.75rem', color: '#ff7d7d' }}>{error}</span>}
    </div>
  )
}
