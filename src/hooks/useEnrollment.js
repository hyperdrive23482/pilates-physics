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

    // Keep in sync with auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function signUp(email, firstName, lastName) {
    const { error } = await supabase.auth.signUp({
      email,
      password: crypto.randomUUID(),
      options: {
        data: { first_name: firstName, last_name: lastName, needs_password: true },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) throw error
  }

  async function signIn(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  async function setPassword(password) {
    const { error } = await supabase.auth.updateUser({
      password,
      data: { needs_password: false },
    })
    if (error) throw error
  }

  async function resetPasswordRequest(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback`,
    })
    if (error) throw error
  }

  async function updateProfile({ firstName, lastName, email, password }) {
    const updates = {}
    if (email) updates.email = email
    if (password) updates.password = password
    if (firstName !== undefined || lastName !== undefined) {
      updates.data = {
        ...(firstName !== undefined && { first_name: firstName }),
        ...(lastName !== undefined && { last_name: lastName }),
      }
    }
    const { error } = await supabase.auth.updateUser(updates)
    if (error) throw error
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  return { user, loading, signUp, signIn, setPassword, resetPasswordRequest, updateProfile, signOut }
}
