import { prisma } from '@/lib/prisma'
import { priceFreshnessCutoff, toPriceSighting, dedupeCheapestPerStore } from '@/lib/priceSightings'
import { packsNeeded } from '@/lib/units'
import { normalizeItemKey } from '@/lib/itemName'
import type { CartRequestItem, CartStoreOption, PriceSighting, UnpricedReason } from '@/types'

const MAX_ITEMS = 60
const MAX_QUANTITY = 1000

function normalizeUnit(unit: string | null): string | null {
  const u = unit?.trim().toLowerCase()
  return u ? u : null
}

// Accepts `{ name, quantity, unit }` entries (bare strings still work, as
// quantity 1) and merges repeats of the same name by summing quantity. If the
// repeats disagree on unit, the unit is dropped rather than picking one — a
// wrong unit would silently exclude valid price reports.
export function normalizeItems(raw: unknown): CartRequestItem[] {
  if (!Array.isArray(raw)) return []

  const merged = new Map<string, CartRequestItem>()
  for (const entry of raw) {
    const obj: { name?: unknown; quantity?: unknown; unit?: unknown } | null =
      typeof entry === 'string' ? { name: entry } : entry && typeof entry === 'object' ? entry : null
    if (!obj || typeof obj.name !== 'string') continue

    const name = normalizeItemKey(obj.name)
    if (!name) continue
    const quantity =
      typeof obj.quantity === 'number' && Number.isFinite(obj.quantity) && obj.quantity > 0
        ? Math.min(obj.quantity, MAX_QUANTITY)
        : 1
    const unit = typeof obj.unit === 'string' ? normalizeUnit(obj.unit) : null

    const existing = merged.get(name)
    if (!existing) {
      merged.set(name, { name, quantity, unit })
    } else {
      existing.quantity = Math.min(existing.quantity + quantity, MAX_QUANTITY)
      if (existing.unit !== unit) existing.unit = null
    }
  }

  return [...merged.values()].slice(0, MAX_ITEMS)
}

function lineTotal(packPrice: number, packs: number): number {
  return Math.round(packPrice * packs * 100) / 100
}

// A price report matched to a list line: `packs` is how many of the report's
// packages the line needs (see packsNeeded in src/lib/units.ts), and
// `lineTotal` is what buying them costs at that store.
export interface PricedSighting extends PriceSighting {
  packs: number
  lineTotal: number
}

// "Which stores cover this list, and at what price" — shared by
// /api/deals/cart (byStore + mixed views) and /api/deals/trip (adds drive
// time and gas cost on top), so both compute this the same way instead of
// duplicating the query and grouping logic.
export async function buildByStoreOptions(items: CartRequestItem[]): Promise<{
  byStore: CartStoreOption[]
  perItemDeduped: Map<string, PricedSighting[]>
  unpriced: string[]
  unpricedReasons: Record<string, UnpricedReason>
}> {
  // Case-insensitive `contains` to fetch candidates, then an exact match on
  // the *normalized* name in code. The old `item IN (...)` was case- and
  // wording-sensitive, so any sighting saved as "Milk" or "Eggs" (before
  // normalization existed) never matched the list's "milk" / "egg".
  const rows = await prisma.priceSighting.findMany({
    where: {
      OR: items.map((it) => ({ item: { contains: it.name, mode: 'insensitive' as const } })),
      createdAt: { gte: priceFreshnessCutoff() },
    },
    orderBy: { price: 'asc' },
  })
  const sightings = rows.map(toPriceSighting).map((s) => ({ ...s, item: normalizeItemKey(s.item) }))

  // Cheapest usable sighting per (item, store), cheapest first. "Cheapest"
  // is by what the whole list line would cost — a 4 L jug at $5 beats two 1 L
  // bottles at $2.60 for a 2 L line even though its shelf price is higher —
  // and reports in a different kind of unit than the line asks for (kg vs L)
  // are left out rather than multiplied into a total they don't apply to.
  const perItemDeduped = new Map<string, PricedSighting[]>()
  for (const item of items) {
    const priced: PricedSighting[] = []
    for (const s of sightings) {
      if (s.item !== item.name) continue
      const packs = packsNeeded(item.quantity, item.unit, s.unit)
      if (packs === null) continue
      priced.push({ ...s, packs, lineTotal: lineTotal(s.price, packs) })
    }
    perItemDeduped.set(
      item.name,
      dedupeCheapestPerStore(priced, (s) => s.lineTotal).sort((a, b) => a.lineTotal - b.lineTotal)
    )
  }

  const unpriced = items.filter((it) => (perItemDeduped.get(it.name) ?? []).length === 0).map((it) => it.name)

  // Explain each gap so "no prices" is never a mystery: no reports at all,
  // only stale ones, or fresh ones in an incomparable unit.
  const unpricedReasons: Record<string, UnpricedReason> = {}
  if (unpriced.length > 0) {
    const olderRows = await prisma.priceSighting.findMany({
      where: { OR: unpriced.map((name) => ({ item: { contains: name, mode: 'insensitive' as const } })) },
      select: { item: true },
    })
    const anyEverReported = new Set(olderRows.map((r) => normalizeItemKey(r.item)))
    for (const name of unpriced) {
      const hasFresh = sightings.some((s) => s.item === name)
      unpricedReasons[name] = hasFresh ? 'unit-mismatch' : anyEverReported.has(name) ? 'stale' : 'none'
    }
  }

  interface StoreAgg {
    storeName: string
    storePlaceId: string | null
    storeLat: number | null
    storeLng: number | null
    currency: string
    itemPrices: Map<string, number> // line totals (unit price × quantity)
  }
  const storeIndex = new Map<string, StoreAgg>()

  for (const item of items) {
    for (const s of perItemDeduped.get(item.name) ?? []) {
      const key = `${s.storePlaceId ?? s.storeName.trim().toLowerCase()}::${s.currency}`
      let agg = storeIndex.get(key)
      if (!agg) {
        agg = {
          storeName: s.storeName,
          storePlaceId: s.storePlaceId,
          storeLat: s.storeLat,
          storeLng: s.storeLng,
          currency: s.currency,
          itemPrices: new Map(),
        }
        storeIndex.set(key, agg)
      }
      if (!agg.itemPrices.has(item.name)) agg.itemPrices.set(item.name, s.lineTotal)
    }
  }

  const byStore: CartStoreOption[] = [...storeIndex.values()]
    .map((agg) => ({
      storeName:    agg.storeName,
      storePlaceId: agg.storePlaceId,
      storeLat:     agg.storeLat,
      storeLng:     agg.storeLng,
      currency:     agg.currency,
      coveredCount: agg.itemPrices.size,
      totalItems:   items.length,
      total:        Math.round([...agg.itemPrices.values()].reduce((sum, p) => sum + p, 0) * 100) / 100,
      items: items.map((it) => ({
        name:         it.name,
        quantity:     it.quantity,
        price:        agg.itemPrices.get(it.name) ?? null,
        storeName:    agg.itemPrices.has(it.name) ? agg.storeName : null,
        storePlaceId: agg.itemPrices.has(it.name) ? agg.storePlaceId : null,
      })),
    }))
    .sort((a, b) => b.coveredCount - a.coveredCount || a.total - b.total)
    .slice(0, 8)

  return { byStore, perItemDeduped, unpriced, unpricedReasons }
}
