import { supabase } from './supabase'
import { ensureUser } from './auth'
import { getActionFactor, listActionCategories } from './emissions'
import { COUNTER_MAP } from './counterActions'

function getWeekStart(date = new Date()) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d.toISOString().split('T')[0]
}

export type Recommendation = {
  category: string
  label: string
  co2e: number
  reason: string
}

export async function getTopRecommendation(): Promise<Recommendation | null> {
  const user = await ensureUser()
  if (!user) return null

  const weekStart = getWeekStart()
  const { data: logs } = await supabase
    .from('logs')
    .select('category, co2e_kg')
    .eq('user_id', user.id)
    .gte('created_at', weekStart)

  if (!logs) return null

  // Sum positive (emission-adding) impact by category logged this week
  const positiveByCategory: Record<string, number> = {}
  const loggedActionCategories = new Set<string>()

  for (const log of logs) {
    if (log.co2e_kg > 0) {
      positiveByCategory[log.category] = (positiveByCategory[log.category] || 0) + log.co2e_kg
    }
    loggedActionCategories.add(log.category)
  }

  // Find the biggest emission contributor this week that has a known counter-action
  const sortedContributors = Object.entries(positiveByCategory).sort((a, b) => b[1] - a[1])

  for (const [category, total] of sortedContributors) {
    const counterCategory = COUNTER_MAP[category]
    if (counterCategory) {
      const factor = getActionFactor(counterCategory)
      if (factor) {
        return {
          category: counterCategory,
          label: factor.label,
          co2e: factor.factor_per_event,
          reason: `Counters ${total.toFixed(1)} kg from this week's ${category.replace(/_/g, ' ')}`,
        }
      }
    }
  }

  // No positive emissions logged yet — recommend the highest-impact action category not yet tried this week
  const allActions = listActionCategories().filter((a) => a.co2e < 0)
  const notYetLogged = allActions
    .filter((a) => !loggedActionCategories.has(a.key))
    .sort((a, b) => a.co2e - b.co2e) // most negative (highest impact) first

  if (notYetLogged.length > 0) {
    const top = notYetLogged[0]
    return {
      category: top.key,
      label: top.label,
      co2e: top.co2e,
      reason: "You haven't tried this one yet this week",
    }
  }

  return null
}