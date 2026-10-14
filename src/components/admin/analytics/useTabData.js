import { useCallback, useEffect, useRef, useState } from 'react'
import { useAdminAPI } from '../../../hooks/admin/useAdminAPI'

/**
 * Loads one analytics tab's API block for the selected range.
 *
 * Responses are cached in memory keyed by `tab|range` for the life of the
 * page, so flipping between tabs or back to a range already seen does not
 * refetch. While a new range loads the previous data stays on screen, dimmed
 * by the caller, rather than flashing to a spinner. `reload()` bypasses the
 * cache (after the Settle action, say).
 */
const cache = new Map()
const CACHE_TTL_MS = 5 * 60 * 1000

export function useTabData(tab, range) {
  const { request } = useAdminAPI()
  const key = `${tab}|${range}`
  const [state, setState] = useState(() => {
    const hit = cache.get(key)
    return hit ? { data: hit.data, error: null, loading: false, key } : { data: null, error: null, loading: true, key: null }
  })
  const latest = useRef(key)

  const load = useCallback(
    async ({ force = false } = {}) => {
      latest.current = key
      const hit = cache.get(key)
      if (hit && !force && Date.now() - hit.at < CACHE_TTL_MS) {
        setState({ data: hit.data, error: null, loading: false, key })
        return
      }
      setState((s) => ({ ...s, loading: true, error: null }))
      try {
        const data = await request(`/api/admin/analytics/${tab}?range=${encodeURIComponent(range)}`)
        cache.set(key, { data, at: Date.now() })
        if (latest.current === key) setState({ data, error: null, loading: false, key })
      } catch (e) {
        if (latest.current === key) setState((s) => ({ ...s, error: e.message, loading: false }))
      }
    },
    [request, tab, range, key],
  )

  useEffect(() => {
    load()
  }, [load])

  return {
    data: state.data,
    error: state.error,
    loading: state.loading,
    // True when what is on screen belongs to a different range than selected.
    stale: state.key !== key,
    reload: () => load({ force: true }),
  }
}
