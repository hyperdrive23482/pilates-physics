import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAdmin } from './useAdmin'

export function useEntitlements(userId) {
  const { isAdmin, loading: adminLoading } = useAdmin()
  const [entitlements, setEntitlements] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (adminLoading) return
    if (!userId) {
      setEntitlements([])
      setLoading(false)
      return
    }

    supabase
      .from('user_entitlements')
      .select('webinar_id')
      .eq('user_id', userId)
      .then(({ data, error }) => {
        if (!error) setEntitlements((data || []).map((e) => e.webinar_id))
        setLoading(false)
      })
  }, [userId, adminLoading])

  function hasAccess(webinarId) {
    if (isAdmin) return true
    return entitlements.includes(webinarId)
  }

  return { entitlements, hasAccess, loading: loading || adminLoading }
}
