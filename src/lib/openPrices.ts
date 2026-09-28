// Read-only client for Open Prices (prices.openfoodfacts.org) — a separate,
// sibling project to Open Food Facts' product database: a crowdsourced
// database of real prices, keyed by product barcode, contributed by
// shoppers worldwide (see https://prices.openfoodfacts.org and
// https://github.com/openfoodfacts/open-prices). Reading is public, no
// account or API key required — only submitting a price needs one.
//
// IMPORTANT CAVEAT: this couldn't be live-tested from this environment —
// both the sandbox shell and the tool used to fetch raw API schemas were
// network-blocked for this specific host while this was written. The
// request shape below follows Open Prices' documented REST conventions
// (openfoodfacts/open-prices on GitHub), but has not been confirmed
// against a real response. Written defensively for exactly that reason:
// any request failure, timeout, or unexpected response shape degrades to
// an empty result rather than throwing or guessing at a price. Smoke-test
// this against a real product code before relying on it, and adjust the
// field names below if the live shape differs.
const OPEN_PRICES_BASE = 'https://prices.openfoodfacts.org/api/v1'
const FETCH_TIMEOUT_MS = 5000
const MAX_OBSERVATIONS = 5

export interface OpenPriceObservation {
  source: 'open-prices'
  price: number
  currency: string
  date: string | null
  locationLabel: string | null
}

interface RawOpenPrice {
  price?: unknown
  currency?: unknown
  date?: unknown
  location?: { name?: unknown; osm_display_name?: unknown } | null
}

function parseObservation(raw: RawOpenPrice): OpenPriceObservation | null {
  const price = typeof raw.price === 'number' ? raw.price : null
  const currency = typeof raw.currency === 'string' ? raw.currency : null
  if (price === null || !currency) return null

  const locationLabel =
    (typeof raw.location?.name === 'string' && raw.location.name) ||
    (typeof raw.location?.osm_display_name === 'string' && raw.location.osm_display_name) ||
    null

  return {
    source: 'open-prices',
    price,
    currency,
    date: typeof raw.date === 'string' ? raw.date : null,
    locationLabel,
  }
}

// Recent price observations reported anywhere for one product barcode,
// cheapest first. Returns [] on any failure — unreachable service, an
// unexpected response shape, or a timeout — never throws and never
// estimates a price it doesn't actually have.
export async function getOpenPricesForBarcode(productCode: string): Promise<OpenPriceObservation[]> {
  if (!productCode) return []

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  try {
    const params = new URLSearchParams({
      product_code: productCode,
      order_by: '-date',
      size: String(MAX_OBSERVATIONS),
    })
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

    return observations.sort((a, b) => a.price - b.price)
  } catch (err) {
    console.error('[open-prices] lookup failed for', productCode, err)
    return []
  } finally {
    clearTimeout(timeout)
  }
}
