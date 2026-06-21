import { supabase } from './supabase'
import { ensureUser } from './auth'
import { getWeekStart } from './dateUtils'

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

export async function getLastWeekScore() {
  const user = await ensureUser()
  if (!user) return null

  const lastWeekDate = new Date()
  lastWeekDate.setDate(lastWeekDate.getDate() - 7)
  const lastWeekStart = getWeekStart(lastWeekDate)

  const { data } = await supabase
    .from('weekly_scores')
    .select('*')
    .eq('user_id', user.id)
    .eq('week_start', lastWeekStart)
    .maybeSingle()

  return data
}
