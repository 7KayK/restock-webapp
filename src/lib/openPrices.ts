// Read-only client for Open Prices (prices.openfoodfacts.org) — a separate,
// sibling project to Open Food Facts' product database: a crowdsourced
// database of real prices, keyed by product barcode, contributed by
// shoppers worldwide (see https://prices.openfoodfacts.org and
// https://github.com/openfoodfacts/open-prices). Reading is public, no
// account or API key required — only submitting a price needs one.
//
// Verified live (Oct 2026) against the real API: responses are
// {items: [...], page, pages, size, total}; each item has a numeric `price`,
// a `currency`, a `date`, and an embedded `location` with osm_name,
// osm_address_city and osm_address_country_code. Supported query filters
// that were confirmed to work: product_code, currency, order_by, size.
// Country/city filters are SILENTLY IGNORED by the API (it returns the
// unfiltered set), so region scoping is done by filtering on `currency`
// server-side and on location.osm_address_country_code client-side.
// Coverage is very uneven: Nigeria had a single NGN price in the whole
// database at the time of writing, so Restock reports must carry that region.
// Any failure, timeout or unexpected shape degrades to an empty result
// rather than throwing or guessing at a price.
const OPEN_PRICES_BASE = 'https://prices.openfoodfacts.org/api/v1'
const FETCH_TIMEOUT_MS = 5000
const MAX_OBSERVATIONS = 5
const FETCH_SIZE_WHEN_SCOPED = 30 // over-fetch so the client-side country filter still leaves enough rows

export interface OpenPriceObservation {
  source: 'open-prices'
  price: number
  currency: string
  date: string | null
  locationLabel: string | null
  city: string | null
  countryCode: string | null
}

export interface OpenPricesScope {
  currency?: string
  countryCode?: string
}

interface RawOpenPrice {
  price?: unknown
  currency?: unknown
  date?: unknown
  location?: {
    osm_name?: unknown
    osm_display_name?: unknown
    osm_address_city?: unknown
    osm_address_country_code?: unknown
    name?: unknown
  } | null
}

function parseObservation(raw: RawOpenPrice): OpenPriceObservation | null {
  const price = typeof raw.price === 'number' ? raw.price : null
  const currency = typeof raw.currency === 'string' ? raw.currency : null
  if (price === null || !currency) return null

  const loc = raw.location
  const storeName =
    (typeof loc?.osm_name === 'string' && loc.osm_name) || (typeof loc?.name === 'string' && loc.name) || null
  const city = typeof loc?.osm_address_city === 'string' && loc.osm_address_city ? loc.osm_address_city : null
  const countryCode =
    typeof loc?.osm_address_country_code === 'string' && loc.osm_address_country_code
      ? loc.osm_address_country_code.toUpperCase()
      : null
  const locationLabel =
    [storeName, city].filter(Boolean).join(', ') ||
    (typeof loc?.osm_display_name === 'string' && loc.osm_display_name) ||
    null

  return {
    source: 'open-prices',
    price,
    currency,
    date: typeof raw.date === 'string' ? raw.date : null,
    locationLabel,
    city,
    countryCode,
  }
}

// Recent price observations reported anywhere for one product barcode,
// cheapest first. Returns [] on any failure — unreachable service, an
// unexpected response shape, or a timeout — never throws and never
// estimates a price it doesn't actually have.
export async function getOpenPricesForBarcode(
  productCode: string,
  scope: OpenPricesScope = {}
): Promise<OpenPriceObservation[]> {
  if (!productCode) return []

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  try {
    const params = new URLSearchParams({
      product_code: productCode,
      order_by: '-date',
      size: String(scope.countryCode ? FETCH_SIZE_WHEN_SCOPED : MAX_OBSERVATIONS),
    })
    if (scope.currency) params.set('currency', scope.currency)
    const res = await fetch(`${OPEN_PRICES_BASE}/prices?${params}`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    })
    if (!res.ok) return []

    const json = (await res.json()) as unknown
    const items = Array.isArray(json)
      ? json
      : Array.isArray((json as { items?: unknown })?.items)
        ? (json as { items: unknown[] }).items
        : Array.isArray((json as { results?: unknown })?.results)
          ? (json as { results: unknown[] }).results
          : null
    if (!items) return []

    const observations = items
      .map((raw) => parseObservation(raw as RawOpenPrice))
      .filter((o): o is OpenPriceObservation => o !== null)
      // Currency alone can't tell Ireland from the rest of the euro area,
      // so when a country is requested keep only observations whose store
      // is actually in it.
      .filter((o) => !scope.countryCode || o.countryCode === scope.countryCode)

    return observations.sort((a, b) => a.price - b.price).slice(0, MAX_OBSERVATIONS)
  } catch (err) {
    console.error('[open-prices] lookup failed for', productCode, err)
    return []
  } finally {
    clearTimeout(timeout)
  }
}
