import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useEnrollment() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Hydrate from current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Keep in sync with auth state changes (magic link callback, sign out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function sendMagicLink(email) {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) throw error
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  return { user, loading, sendMagicLink, signOut }
}
