import { auth } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'
import { normalizeItems, buildByStoreOptions } from '@/lib/cartBuilder'
import type { CartBuilderResult, CartItemPrice, MixedCart } from '@/types'

// Builds two ways to look at a shopping list's cost, from crowdsourced
// price sightings only (see src/lib/kroger.ts for why there's no live
// store-price API to pull from instead):
//
// 1. `byStore` — for each store anyone has reported prices at, how many of
//    the list's items it covers and what those items would total there.
//    Ranked by coverage first (a store that has everything beats a
//    slightly cheaper store that has half the list), then by price. Shared
//    with /api/deals/trip via src/lib/cartBuilder.ts, which also carries
//    each store's lat/lng through for that route's drive-time lookup.
// 2. `mixed`   — the cheapest possible total if the shopper is willing to
//    split the list across whichever stores have the best price per item,
//    grouped by currency (never summed across currencies).
export async function POST(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = (await request.json()) as { items?: unknown }
    const items = normalizeItems(body.items)

    if (items.length === 0) {
      const empty: CartBuilderResult = { byStore: [], mixed: [], unpriced: [] }
      return Response.json({ data: empty })
    }

    const { byStore, perItemDeduped, unpriced, unpricedReasons } = await buildByStoreOptions(items)

    // --- mixed: cheapest sighting per item, grouped by currency ---
    const currencies = new Set(
      [...perItemDeduped.values()].flat().map((s) => s.currency)
    )
    const mixed: MixedCart[] = []
    for (const currency of currencies) {
      const cartItems: CartItemPrice[] = []
      const missing: string[] = []
      let total = 0
      for (const item of items) {
        const cheapest = (perItemDeduped.get(item.name) ?? []).find((s) => s.currency === currency)
        if (cheapest) {
          cartItems.push({ name: item.name, quantity: item.quantity, price: cheapest.lineTotal, storeName: cheapest.storeName, storePlaceId: cheapest.storePlaceId })
          total += cheapest.lineTotal
        } else {
          cartItems.push({ name: item.name, quantity: item.quantity, price: null, storeName: null, storePlaceId: null })
          missing.push(item.name)
        }
      }
      if (cartItems.some((it) => it.price !== null)) {
        mixed.push({ currency, total: Math.round(total * 100) / 100, items: cartItems, missing })
      }
    }
    mixed.sort((a, b) => a.missing.length - b.missing.length)

    const data: CartBuilderResult = { byStore, mixed, unpriced, unpricedReasons }
    return Response.json({ data })
  } catch (err) {
    console.error('[deals cart POST]', err)
    return Response.json({ error: 'Failed to build cart' }, { status: 500 })
  }
}
