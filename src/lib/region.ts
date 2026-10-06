// Resolves a shopper's test market from the coarse "City, Region, Country"
// label that /api/location/reverse-geocode (or the manual city search)
// saves on User.locationLabel. Only the markets Restock is actively being
// tested in are recognised — Canada (Saskatchewan, Manitoba), Nigeria
// (Lagos, Ogun, Oyo), United Kingdom and Ireland, plus Zambia and Germany
// from the earlier market list. Anything else returns null, and callers
// must then fall back to unscoped (global) behaviour rather than guess.
//
// Currency is the practical region key for Open Prices: its API ignores
// country filters but does honour `currency`. EUR is shared by Ireland and
// Germany (and the rest of Europe), so callers should also filter on
// countryCode client-side where it matters.

export interface Region {
  countryCode: 'CA' | 'NG' | 'GB' | 'IE' | 'ZM' | 'DE'
  country: string
  currency: 'CAD' | 'NGN' | 'GBP' | 'EUR' | 'ZMW'
  // Open Food Facts country tag (English), used to scope product search.
  offCountryTag: string
  // Sub-national area as saved in the label (province / state / county), if any.
  region: string | null
  city: string | null
}

const COUNTRIES: Array<{ aliases: string[]; base: Omit<Region, 'region' | 'city'> }> = [
  { aliases: ['canada'], base: { countryCode: 'CA', country: 'Canada', currency: 'CAD', offCountryTag: 'canada' } },
  { aliases: ['nigeria'], base: { countryCode: 'NG', country: 'Nigeria', currency: 'NGN', offCountryTag: 'nigeria' } },
  {
    aliases: ['united kingdom', 'uk', 'great britain', 'england', 'scotland', 'wales', 'northern ireland'],
    base: { countryCode: 'GB', country: 'United Kingdom', currency: 'GBP', offCountryTag: 'united-kingdom' },
  },
  { aliases: ['ireland', 'republic of ireland'], base: { countryCode: 'IE', country: 'Ireland', currency: 'EUR', offCountryTag: 'ireland' } },
  { aliases: ['zambia'], base: { countryCode: 'ZM', country: 'Zambia', currency: 'ZMW', offCountryTag: 'zambia' } },
  { aliases: ['germany'], base: { countryCode: 'DE', country: 'Germany', currency: 'EUR', offCountryTag: 'germany' } },
]

export function parseRegion(label: string | null | undefined): Region | null {
  if (!label) return null
  const parts = label.split(',').map((p) => p.trim()).filter(Boolean)
  if (parts.length === 0) return null

  const last = parts[parts.length - 1].toLowerCase()
  const match = COUNTRIES.find((c) => c.aliases.includes(last))
  if (!match) return null

  return {
    ...match.base,
    city: parts.length >= 2 ? parts[0] : null,
    region: parts.length >= 3 ? parts[1] : null,
  }
}
