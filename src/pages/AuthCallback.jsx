import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    function routeUser(event, session) {
      if (event === 'PASSWORD_RECOVERY') {
        navigate('/set-password', { replace: true })
      } else if (session?.user?.user_metadata?.needs_password) {
        navigate('/set-password', { replace: true })
      } else if (session) {
        navigate('/course', { replace: true })
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
      }

      // Check hash fragment for recovery flow
      const hash = window.location.hash
      if (hash.includes('type=recovery')) {
        navigate('/set-password', { replace: true })
        return
      }

      // Try the current session (token may already be exchanged)
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        routeUser('SIGNED_IN', session)
        return
      }

      // Wait for the token exchange
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'PASSWORD_RECOVERY' || session) {
          subscription.unsubscribe()
          routeUser(event, session)
        }
      })
    }

    handleCallback()
  }, [navigate])

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--color-bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: '"DM Sans", sans-serif',
        color: 'var(--color-ink-muted)',
        fontSize: '0.9rem',
      }}
    >
      Signing you in…
    </div>
  )
}
