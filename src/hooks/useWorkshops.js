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
        const order = { live: 0, upcoming: 1, complete: 2, archived: 3 }
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
