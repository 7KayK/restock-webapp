// Rough default assumptions for estimating what a shopping trip costs, so
// stores can be compared on more than shelf price. Deliberately simple and
// clearly labelled as estimates in the UI — not vehicle- or user-specific, and
// not live fuel prices. Tune later, or turn into per-user settings.
const DEFAULT_FUEL_L_PER_100KM = 8.5 // typical compact/midsize car, city driving

// Rough pump price per litre by currency.
const FUEL_PRICE_PER_L: Record<string, number> = {
  CAD: 1.5,
  GBP: 1.45,
  EUR: 1.8,
  NGN: 900,
  ZMW: 30,
}

// Rough value of the shopper's own time, per hour, by currency.
const TIME_VALUE_PER_HOUR: Record<string, number> = {
  CAD: 15,
  GBP: 12,
  EUR: 14,
  NGN: 1500,
  ZMW: 60,
}

export function fuelPricePerL(currency: string): number {
  return FUEL_PRICE_PER_L[currency] ?? FUEL_PRICE_PER_L.CAD
}

export function timeValuePerMinute(currency: string): number {
  return (TIME_VALUE_PER_HOUR[currency] ?? TIME_VALUE_PER_HOUR.CAD) / 60
}

// Distance in should be the ROUND TRIP (there and back), since that's the
// actual cost of the errand, not just the one-way drive shown alongside it.
export function estimateGasCost(roundTripMeters: number, currency = 'CAD'): number {
  const km = roundTripMeters / 1000
  const liters = (km / 100) * DEFAULT_FUEL_L_PER_100KM
  return Math.round(liters * fuelPricePerL(currency) * 100) / 100
}
