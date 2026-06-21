import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import emissionsFactors from '@/data/emissions_factors.json'
import { z } from 'zod'
import { getWeekStart } from '@/lib/dateUtils'

const ReceiptItemSchema = z.object({
  name: z.string().min(1).max(200),
  category: z.string().min(1).max(64),
  price_inr: z.number().min(0).max(1_000_000),
})

const LogReceiptSchema = z.object({
  items: z.array(ReceiptItemSchema).min(1).max(100),
})

export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Missing auth token' }, { status: 401 })
  }
  const accessToken = authHeader.replace('Bearer ', '')

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
  )

  const { data: userData, error: userError } = await supabase.auth.getUser(accessToken)
  if (userError || !userData.user) {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
  }
  const userId = userData.user.id

  const body = await req.json()
  const parsed = LogReceiptSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  // Every item's CO2e is recomputed server-side from the trusted static table —
  // the client only ever supplies a category and price, never the final number.
  const purchaseCategories = emissionsFactors.purchase_categories as Record<
    string,
    { factor_per_100inr: number }
  >

  const rows = []
  let totalDelta = 0

  for (const item of parsed.data.items) {
    const factor = purchaseCategories[item.category]
    if (!factor) {
      return NextResponse.json({ error: `Unknown category: ${item.category}` }, { status: 400 })
    }
    const co2e = Number(((item.price_inr / 100) * factor.factor_per_100inr).toFixed(2))
    totalDelta += co2e
    rows.push({
      user_id: userId,
      source: 'receipt' as const,
      category: item.category,
      raw_input: item.name,
      co2e_kg: co2e,
      confirmed: true,
    })
  }

  const { data: logs, error: logError } = await supabase.from('logs').insert(rows).select()
  if (logError) {
    return NextResponse.json({ error: logError.message }, { status: 500 })
  }

  const { error: rpcError } = await supabase.rpc('increment_weekly_score', {
    p_user_id: userId,
    p_week_start: getWeekStart(),
    p_delta: totalDelta,
    p_count: rows.length,
  })

  if (rpcError) {
    return NextResponse.json({ error: rpcError.message, logs }, { status: 500 })
  }

  return NextResponse.json({ logs })
}
