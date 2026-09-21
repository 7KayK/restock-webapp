// Rough default assumptions for estimating a trip's fuel cost from distance
// alone — deliberately simple for v1 (no vehicle-specific or live fuel-price
// settings yet). Both numbers are easy to tune later, or turn into a
// per-user setting once there's demand for it.
const DEFAULT_FUEL_L_PER_100KM = 8.5   // typical compact/midsize car, city driving
const DEFAULT_FUEL_PRICE_PER_L = 1.50  // rough Regina-area CAD/L — not live data

// Distance in should be the ROUND TRIP (there and back), since that's the
// actual cost of the errand, not just the one-way drive shown alongside it.
export function estimateGasCost(roundTripMeters: number): number {
  const km = roundTripMeters / 1000
  const liters = (km / 100) * DEFAULT_FUEL_L_PER_100KM
  return Math.round(liters * DEFAULT_FUEL_PRICE_PER_L * 100) / 100
}
