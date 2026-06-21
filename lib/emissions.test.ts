import { describe, it, expect } from 'vitest'
import { getActionFactor, getPurchaseFactor, listActionCategories, listPurchaseCategories } from './emissions'

describe('getActionFactor', () => {
  it('returns the correct factor for a known category', () => {
    const factor = getActionFactor('biked_or_walked')
    expect(factor).not.toBeNull()
    expect(factor!.factor_per_event).toBe(-1.8)
    expect(factor!.label).toBe('Biked or walked instead of driving')
  })

  it('returns null for an unknown category', () => {
    const factor = getActionFactor('teleported_to_work')
    expect(factor).toBeNull()
  })

  it('avoided-emission actions are always negative', () => {
    const avoidanceCategories = ['biked_or_walked', 'veg_meal', 'vegan_meal', 'saved_power']
    for (const cat of avoidanceCategories) {
      const factor = getActionFactor(cat)
      expect(factor!.factor_per_event).toBeLessThan(0)
    }
  })

  it('logged-but-not-penalized actions are positive, not zero or negative', () => {
    const factor = getActionFactor('drove_solo')
    expect(factor!.factor_per_event).toBeGreaterThan(0)
  })
})

describe('getPurchaseFactor', () => {
  it('returns the correct factor for a known purchase category', () => {
    const factor = getPurchaseFactor('red_meat')
    expect(factor).not.toBeNull()
    expect(factor!.factor_per_100inr).toBeGreaterThan(0)
  })

  it('returns null for an unknown purchase category', () => {
    expect(getPurchaseFactor('unobtainium')).toBeNull()
  })

  it('produce has a lower factor than red meat (sanity check on relative ordering)', () => {
    const produce = getPurchaseFactor('produce')
    const redMeat = getPurchaseFactor('red_meat')
    expect(produce!.factor_per_100inr).toBeLessThan(redMeat!.factor_per_100inr)
  })
})

describe('listActionCategories', () => {
  it('returns a non-empty list with key, label, and co2e for every entry', () => {
    const list = listActionCategories()
    expect(list.length).toBeGreaterThan(0)
    for (const item of list) {
      expect(item).toHaveProperty('key')
      expect(item).toHaveProperty('label')
      expect(item).toHaveProperty('co2e')
      expect(typeof item.co2e).toBe('number')
    }
  })
})

describe('listPurchaseCategories', () => {
  it('returns a non-empty list with key, label, and factorPer100', () => {
    const list = listPurchaseCategories()
    expect(list.length).toBeGreaterThan(0)
    for (const item of list) {
      expect(item).toHaveProperty('key')
      expect(item).toHaveProperty('label')
      expect(item).toHaveProperty('factorPer100')
    }
  })
})