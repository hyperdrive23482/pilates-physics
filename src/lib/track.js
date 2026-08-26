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
  // Read the path synchronously, before any await. Sign-in flows navigate the
  // moment the session resolves, so reading it later records where the user
  // landed rather than where the event happened.
  const path = window.location.pathname

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

      // Not /api/track: that path is blocked by common ad-blocker filter
      // lists, and a blocked ping is silent. See api/portal/activity.js.
      await fetch('/api/portal/activity', {
        method: 'POST',
        keepalive: true,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event_type: eventType,
          path,
          ...payload,
        }),
      })
    } catch {
      // Best-effort by design. Swallowed on purpose.
    }
  })()
}
