import { useCallback, useEffect, useRef, useState } from 'react'
import { useAdminAPI } from '../../../hooks/admin/useAdminAPI'

/**
 * Loads one admin resource for a cache key, the way the analytics tabs do
 * (useTabData), but for an arbitrary path so the Funnel page can hold its two
 * halves (our tables and Kit; PostHog) in separate requests that fail
 * separately.
 *
 * Responses are cached in memory keyed by `path` for the life of the page,
 * so flipping the range or product back to one already seen does not
 * refetch. While a new key loads the previous data stays on screen, dimmed
 * by the caller, rather than flashing to a spinner. `reload()` bypasses the
 * cache.
 */
const cache = new Map()
const CACHE_TTL_MS = 5 * 60 * 1000

export function useFunnelData(path) {
  const { request } = useAdminAPI()
  const [state, setState] = useState(() => {
    const hit = cache.get(path)
    return hit ? { data: hit.data, error: null, loading: false, key: path } : { data: null, error: null, loading: true, key: null }
  })
  const latest = useRef(path)

  const load = useCallback(
    async ({ force = false } = {}) => {
      latest.current = path
      const hit = cache.get(path)
      if (hit && !force && Date.now() - hit.at < CACHE_TTL_MS) {
        setState({ data: hit.data, error: null, loading: false, key: path })
        return
      }
      setState((s) => ({ ...s, loading: true, error: null }))
      try {
        const data = await request(path)
        cache.set(path, { data, at: Date.now() })
        if (latest.current === path) setState({ data, error: null, loading: false, key: path })
      } catch (e) {
        if (latest.current === path) setState((s) => ({ ...s, error: e.message, loading: false }))
      }
    },
    [request, path],
  )

  useEffect(() => {
    load()
  }, [load])

  return {
    data: state.data,
    error: state.error,
    loading: state.loading,
    // True when what is on screen belongs to a different key than selected.
    stale: state.key !== path,
    reload: () => load({ force: true }),
  }
}
