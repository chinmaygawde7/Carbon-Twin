import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import emissionsFactors from '@/data/emissions_factors.json'
import { z } from 'zod'

const LogActionSchema = z.object({
  source: z.enum(['quick_action', 'voice', 'receipt', 'photo', 'passive']),
  category: z.string().min(1).max(64),
  rawInput: z.string().max(2000),
})

function getWeekStart(date = new Date()) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d.toISOString().split('T')[0]
}

export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Missing auth token' }, { status: 401 })
  }
  const accessToken = authHeader.replace('Bearer ', '')

  // Create a Supabase client scoped to this caller's own token, so auth.uid()
  // resolves correctly and the existing RLS policies on `logs`/`weekly_scores`
  // still apply exactly as they do for direct client writes — we are not
  // bypassing row-level security, only moving the CO2e calculation server-side.
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
  const parsed = LogActionSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 })
  }
  const { source, category, rawInput } = parsed.data

  // The CO2e value is looked up server-side from the trusted static table —
  // the client never gets to supply this number directly, closing the
  // client-side tampering gap (e.g. someone hand-crafting an insert with a
  // fabricated co2e_kg value via devtools).
  const factor = (emissionsFactors.action_categories as Record<string, { factor_per_event: number }>)[category]
  if (!factor) {
    return NextResponse.json({ error: 'Unknown category' }, { status: 400 })
  }
  const co2e = factor.factor_per_event

  const { data: log, error: logError } = await supabase
    .from('logs')
    .insert({ user_id: userId, source, category, raw_input: rawInput, co2e_kg: co2e, confirmed: true })
    .select()
    .single()

  if (logError) {
    return NextResponse.json({ error: logError.message }, { status: 500 })
  }

  const { error: rpcError } = await supabase.rpc('increment_weekly_score', {
    p_user_id: userId,
    p_week_start: getWeekStart(),
    p_delta: co2e,
    p_count: 1,
  })

  if (rpcError) {
    return NextResponse.json({ error: rpcError.message, log }, { status: 500 })
  }

  return NextResponse.json({ log })
}