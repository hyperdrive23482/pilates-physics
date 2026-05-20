import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useWorkshopContent(workshopId, workshopStatus) {
  const [content, setContent] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!workshopId) {
      setContent([])
      setLoading(false)
      return
    }

    supabase
      .from('webinar_content')
      .select('*')
      .eq('webinar_id', workshopId)
      .order('sort_order', { ascending: true })
      .then(({ data, error }) => {
        if (!error) {
          const isPostWorkshop =
            workshopStatus === 'awaiting_recording' ||
            workshopStatus === 'complete' ||
            workshopStatus === 'archived'
          const filtered = (data || []).filter(
            (item) => item.available_after === 'always' || isPostWorkshop
          )
          setContent(filtered)
        }
        setLoading(false)
      })
  }, [workshopId, workshopStatus])

  return { content, loading }
}
