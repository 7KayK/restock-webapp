// Rough default assumptions for estimating what a shopping trip costs, so
// stores can be compared on more than shelf price. Deliberately simple and
// clearly labelled as estimates in the UI — not vehicle- or user-specific, and
// not live fuel prices. Tune later, or turn into per-user settings.
const DEFAULT_FUEL_L_PER_100KM = 8.5 // typical compact/midsize car, city driving

// Hand-tuned figures for the markets Restock has been tested in.
const FUEL_PRICE_PER_L: Record<string, number> = {
  CAD: 1.5,
  GBP: 1.45,
  EUR: 1.8,
  NGN: 900,
  ZMW: 30,
}

const TIME_VALUE_PER_HOUR: Record<string, number> = {
  CAD: 15,
  GBP: 12,
  EUR: 14,
  NGN: 1500,
  ZMW: 60,
}

// Every other country: convert a rough world-average USD figure with
// approximate exchange rates (units of local currency per 1 USD). These are
// rounded and will drift; they only need to be the right order of magnitude
// for ranking stores by drive time and fuel.
const PER_USD: Record<string, number> = {
  USD: 1, EUR: 0.92, GBP: 0.78, CAD: 1.38, AUD: 1.52, NZD: 1.65, JPY: 150, CNY: 7.2, INR: 84,
  NGN: 1500, GHS: 12, KES: 129, ZAR: 18, ZMW: 27, EGP: 49, MAD: 10, TZS: 2600, UGX: 3700,
  RWF: 1400, ETB: 120, XOF: 600, XAF: 600, DZD: 135, TND: 3.1, MZN: 64, BWP: 13.5, NAD: 18,
  MWK: 1700, ZWL: 1, AOA: 900, CDF: 2800, SZL: 18, LSL: 18, MUR: 45, SLE: 23, GMD: 70, LRD: 190,
  BRL: 5.5, MXN: 19, ARS: 1000, CLP: 950, COP: 4200, PEN: 3.75, UYU: 40, BOB: 6.9, PYG: 7800,
  CRC: 510, GTQ: 7.7, HNL: 25, NIO: 36.5, DOP: 60, JMD: 157, TTD: 6.8, BSD: 1, BBD: 2, BZD: 2,
  TRY: 38, AED: 3.67, SAR: 3.75, ILS: 3.6, QAR: 3.64, KWD: 0.31, BHD: 0.38, OMR: 0.38, JOD: 0.71,
  PKR: 280, BDT: 120, LKR: 300, NPR: 134, IDR: 16000, MYR: 4.5, SGD: 1.35, THB: 35, VND: 25000,
  PHP: 57, KRW: 1400, TWD: 32, HKD: 7.8, MOP: 8, CHF: 0.88, SEK: 10.5, NOK: 10.8, DKK: 6.9,
  PLN: 4.0, CZK: 23, HUF: 370, RON: 4.6, BGN: 1.8, UAH: 41, RUB: 90, KZT: 520, GEL: 2.7, AMD: 390,
  AZN: 1.7, ISK: 138, RSD: 108, MKD: 57, ALL: 92, BAM: 1.8, MDL: 18, BYN: 3.3, UZS: 12700,
}

// Roughly USD 1.3 per litre of petrol worldwide.
const DEFAULT_FUEL_USD_PER_L = 1.3

// A shopper's time is worth far more in some economies than others; two broad
// bands, in USD per hour.
const HIGHER_INCOME = new Set([
  'USD', 'AUD', 'NZD', 'CHF', 'SEK', 'NOK', 'DKK', 'JPY', 'SGD', 'HKD', 'AED', 'SAR', 'ILS', 'KRW',
  'TWD', 'QAR', 'KWD', 'BHD', 'OMR', 'ISK', 'CAD', 'GBP', 'EUR',
])
const TIME_USD_HIGHER = 14
const TIME_USD_OTHER = 3.5

function round(n: number): number {
  return Math.round(n * 100) / 100
}

export function fuelPricePerL(currency: string): number {
  if (FUEL_PRICE_PER_L[currency] != null) return FUEL_PRICE_PER_L[currency]
  const fx = PER_USD[currency]
  // Unknown currency: no honest conversion, so don't invent a fuel cost.
  return fx ? round(DEFAULT_FUEL_USD_PER_L * fx) : 0
}

export function timeValuePerMinute(currency: string): number {
  if (TIME_VALUE_PER_HOUR[currency] != null) return TIME_VALUE_PER_HOUR[currency] / 60
  const fx = PER_USD[currency]
  if (!fx) return 0
  const usdPerHour = HIGHER_INCOME.has(currency) ? TIME_USD_HIGHER : TIME_USD_OTHER
  return (usdPerHour * fx) / 60
}

// Distance in should be the ROUND TRIP (there and back), since that's the
// actual cost of the errand, not just the one-way drive shown alongside it.
export function estimateGasCost(roundTripMeters: number, currency = 'CAD'): number {
  const km = roundTripMeters / 1000
  const liters = (km / 100) * DEFAULT_FUEL_L_PER_100KM
  return Math.round(liters * fuelPricePerL(currency) * 100) / 100
}
