import { supabase } from './supabase'
import { ensureUser } from './auth'
import { getActionFactor } from './emissions'

function getWeekStart(date = new Date()) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d.toISOString().split('T')[0]
}

export async function logQuickAction(category: string) {
  const user = await ensureUser()
  if (!user) return { error: 'No user session' }

  const factor = getActionFactor(category)
  if (!factor) return { error: 'Unknown category' }

  const { data: log, error: logError } = await supabase
    .from('logs')
    .insert({
      user_id: user.id,
      source: 'quick_action',
      category,
      raw_input: factor.label,
      co2e_kg: factor.factor_per_event,
      confirmed: true,
    })
    .select()
    .single()

  if (logError) return { error: logError.message }

  const { error: rpcError } = await supabase.rpc('increment_weekly_score', {
    p_user_id: user.id,
    p_week_start: getWeekStart(),
    p_delta: factor.factor_per_event,
  })

  if (rpcError) return { error: rpcError.message, log }

  return { log }
}


export async function logConfirmedAction(params: {
  source: 'voice' | 'receipt' | 'photo' | 'passive'
  category: string
  rawInput: string
  co2eOverride?: number
}) {
  const user = await ensureUser()
  if (!user) return { error: 'No user session' }

  const factor = getActionFactor(params.category)
  if (!factor) return { error: 'Unknown category' }

  const co2e = params.co2eOverride ?? factor.factor_per_event

  const { data: log, error: logError } = await supabase
    .from('logs')
    .insert({
      user_id: user.id,
      source: params.source,
      category: params.category,
      raw_input: params.rawInput,
      co2e_kg: co2e,
      confirmed: true,
    })
    .select()
    .single()

  if (logError) return { error: logError.message }

  const { error: rpcError } = await supabase.rpc('increment_weekly_score', {
    p_user_id: user.id,
    p_week_start: getWeekStart(),
    p_delta: co2e,
  })

  if (rpcError) return { error: rpcError.message, log }

  return { log }
}


export async function logReceiptItems(items: { name: string; category: string; co2e: number }[]) {
  const user = await ensureUser()
  if (!user) return { error: 'No user session' }

  const rows = items.map((item) => ({
    user_id: user.id,
    source: 'receipt' as const,
    category: item.category,
    raw_input: item.name,
    co2e_kg: item.co2e,
    confirmed: true,
  }))

  const { data: logs, error: logError } = await supabase.from('logs').insert(rows).select()
  if (logError) return { error: logError.message }

  const totalDelta = items.reduce((sum, i) => sum + i.co2e, 0)

  const { error: rpcError } = await supabase.rpc('increment_weekly_score', {
    p_user_id: user.id,
    p_week_start: getWeekStart(),
    p_delta: totalDelta,
    p_count: items.length,
  })

  if (rpcError) return { error: rpcError.message, logs }

  return { logs }
}