import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'
import emissionsFactors from '@/data/emissions_factors.json'
import { checkRateLimit, getClientKey } from '@/lib/rateLimit'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const categories = Object.entries(emissionsFactors.action_categories)
  .map(([key, v]) => `${key}: ${v.label}`)
  .join('\n')

export async function POST(req: Request) {
  const clientKey = getClientKey(req)
  const { allowed, remaining } = checkRateLimit(clientKey, 30, 60 * 60 * 1000)

  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait a bit before trying again.' },
      { status: 429 }
    )
  }

  const { transcript } = await req.json()

  if (!transcript || typeof transcript !== 'string') {
    return NextResponse.json({ error: 'Missing transcript' }, { status: 400 })
  }

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 200,
    messages: [
      {
        role: 'user',
        content: `Classify this voice log into exactly one of these categories. Respond with ONLY valid JSON, no other text.

Categories:
${categories}

Voice log: "${transcript}"

Respond in this exact JSON shape:
{"category": "category_key_here", "confidence": "high|medium|low"}

If nothing matches reasonably, use {"category": null, "confidence": "low"}.`,
      },
    ],
  })

  const textBlock = message.content.find((b) => b.type === 'text')
  if (!textBlock || textBlock.type !== 'text') {
    return NextResponse.json({ error: 'No response from model' }, { status: 500 })
  }

  try {
    const cleaned = textBlock.text.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(cleaned)
    return NextResponse.json(parsed)
  } catch {
    return NextResponse.json({ error: 'Failed to parse model response' }, { status: 500 })
  }
}