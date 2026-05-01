import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useActiveAnnouncement() {
  const [announcement, setAnnouncement] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function fetchActive() {
      const { data, error } = await supabase
        .from('announcements')
        .select('id, message, link_url, link_text, starts_at')
        .lte('starts_at', new Date().toISOString())
        .eq('enabled', true)
        .order('starts_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (cancelled) return
      if (error) {
        setAnnouncement(null)
      } else {
        setAnnouncement(data ?? null)
      }
      setLoading(false)
    }
    fetchActive()
    return () => {
      cancelled = true
    }
  }, [])

  return { announcement, loading }
}
