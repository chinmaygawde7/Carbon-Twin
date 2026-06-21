/**
 * Returns the ISO date string (YYYY-MM-DD) for the Monday of the week
 * containing the given date. Used as the canonical key for weekly_scores
 * rows. Defaults to the current date if none is provided.
 */
export function getWeekStart(date: Date = new Date()): string {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d.toISOString().split('T')[0]!
}
