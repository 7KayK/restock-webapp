import type { PriceSighting } from '@/types'

// How long a crowdsourced price is trusted before it's treated as stale.
// Shared by every route that reads PriceSighting rows, so the freshness
// window can't drift out of sync between them.
export const PRICE_FRESHNESS_DAYS = 21

export function priceFreshnessCutoff(): Date {
  return new Date(Date.now() - PRICE_FRESHNESS_DAYS * 24 * 60 * 60 * 1000)
}

interface RawSighting {
  id: string
  item: string
  storeName: string
  storePlaceId: string | null
  storeLat: number | null
  storeLng: number | null
  price: number
  currency: string
  unit: string | null
  source: string
  createdAt: Date
}

export function toPriceSighting(s: RawSighting): PriceSighting {
  return {
    id: s.id,
    item: s.item,
    storeName: s.storeName,
    storePlaceId: s.storePlaceId,
    storeLat: s.storeLat,
    storeLng: s.storeLng,
    price: s.price,
    currency: s.currency,
    unit: s.unit,
    source: s.source,
    createdAt: s.createdAt.toISOString(),
  }
}

// Multiple people can report the same store — collapse to one entry per
// (store, currency) pair, keeping the cheapest report. Store identity is
// storePlaceId when we have one (picked from search), falling back to a
// lowercased store name for sightings reported as free text.
//
// "Cheapest" is by shelf price unless a `cost` is given — the cart builder
// passes the cost of the whole list line, which differs when package sizes do.
export function dedupeCheapestPerStore<T extends PriceSighting>(
  sightings: T[],
  cost: (s: T) => number = (s) => s.price
): T[] {
  const byStore = new Map<string, T>()
  for (const s of sightings) {
    const key = `${s.storePlaceId ?? s.storeName.trim().toLowerCase()}::${s.currency}`
    const existing = byStore.get(key)
    if (!existing || cost(s) < cost(existing)) byStore.set(key, s)
  }
  return [...byStore.values()]
}
