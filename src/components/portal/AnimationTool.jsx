import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function AnimationTool({ slug }) {
  const [html, setHtml] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      setHtml('')
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        const token = session?.access_token
        if (!token) throw new Error('Not signed in')

        const res = await fetch(`/api/portal/animation?slug=${encodeURIComponent(slug)}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json?.error ?? `Request failed (${res.status})`)
        if (!cancelled) setHtml(json.html)
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [slug])

  if (loading) {
    return (
      <p style={{ color: 'var(--color-ink-muted)', fontSize: '0.9rem' }}>Loading animation…</p>
    )
  }
  if (error) {
    return <p style={{ color: '#ff7d7d', fontSize: '0.85rem' }}>{error}</p>
  }
  if (!html) return null

  return (
    <div className="pp-animation-tool">
      <iframe
        srcDoc={html}
        title={slug}
        style={{
          width: '100%',
          border: 'none',
          display: 'block',
          background: '#0e0e0e',
        }}
      />
    </div>
  )
}
