import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'

export function useAllWebinars() {
  const [webinars, setWebinars] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refetch = useCallback(async () => {
    setLoading(true)
    const { data, error: err } = await supabase
      .from('webinars')
      .select('*')
      .order('scheduled_at', { ascending: false, nullsFirst: false })
    if (err) setError(err)
    else setWebinars(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { webinars, loading, error, refetch }
}

export function useAdminWebinar(slug) {
  const [webinar, setWebinar] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refetch = useCallback(async () => {
    if (!slug) {
      setWebinar(null)
      setLoading(false)
      return
    }
    setLoading(true)
    const { data, error: err } = await supabase
      .from('webinars')
      .select('*')
      .eq('slug', slug)
      .maybeSingle()
    if (err) setError(err)
    else setWebinar(data)
    setLoading(false)
  }, [slug])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { webinar, loading, error, refetch }
}
