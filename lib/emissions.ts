import emissionsFactors from '@/data/emissions_factors.json'


export function getActionFactor(category: string) {
  const entry = (emissionsFactors.action_categories as Record<string, { factor_per_event: number; label: string }>)[category]
  if (!entry) {
    console.error(`Unknown action category: ${category}`)
    return null
  }
  return entry
}

export function listActionCategories() {
  return Object.entries(emissionsFactors.action_categories).map(([key, v]) => ({
    key,
    label: v.label,
    co2e: v.factor_per_event,
  }))
}


export function getPurchaseFactor(category: string) {
  const entry = (emissionsFactors.purchase_categories as Record<string, { factor_per_100inr: number; label: string }>)[category]
  if (!entry) return null
  return entry
}

export function listPurchaseCategories() {
  return Object.entries(emissionsFactors.purchase_categories).map(([key, v]) => ({
    key,
    label: v.label,
    factorPer100: v.factor_per_100inr,
  }))
}