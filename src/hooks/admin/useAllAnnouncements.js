import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'

export function useAllAnnouncements() {
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refetch = useCallback(async () => {
    setLoading(true)
    const { data, error: err } = await supabase
      .from('announcements')
      .select('*')
      .order('starts_at', { ascending: false })
    if (err) setError(err)
    else setAnnouncements(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { announcements, loading, error, refetch }
}

export function useAdminAnnouncement(id) {
  const [announcement, setAnnouncement] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refetch = useCallback(async () => {
    if (!id) {
      setAnnouncement(null)
      setLoading(false)
      return
    }
    setLoading(true)
    const { data, error: err } = await supabase
      .from('announcements')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    if (err) setError(err)
    else setAnnouncement(data)
    setLoading(false)
  }, [id])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { announcement, loading, error, refetch }
}
