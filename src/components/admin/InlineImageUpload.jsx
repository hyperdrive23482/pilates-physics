import { useState, useRef } from 'react'
import { Image as ImageIcon, Copy, Check, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'

// Uploads an image to a public bucket and produces a `![](url)` markdown snippet
// that the user can paste into the markdown editor at their cursor. Auto-copies
// to clipboard on success when permitted; falls back to a manual Copy button.
export default function InlineImageUpload({
  bucket = 'blog-images',
  pathPrefix,
  label = 'Upload inline image',
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [snippet, setSnippet] = useState(null)
  const [copied, setCopied] = useState(false)
  const inputRef = useRef(null)

  async function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!pathPrefix) {
      setError('Save first before uploading')
      return
    }
    setBusy(true)
    setError(null)
    setCopied(false)
    try {
      const safeName = file.name.replace(/[^\w.\-]+/g, '_')
      const path = `${pathPrefix}/inline/${Date.now()}-${safeName}`
      const { error: upErr } = await supabase.storage
        .from(bucket)
        .upload(path, file, { cacheControl: '3600', upsert: false })
      if (upErr) throw upErr
      const { data } = supabase.storage.from(bucket).getPublicUrl(path)
      const md = `![](${data.publicUrl})`
      setSnippet(md)
      try {
        await navigator.clipboard.writeText(md)
        setCopied(true)
      } catch {
        // Clipboard may be blocked by browser permissions — user can hit Copy manually.
      }
    } catch (err) {
      setError(err.message ?? 'Upload failed')
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  async function copyManual() {
    if (!snippet) return
    try {
      await navigator.clipboard.writeText(snippet)
      setCopied(true)
    } catch {
      setError('Could not copy — select the snippet and copy manually')
    }
  }

  const disabled = !pathPrefix

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy || disabled}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.35rem 0.7rem',
            background: 'var(--color-bg)',
            color: 'var(--color-ink)',
            border: '1px solid var(--color-rule)',
            cursor: busy || disabled ? 'not-allowed' : 'pointer',
            fontSize: '0.75rem',
            fontFamily: '"DM Sans", sans-serif',
            opacity: busy || disabled ? 0.6 : 1,
          }}
        >
          <ImageIcon size={13} />
          {busy ? 'Uploading…' : label}
        </button>

        {snippet && (
          <>
            <code
              style={{
                fontSize: '0.7rem',
                color: 'var(--color-ink-muted)',
                background: 'var(--color-surface)',
                padding: '0.2rem 0.45rem',
                border: '1px solid var(--color-rule)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '320px',
              }}
              title={snippet}
            >
              {snippet}
            </code>
            <button
              type="button"
              onClick={copyManual}
              style={{
                background: 'none',
                border: 'none',
                color: copied ? 'var(--color-accent)' : 'var(--color-ink-muted)',
                cursor: 'pointer',
                padding: 0,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                fontSize: '0.72rem',
              }}
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied ? 'Copied — paste into the editor' : 'Copy'}
            </button>
            <button
              type="button"
              onClick={() => {
                setSnippet(null)
                setCopied(false)
              }}
              aria-label="Dismiss"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-ink-muted)',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              <X size={13} />
            </button>
          </>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        style={{ display: 'none' }}
      />

      {disabled && (
        <span style={{ fontSize: '0.7rem', color: 'var(--color-ink-muted)' }}>
          Save first to enable uploads.
        </span>
      )}
      {error && <span style={{ fontSize: '0.72rem', color: '#ff7d7d' }}>{error}</span>}
    </div>
  )
}
