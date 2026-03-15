import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    // Supabase automatically exchanges the token in the URL hash.
    // Wait for the session to be established, then redirect.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/course', { replace: true })
      } else {
        // Token exchange happens via onAuthStateChange; listen once.
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
          if (session) {
            subscription.unsubscribe()
            navigate('/course', { replace: true })
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
