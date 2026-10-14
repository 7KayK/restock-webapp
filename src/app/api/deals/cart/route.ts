import { auth } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'
import { normalizeItems, buildByStoreOptions } from '@/lib/cartBuilder'
import { buildTypicalEstimate } from '@/lib/typicalPrices'
import { parseRegion } from '@/lib/region'
import { prisma } from '@/lib/prisma'
import type { CartBuilderResult, CartItemPrice, MixedCart } from '@/types'

// Live web price lookups can take 10-30 s for a list; the rest of the cart is fast.
export const maxDuration = 60

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
      const empty: CartBuilderResult = { byStore: [], mixed: [], unpriced: [], typical: null }
      return Response.json({ data: empty })
    }

    const { byStore, perItemDeduped, unpriced, unpricedReasons, similarMatches } = await buildByStoreOptions(items)

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

    // Typical (official average) prices for the shopper's saved area. Never
    // blocks the cart: if it fails, the store-based result still returns.
    let typical: CartBuilderResult['typical'] = null
    let needsLocation = false
    try {
      const me = await prisma.user.findUnique({ where: { clerkId: userId }, select: { locationLabel: true } })
      const region = parseRegion(me?.locationLabel)
      if (region) typical = await buildTypicalEstimate(items, region)
      else needsLocation = true
    } catch (err) {
      console.error('[deals cart typical]', err)
    }

    const data: CartBuilderResult = { byStore, mixed, unpriced, unpricedReasons, similarMatches, typical, needsLocation }
    return Response.json({ data })
  } catch (err) {
    console.error('[deals cart POST]', err)
    return Response.json({ error: 'Failed to build cart' }, { status: 500 })
  }
}
