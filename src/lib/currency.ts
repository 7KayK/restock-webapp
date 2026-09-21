// Currencies for the countries Restock is currently being tested in
// (Canada, Nigeria, Ireland, United Kingdom, Zambia, Germany). Kept as an
// explicit allow-list rather than a full ISO 4217 list so price-sighting
// forms only ever show currencies that are actually relevant right now —
// extend this as more countries are added.
export const SUPPORTED_CURRENCIES = [
  { code: 'CAD', label: 'CAD — Canadian Dollar', symbol: '$' },
  { code: 'NGN', label: 'NGN — Nigerian Naira', symbol: '₦' },
  { code: 'EUR', label: 'EUR — Euro (Ireland / Germany)', symbol: '€' },
  { code: 'GBP', label: 'GBP — British Pound', symbol: '£' },
  { code: 'ZMW', label: 'ZMW — Zambian Kwacha', symbol: 'K' },
] as const

export type CurrencyCode = (typeof SUPPORTED_CURRENCIES)[number]['code']

export const CURRENCY_CODES: string[] = SUPPORTED_CURRENCIES.map((c) => c.code)

export function isSupportedCurrency(code: unknown): code is CurrencyCode {
  return typeof code === 'string' && CURRENCY_CODES.includes(code)
}

export function formatPrice(price: number, currency: string): string {
  const found = SUPPORTED_CURRENCIES.find((c) => c.code === currency)
  const symbol = found?.symbol ?? `${currency} `
  return `${symbol}${price.toFixed(2)}`
}
