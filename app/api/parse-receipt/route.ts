import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'
import emissionsFactors from '@/data/emissions_factors.json'
import { checkRateLimit, getClientKey } from '@/lib/rateLimit'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const categories = Object.entries(emissionsFactors.purchase_categories)
  .map(([key, v]) => `${key}: ${v.label}`)
  .join('\n')

export async function POST(req: Request) {
  const clientKey = getClientKey(req)
  const { allowed } = checkRateLimit(clientKey, 30, 60 * 60 * 1000)


  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait a bit before trying again.' },
      { status: 429 }
    )
  }

  const { imageBase64, mediaType } = await req.json()

  if (!imageBase64) {
    return NextResponse.json({ error: 'Missing image' }, { status: 400 })
  }

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mediaType || 'image/jpeg', data: imageBase64 },
          },
          {
            type: 'text',
            text: `This is a photo of a shopping receipt. Extract each line item and classify it into exactly one of these categories. Respond with ONLY valid JSON, no other text.

Categories:
${categories}

Respond in this exact JSON shape:
{"items": [{"name": "item name as printed", "price_inr": 120, "category": "category_key_here"}]}

Skip subtotal/tax/total lines. If price is unclear, estimate reasonably. If a category truly doesn't fit, use "household_misc".`,
          },
        ],
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
    return NextResponse.json({ error: 'Failed to parse model response', raw: textBlock.text }, { status: 500 })
  }
}