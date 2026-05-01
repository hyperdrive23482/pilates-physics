import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

// Parses RFC 6266 Content-Disposition header to extract filename, if present.
function filenameFromDisposition(header) {
  if (!header) return null
  const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(header)
  return match ? decodeURIComponent(match[1]) : null
}

/**
 * Hook that downloads a certificate PDF for a given webinar.
 * Usage:
 *   const { download, busy, error } = useCertificateDownload()
 *   await download(webinar)
 */
export function useCertificateDownload() {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const download = useCallback(async (webinar) => {
    if (!webinar?.id || !webinar?.slug) {
      setError('Missing workshop info')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) throw new Error('Not signed in')

      const res = await fetch(`/api/certificate/${webinar.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) {
        let message = `Download failed (${res.status})`
        try {
          const body = await res.json()
          if (body?.error) message = body.error
        } catch {
          // non-JSON error body — keep generic message
        }
        throw new Error(message)
      }

      const blob = await res.blob()
      const filename =
        filenameFromDisposition(res.headers.get('Content-Disposition')) ||
        `certificate-${webinar.slug}.pdf`

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err.message ?? 'Download failed')
    } finally {
      setBusy(false)
    }
  }, [])

  return { download, busy, error }
}
