import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: vi.fn().mockImplementation(function () {
      return {
        messages: {
          create: vi.fn().mockResolvedValue({
            content: [{ type: 'text', text: '{"category": "biked_or_walked", "confidence": "high"}' }],
          }),
        },
      }
    }),
  }
})

describe('POST /api/parse-voice', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('returns a 400 when transcript is missing', async () => {
    const { POST } = await import('./route')
    const req = new Request('http://localhost/api/parse-voice', {
      method: 'POST',
      body: JSON.stringify({}),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns a parsed category for a valid transcript', async () => {
    const { POST } = await import('./route')
    const req = new Request('http://localhost/api/parse-voice', {
      method: 'POST',
      body: JSON.stringify({ transcript: 'I biked to work today' }),
    })
    const res = await POST(req)
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data.category).toBe('biked_or_walked')
    expect(data.confidence).toBe('high')
  })
})