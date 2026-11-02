// Currencies Restock shows first in price-report forms (the markets it has been
// tested in). Any other real ISO 4217 currency is accepted too, so a shopper in
// any country can report prices and scan receipts in their own currency.
export const SUPPORTED_CURRENCIES = [
  { code: 'CAD', label: 'CAD — Canadian Dollar', symbol: '$' },
  { code: 'NGN', label: 'NGN — Nigerian Naira', symbol: '₦' },
  { code: 'EUR', label: 'EUR — Euro', symbol: '€' },
  { code: 'GBP', label: 'GBP — British Pound', symbol: '£' },
  { code: 'ZMW', label: 'ZMW — Zambian Kwacha', symbol: 'K' },
] as const

export type CurrencyCode = string

function isoCurrencies(): string[] {
  try {
    return (Intl as unknown as { supportedValuesOf?: (k: string) => string[] }).supportedValuesOf?.('currency') ?? []
  } catch {
    return []
  }
}

export const CURRENCY_CODES: string[] = SUPPORTED_CURRENCIES.map((c) => c.code)

export function isSupportedCurrency(code: unknown): code is CurrencyCode {
  if (typeof code !== 'string' || !/^[A-Z]{3}$/.test(code)) return false
  if (CURRENCY_CODES.includes(code)) return true
  return isoCurrencies().includes(code)
}

// Dropdown options: the tested markets first, then every other currency.
export function currencyOptions(): { code: string; label: string }[] {
  const first = SUPPORTED_CURRENCIES.map((c) => ({ code: c.code as string, label: c.label as string }))
  let names: Intl.DisplayNames | null = null
  try {
    names = new Intl.DisplayNames(['en'], { type: 'currency' })
  } catch {
    names = null
  }
  const rest = isoCurrencies()
    .filter((c) => !CURRENCY_CODES.includes(c))
    .map((c) => ({ code: c, label: `${c} — ${names?.of(c) ?? c}` }))
  return [...first, ...rest]
}

export function formatPrice(price: number, currency: string): string {
  const found = SUPPORTED_CURRENCIES.find((c) => c.code === currency)
  if (found) return `${found.symbol}${price.toFixed(2)}`
  try {
    return new Intl.NumberFormat('en', { style: 'currency', currency, currencyDisplay: 'narrowSymbol' }).format(price)
  } catch {
    return `${currency} ${price.toFixed(2)}`
  }
}
