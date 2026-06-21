'use client'
import { useState } from 'react'
import { signInWithGoogle, signInWithEmail, continueAsGuest } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import Avatar from '@/components/Avatar'

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [emailSent, setEmailSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    setError('')
    const result = await signInWithEmail(email)
    setLoading(false)
    if (result?.error) {
      setError(result.error)
    } else {
      setEmailSent(true)
    }
  }

  async function handleGuest() {
    setLoading(true)
    const user = await continueAsGuest()
    setLoading(false)
    if (user) router.push('/')
  }

  return (
    <main className="px-5 py-12 max-w-sm mx-auto w-full">
      <Avatar totalCo2e={5} />

      <h1 className="text-xl font-semibold text-center mt-4 mb-1">Carbon Twin</h1>
      <p className="text-sm text-center mb-8" style={{ color: 'var(--ink-muted)' }}>
        Track your footprint. Watch it grow.
      </p>

      <button
        onClick={signInWithGoogle}
        className="ct-btn-pill w-full py-3 text-sm mb-3"
      >
        Continue with Google
      </button>

      {!emailSent ? (
        <form onSubmit={handleEmailSubmit} className="mb-3">
          <label htmlFor="email-input" className="sr-only">Email address</label>
          <input
            id="email-input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="w-full p-3 mb-2 text-sm ct-card"
            style={{ color: 'var(--ink)' }}
          />
          <button
            type="submit"
            disabled={loading}
            className="ct-btn-secondary w-full py-3 text-sm"
          >
            {loading ? 'Sending…' : 'Continue with email'}
          </button>
        </form>
      ) : (
        <div className="ct-impact-positive p-3 mb-3 text-sm text-center">
          Check your inbox for a sign-in link.
        </div>
      )}

      {error && <p className="text-xs text-red-500 mb-3 text-center">{error}</p>}

      <button
        onClick={handleGuest}
        disabled={loading}
        className="text-xs w-full text-center py-2"
        style={{ color: 'var(--ink-muted)' }}
      >
        Continue as guest →
      </button>
    </main>
  )
}