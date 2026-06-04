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

// Resolves the workshop a branded landing page should show: the soonest
// upcoming/live session in the future whose slug matches a series prefix
// (e.g. 'PP-101' → 'PP-101-Aug-2026'). Mirrors useNextWorkshop but scoped to a
// series, so creating a new cohort and marking it 'upcoming' is all it takes to
// point the page at the new price ID and kit tag. Returns null (not an error)
// when nothing is upcoming, so the page can fall back to the waitlist.
export function useCurrentWorkshop(seriesPrefix) {
  const [workshop, setWorkshop] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!seriesPrefix) {
      setLoading(false)
      return
    }
    let cancelled = false
    let timer

    async function fetchCurrent() {
      const { data, error } = await supabase
        .from('webinars')
        .select('*')
        .ilike('slug', `${seriesPrefix}-%`)
        .eq('kind', 'webinar')
        .in('status', ['upcoming', 'live'])
        .gt('scheduled_at', new Date().toISOString())
        .order('scheduled_at', { ascending: true })
        .limit(1)
        .maybeSingle()

      if (cancelled) return
      if (!error) {
        setWorkshop(data || null)
        // Re-resolve right after the shown session starts so the page rolls
        // forward to the next cohort without a reload.
        if (data?.scheduled_at) {
          const ms = new Date(data.scheduled_at).getTime() - Date.now()
          if (ms > 0) timer = setTimeout(fetchCurrent, ms + 1000)
        }
      }
      setLoading(false)
    }

    fetchCurrent()
    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
    }
  }, [seriesPrefix])

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
