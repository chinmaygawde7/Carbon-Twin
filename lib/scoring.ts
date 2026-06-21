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

export async function getCurrentWeekScore() {
  const user = await ensureUser()
  if (!user) return { total_co2e_kg: 0, logs_count: 0 }

  const { data } = await supabase
    .from('weekly_scores')
    .select('*')
    .eq('user_id', user.id)
    .eq('week_start', getWeekStart())
    .maybeSingle()

  return data ?? { total_co2e_kg: 0, logs_count: 0 }
}


export async function getWeeklyHistory(weeksBack = 8) {
  const user = await ensureUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('weekly_scores')
    .select('*')
    .eq('user_id', user.id)
    .order('week_start', { ascending: true })
    .limit(weeksBack)

  if (error) {
    console.error('Failed to fetch history:', error.message)
    return []
  }

  return data
}