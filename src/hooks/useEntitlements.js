import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useEntitlements(userId) {
  const [entitlements, setEntitlements] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
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
  }, [userId])

  function hasAccess(webinarId) {
    return entitlements.includes(webinarId)
  }

  return { entitlements, hasAccess, loading }
}
