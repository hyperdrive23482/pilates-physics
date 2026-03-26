import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    function handleRedirect(event, session) {
      if (event === 'PASSWORD_RECOVERY') {
        navigate('/set-password', { replace: true })
      } else if (session) {
        // New signup — user still needs to create a password
        if (session.user?.user_metadata?.needs_password) {
          navigate('/set-password', { replace: true })
        } else {
          navigate('/course', { replace: true })
        }
      }
    }

    // Try the current session first (token may already be exchanged)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        // Check hash for recovery flow — Supabase puts type in the URL fragment
        const hash = window.location.hash
        if (hash.includes('type=recovery')) {
          navigate('/set-password', { replace: true })
        } else if (session.user?.user_metadata?.needs_password) {
          navigate('/set-password', { replace: true })
        } else {
          navigate('/course', { replace: true })
        }
      } else {
        // Wait for the token exchange
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if (event === 'PASSWORD_RECOVERY' || session) {
            subscription.unsubscribe()
            handleRedirect(event, session)
          }
        })
      }
    })
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
