// Supabase auth errors are terse and technical. friendlyAuthError translates the
// ones a customer can actually hit into plain language that points at the next
// step. Shared across every auth page so the wording stays consistent.
//
// context is the action that failed:
//   'send'        login link / code request
//   'verify'      one-time code entry
//   'password'    password login
//   'signup'      free-course account creation
//   'reset'       password-reset request
//   'setpassword' choosing a password from an email link
//   'profile'     account settings update
export function friendlyAuthError(err, context) {
  const raw = (err?.message || '').toLowerCase()

  // Lost or flaky internet connection.
  if (raw.includes('failed to fetch') || raw.includes('load failed') || raw.includes('network')) {
    return "We couldn't reach the server. Check your internet connection and try again."
  }

  // No account exists for this email (login link request, shouldCreateUser off).
  if (raw.includes('signups not allowed') || raw.includes('user not found')) {
    return "We couldn't find an account for that email. Double-check the spelling, or try the address you signed up with."
  }

  // An account already exists for this email.
  if (raw.includes('already registered') || raw.includes('already been registered')) {
    return context === 'profile'
      ? 'That email is already used by another account. Try a different one.'
      : 'An account with that email already exists. Log in instead, or reset your password if you have forgotten it.'
  }

  // Too many emails requested in a short window.
  if (raw.includes('security purposes') || raw.includes('rate limit')) {
    return 'That was just sent. Wait a moment, then try again.'
  }

  // One-time code rejected.
  if (context === 'verify' && (raw.includes('expired') || raw.includes('invalid') || raw.includes('token'))) {
    return "That code didn't work. Enter the complete code from the most recent email, or get a fresh one below."
  }

  // Wrong email/password on password login.
  if (context === 'password' && raw.includes('invalid login credentials')) {
    return 'That email and password did not match. If you never set a password, choose "Email me a sign-in link instead" below.'
  }

  // Reused password when choosing a new one.
  if (raw.includes('different from the old password')) {
    return 'Choose a password you have not used on this account before.'
  }

  return err?.message || 'Something went wrong. Please try again.'
}
