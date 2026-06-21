import { supabase } from './supabase'
import { ensureUser } from './auth'

function getWeekStart(date = new Date()) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d.toISOString().split('T')[0]
}


async function callLogActionApi(params: { source: string; category: string; rawInput: string }) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { error: 'No user session' }

  const res = await fetch('/api/log-action', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(params),
  })

  return res.json()
}

export async function logQuickAction(category: string) {
  return callLogActionApi({ source: 'quick_action', category, rawInput: category })
}

export async function logConfirmedAction(params: {
  source: 'voice' | 'receipt' | 'photo' | 'passive'
  category: string
  rawInput: string
}) {
  return callLogActionApi(params)
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