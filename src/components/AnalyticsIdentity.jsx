import { useEffect, useRef } from 'react'
import { useEnrollment } from '../hooks/useEnrollment'
import { identifyUser, optOutCapturing, resetUser } from '../lib/posthog'

/**
 * Ties PostHog events to the signed-in person, and keeps admins out.
 *
 * - On sign-in: identify by Supabase user id, unless the account is an admin,
 *   in which case capturing is switched off so our own admin and portal usage
 *   never counts as traffic or engagement.
 * - On sign-out: reset to a fresh anonymous id.
 *
 * Renders nothing. Uses the lib/posthog helpers rather than a hook because the
 * SDK loads lazily and the helpers queue anything that arrives first.
 */
export default function AnalyticsIdentity() {
  const { user } = useEnrollment()
  const handledUserId = useRef(null)

  useEffect(() => {
    if (!user) {
      if (handledUserId.current) {
        resetUser()
        handledUserId.current = null
      }
      return
    }

    // Supabase re-emits SIGNED_IN on tab refocus and token refresh with a new
    // user object each time. Handle each account once.
    if (handledUserId.current === user.id) return
    handledUserId.current = user.id

    if (user.user_metadata?.is_admin === true) {
      optOutCapturing()
      return
    }
    identifyUser(user.id)
  }, [user])

  return null
}
