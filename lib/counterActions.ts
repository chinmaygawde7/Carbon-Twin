export const COUNTER_MAP: Record<string, string> = {
  red_meat: 'veg_meal',
  poultry_eggs: 'veg_meal',
  dairy: 'veg_meal',
  fish_seafood: 'veg_meal',
  fuel_petrol: 'took_transit',
  packaged_snacks: 'leftovers_no_waste',
  clothing_fast: 'reused_or_repaired',
  electronics: 'reused_or_repaired',
  beverages: 'reusable_bag_bottle',

  // action categories that add emissions -> counter action
  drove_solo: 'biked_or_walked',
  took_flight_domestic: 'skipped_flight_leg',
}
