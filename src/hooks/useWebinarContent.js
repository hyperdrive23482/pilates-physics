import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useWebinarContent(webinarId, webinarStatus) {
  const [content, setContent] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!webinarId) {
      setContent([])
      setLoading(false)
      return
    }

    supabase
      .from('webinar_content')
      .select('*')
      .eq('webinar_id', webinarId)
      .order('sort_order', { ascending: true })
      .then(({ data, error }) => {
        if (!error) {
          const isPostWebinar = webinarStatus === 'complete' || webinarStatus === 'archived'
          const filtered = (data || []).filter(
            (item) => item.available_after === 'always' || isPostWebinar
          )
          setContent(filtered)
        }
        setLoading(false)
      })
  }, [webinarId, webinarStatus])

  return { content, loading }
}
