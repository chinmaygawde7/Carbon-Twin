'use client'
import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Unhandled application error:', error)
  }, [error])

  return (
    <main className="px-5 py-12 max-w-sm mx-auto w-full text-center">
      <p className="text-lg font-semibold mb-2">Something went sideways</p>
      <p className="text-sm mb-6" style={{ color: 'var(--ink-muted)' }}>
        The tree is fine — just a temporary hiccup loading the app. Try again.
      </p>
      <button onClick={reset} className="ct-btn-pill px-5 py-2.5 text-sm">
        Try again
      </button>
    </main>
  )
}
