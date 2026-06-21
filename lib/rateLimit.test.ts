import { describe, it, expect } from 'vitest'
import { checkRateLimit } from './rateLimit'

describe('checkRateLimit', () => {
  it('allows requests under the limit', () => {
    const result = checkRateLimit('test-key-1', 5, 60_000)
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(4)
  })

  it('rejects requests once the limit is exceeded', () => {
    const key = 'test-key-2'
    for (let i = 0; i < 3; i++) {
      checkRateLimit(key, 3, 60_000)
    }
    const result = checkRateLimit(key, 3, 60_000)
    expect(result.allowed).toBe(false)
    expect(result.remaining).toBe(0)
  })

  it('resets the count after the window expires', () => {
    const key = 'test-key-3'
    checkRateLimit(key, 1, 10) // 10ms window, limit of 1
    const blocked = checkRateLimit(key, 1, 10)
    expect(blocked.allowed).toBe(false)

    return new Promise((resolve) => {
      setTimeout(() => {
        const afterReset = checkRateLimit(key, 1, 10)
        expect(afterReset.allowed).toBe(true)
        resolve(undefined)
      }, 20)
    })
  })
})
