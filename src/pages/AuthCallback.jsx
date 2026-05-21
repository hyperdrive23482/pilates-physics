import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import ExpiredLinkNotice from '../components/ui/ExpiredLinkNotice'

export default function AuthCallback() {
  const navigate = useNavigate()
  const [status, setStatus] = useState('working') // working | error

  useEffect(() => {
    let timeoutId
    let subscription

    function routeUser(event, session) {
      if (event === 'PASSWORD_RECOVERY') {
        navigate('/set-password', { replace: true })
      } else if (session?.user?.user_metadata?.needs_password) {
        navigate('/set-password', { replace: true })
      } else if (session) {
        navigate('/portal', { replace: true })
      }
    }

    async function handleCallback() {
      // Check for token_hash in query params (email confirmation via updated template)
      const params = new URLSearchParams(window.location.search)
      const tokenHash = params.get('token_hash')
      const type = params.get('type')

      if (tokenHash && type) {
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type,
        })
        if (!error && data?.session) {
          routeUser(type === 'recovery' ? 'PASSWORD_RECOVERY' : 'SIGNED_IN', data.session)
          return
        }
        // verifyOtp failed: the link is expired, already used, or malformed.
        // A single-use link clicked twice fails here even though the first click
        // already established a session, so route to the portal instead of a
        // scary error when one already exists.
        console.error('[auth/callback] verifyOtp failed:', error?.message)
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          routeUser('SIGNED_IN', session)
          return
        }
        setStatus('error')
        return
      }

      // Hash fragment recovery flow (default {{ .ConfirmationURL }} links land
      // tokens in the hash, parsed by detectSessionInUrl). Confirm a session
      // actually landed before routing to the password form.
      if (window.location.hash.includes('type=recovery')) {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          routeUser('PASSWORD_RECOVERY', session)
        } else {
          console.error('[auth/callback] recovery hash present but no session established')
          setStatus('error')
        }
        return
      }

      // Try the current session (token may already be exchanged)
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        routeUser('SIGNED_IN', session)
        return
      }

      // Wait for the token exchange, but give up after 8s instead of hanging.
      const result = supabase.auth.onAuthStateChange((event, nextSession) => {
        if (event === 'PASSWORD_RECOVERY' || nextSession) {
          clearTimeout(timeoutId)
          subscription?.unsubscribe()
          routeUser(event, nextSession)
        }
      })
      subscription = result.data.subscription

      timeoutId = setTimeout(() => {
        subscription?.unsubscribe()
        console.error('[auth/callback] timed out waiting for session')
        setStatus('error')
      }, 8000)
    }

    handleCallback()

    return () => {
      clearTimeout(timeoutId)
      subscription?.unsubscribe()
    }
  }, [navigate])

  if (status === 'error') {
    return <ExpiredLinkNotice />
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-serif)',
        color: 'var(--color-ink-muted)',
        fontSize: '0.9rem',
      }}
    >
      Signing you in…
    </div>
  )
}
