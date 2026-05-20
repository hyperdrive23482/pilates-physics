import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAdmin } from './useAdmin'

export function useWorkshops() {
  const [workshops, setWorkshops] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchWorkshops()
  }, [])

  async function fetchWorkshops() {
    setLoading(true)
    const { data, error } = await supabase
      .from('webinars')
      .select('*')
      .order('scheduled_at', { ascending: false })
    if (!error) setWorkshops(data || [])
    setLoading(false)
  }

  return { workshops, loading, refetch: fetchWorkshops }
}

export function useNextWorkshop() {
  const [workshop, setWorkshop] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    let timer

    async function fetchNext() {
      const { data, error } = await supabase
        .from('webinars')
        .select('*')
        .gt('scheduled_at', new Date().toISOString())
        .in('status', ['upcoming', 'live'])
        .order('scheduled_at', { ascending: true })
        .limit(1)
        .maybeSingle()

      if (cancelled) return
      if (!error) {
        setWorkshop(data || null)
        // Re-fetch right after the current "next" workshop starts so the CTA
        // automatically flips to the following one without a page reload.
        if (data?.scheduled_at) {
          const ms = new Date(data.scheduled_at).getTime() - Date.now()
          if (ms > 0) timer = setTimeout(fetchNext, ms + 1000)
        }
      }
      setLoading(false)
    }

    fetchNext()
    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
    }
  }, [])

  return { workshop, loading }
}

export function useWorkshop(slug) {
  const [workshop, setWorkshop] = useState(null)
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
        if (!error) setWorkshop(data)
        setLoading(false)
      })
  }, [slug])

  return { workshop, loading }
}

export function useMyWorkshops(userId) {
  const { isAdmin, loading: adminLoading } = useAdmin()
  const [workshops, setWorkshops] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (adminLoading) return
    if (!userId) {
      setWorkshops([])
      setLoading(false)
      return
    }

    const sortByStatus = (list) =>
      list.sort((a, b) => {
        const order = { live: 0, upcoming: 1, awaiting_recording: 2, complete: 3, archived: 4 }
        return (order[a.status] ?? 9) - (order[b.status] ?? 9)
      })

    // Admins see every non-draft workshop without needing entitlements.
    if (isAdmin) {
      supabase
        .from('webinars')
        .select('*')
        .neq('status', 'draft')
        .then(({ data, error }) => {
          if (!error) setWorkshops(sortByStatus(data || []))
          setLoading(false)
        })
      return
    }

    supabase
      .from('user_entitlements')
      .select('*, workshop:webinars(*)')
      .eq('user_id', userId)
      .then(({ data, error }) => {
        if (!error) {
          setWorkshops(
            sortByStatus(
              (data || [])
                .map((e) => e.workshop)
                .filter(Boolean)
            )
          )
        }
        setLoading(false)
      })
  }, [userId, isAdmin, adminLoading])

  return { workshops, loading }
}
