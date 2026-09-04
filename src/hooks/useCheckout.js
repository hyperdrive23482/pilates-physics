import { useState, useCallback } from 'react'
import { useEnrollment } from './useEnrollment'
import { supabase } from '../lib/supabase'

/**
 * Start a Stripe checkout for one product.
 *
 * Lifted out of RegisterCard so the course pricing block can sell without
 * inheriting a card built around a live event (a date line, a waitlist, "2
 * hours on Zoom"). Both call this, so the request shape, the already-enrolled
 * handling and the error states cannot drift apart.
 *
 * A logged-in buyer sends only the slug and their token; the server reads the
 * rest off the session. Everyone else sends their name and email, which is
 * what the account gets created from.
 *
 * States: idle | loading | error | already_enrolled
 */
export function useCheckout(slug) {
  const { user, signOut } = useEnrollment()
  const [status, setStatus] = useState('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [portalUrl, setPortalUrl] = useState(null)

  // A buyer whose account has no last name, e.g. a first-name-only Springs
  // 101 signup. Worth asking, because this is the name printed on their CEC
  // certificate; provisioning backfills the blank from what they enter.
  const needsLastName =
    Boolean(user) && !String(user?.user_metadata?.last_name ?? '').trim()

  const checkout = useCallback(
    async ({ email, firstName, lastName } = {}) => {
      if (needsLastName && !String(lastName ?? '').trim()) {
        setStatus('error')
        setErrorMsg('Please add your last name so we can print it on your certificate.')
        return
      }

      setStatus('loading')
      setErrorMsg('')

      try {
        const headers = { 'Content-Type': 'application/json' }
        if (user) {
          const { data } = await supabase.auth.getSession()
          const token = data.session?.access_token
          if (token) headers.Authorization = `Bearer ${token}`
        }

        const body = user
          ? needsLastName
            ? { slug, lastName }
            : { slug }
          : { slug, email, firstName, lastName }

        const res = await fetch('/api/checkout/create-session', {
          method: 'POST',
          headers,
          body: JSON.stringify(body),
        })

        // Already owns it. Not an error: send them to the thing they bought.
        if (res.status === 409) {
          const data = await res.json().catch(() => ({}))
          setPortalUrl(data.portalUrl || `/portal/${slug}`)
          setStatus('already_enrolled')
          return
        }

        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error || `Request failed (${res.status})`)
        }

        const { url } = await res.json()
        window.location.href = url
      } catch (err) {
        setErrorMsg(err.message || 'Something went wrong. Try again.')
        setStatus('error')
      }
    },
    [slug, user, needsLastName],
  )

  return { checkout, status, errorMsg, portalUrl, user, signOut, needsLastName }
}
