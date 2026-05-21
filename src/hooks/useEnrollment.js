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

  // Passwordless login: emails a sign-in link plus a 6-digit code. shouldCreateUser
  // is false so the login page can never create an account. Accounts come only
  // from a workshop purchase or the free-course signup.
  async function signInWithLink(email) {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) throw error
  }

  // Finishes a passwordless login with the numeric code from the sign-in email.
  // Supabase projects differ in which OTP type the emailed code verifies against,
  // so try 'email' first and fall back to 'magiclink'.
  async function verifyEmailCode(email, token) {
    const first = await supabase.auth.verifyOtp({ email, token, type: 'email' })
    if (!first.error) return
    const second = await supabase.auth.verifyOtp({ email, token, type: 'magiclink' })
    if (second.error) throw second.error
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

  return { user, loading, signUp, signIn, signInWithLink, verifyEmailCode, setPassword, resetPasswordRequest, updateProfile, signOut }
}
