import { supabase } from './supabase'

export async function getCurrentUser() {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.user ?? null
}

export async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin },
  })
  if (error) console.error('Google sign-in failed:', error.message)
}

export async function signInWithEmail(email: string) {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: window.location.origin },
  })
  if (error) {
    console.error('Email sign-in failed:', error.message)
    return { error: error.message }
  }
  return { error: null }
}

export async function continueAsGuest() {
  const { data, error } = await supabase.auth.signInAnonymously()
  if (error) {
    console.error('Guest sign-in failed:', error.message)
    return null
  }
  return data.user
}

export async function signOut() {
  await supabase.auth.signOut()
}

// Kept for backward compatibility with existing logging code that calls ensureUser().
// Returns the current user if signed in (any method); does NOT silently create a
// guest session anymore — that's now an explicit user choice on the login screen.
export async function ensureUser() {
  return getCurrentUser()
}