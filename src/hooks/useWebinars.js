import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useWebinars() {
  const [webinars, setWebinars] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchWebinars()
  }, [])

  async function fetchWebinars() {
    setLoading(true)
    const { data, error } = await supabase
      .from('webinars')
      .select('*')
      .order('scheduled_at', { ascending: false })
    if (!error) setWebinars(data || [])
    setLoading(false)
  }

  return { webinars, loading, refetch: fetchWebinars }
}

export function useWebinar(slug) {
  const [webinar, setWebinar] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    supabase
      .from('webinars')
      .select('*')
      .eq('slug', slug)
      .single()
      .then(({ data, error }) => {
        if (!error) setWebinar(data)
        setLoading(false)
      })
  }, [slug])

  return { webinar, loading }
}

export function useMyWebinars(userId) {
  const [webinars, setWebinars] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) {
      setWebinars([])
      setLoading(false)
      return
    }

    supabase
      .from('user_entitlements')
      .select('*, webinar:webinars(*)')
      .eq('user_id', userId)
      .then(({ data, error }) => {
        if (!error) {
          setWebinars(
            (data || [])
              .map((e) => e.webinar)
              .filter(Boolean)
              .sort((a, b) => {
                const order = { live: 0, upcoming: 1, complete: 2, archived: 3 }
                return (order[a.status] ?? 9) - (order[b.status] ?? 9)
              })
          )
        }
        setLoading(false)
      })
  }, [userId])

  return { webinars, loading }
}
