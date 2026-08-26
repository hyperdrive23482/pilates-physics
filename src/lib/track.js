import { supabase } from './supabase'

/**
 * Fire-and-forget activity ping. Never awaited by callers, never throws, never
 * blocks a render: a slow or failed track call must not be visible to a user.
 *
 * keepalive lets the request survive the navigation that usually follows
 * immediately (magic-link callback redirect, download click). accessToken is an
 * escape hatch for the moment right after verifyOtp resolves, where reading the
 * session back out of storage is a race.
 */
export function track(eventType, payload = {}, accessToken = null) {
  ;(async () => {
    try {
      let token = accessToken
      if (!token) {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        token = session?.access_token
      }
      if (!token) return

      await fetch('/api/track', {
        method: 'POST',
        keepalive: true,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event_type: eventType,
          path: window.location.pathname,
          ...payload,
        }),
      })
    } catch {
      // Best-effort by design. Swallowed on purpose.
    }
  })()
}
