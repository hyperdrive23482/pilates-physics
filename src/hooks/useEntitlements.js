import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { isActiveEntitlement } from '../lib/entitlements'
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
      // expires_at is fetched so this gate can match what the server enforces.
      .select('webinar_id, expires_at')
      .eq('user_id', userId)
      .then(({ data, error }) => {
        if (!error) setEntitlements(data || [])
        setLoading(false)
      })
  }, [userId, adminLoading])

  function hasAccess(workshopId) {
    if (isAdmin) return true
    return isActiveEntitlement(entitlements.find((e) => e.webinar_id === workshopId))
  }

  return { entitlements, hasAccess, loading: loading || adminLoading }
}
