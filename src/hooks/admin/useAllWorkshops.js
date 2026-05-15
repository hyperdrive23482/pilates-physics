import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'

export function useAllWorkshops() {
  const [workshops, setWorkshops] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refetch = useCallback(async () => {
    setLoading(true)
    const { data, error: err } = await supabase
      .from('webinars')
      .select('*')
      .order('scheduled_at', { ascending: false, nullsFirst: false })
    if (err) setError(err)
    else setWorkshops(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { workshops, loading, error, refetch }
}

export function useAdminWorkshop(slug) {
  const [workshop, setWorkshop] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refetch = useCallback(async () => {
    if (!slug) {
      setWorkshop(null)
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
    else setWorkshop(data)
    setLoading(false)
  }, [slug])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { workshop, loading, error, refetch }
}
