import { useCallback } from 'react'
import { supabase } from '../../lib/supabase'

// Thin wrapper around fetch that attaches the current Supabase JWT to
// /api/admin/* calls so the server can verify is_admin.
export function useAdminAPI() {
  const request = useCallback(async (path, { method = 'GET', body } = {}) => {
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token
    if (!token) throw new Error('Not signed in')

    const res = await fetch(path, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    })

    const text = await res.text()
    const json = text ? JSON.parse(text) : null
    if (!res.ok) {
      throw new Error(json?.error ?? `Request failed (${res.status})`)
    }
    return json
  }, [])

  return { request }
}
