import { auth } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { priceFreshnessCutoff, toPriceSighting, dedupeCheapestPerStore } from '@/lib/priceSightings'
import { normalizeItemKey } from '@/lib/itemName'
import { searchFoodProducts } from '@/lib/kroger'
import { getOpenPricesForBarcode } from '@/lib/openPrices'
import type { ProductSearchResult, CommunityPrice, ProductMatch } from '@/types'

// GET /api/product-search?q=tortilla wraps — a real free-text product
// search, which Restock didn't have before this: "Prices near you" only
// ever searched items already on a shopper's list, and "Product info" only
// ever showed their own top-10 purchase history. Neither answers "what
// does this cost, anywhere, right now" for something you haven't already
// told Restock about.
//
// Three sources, kept separate on purpose (see ProductSearchResult in
// src/types/index.ts):
//   1. restockReports  — Restock's own crowdsourced + receipt-derived
//      PriceSighting rows, matched with the same normalizeItemKey fix that
//      stopped "tortilla wraps" missing a sighting saved as "tortilla wrap".
//   2. communityPrices — Open Prices, a global crowdsourced price database
//      run by Open Food Facts. Real prices, but reported by anyone,
//      anywhere — not necessarily near this shopper. See src/lib/openPrices.ts
//      for an important caveat: its exact response shape could not be
//      live-verified while building this, and it degrades to empty rather
//      than guessing if the request fails or the shape doesn't match.
//   3. products — Open Food Facts product metadata (name/brand/image/
//      Nutri-Score) with no price at all, so a search still returns
//      something useful even when nobody has reported a price anywhere.
//
// Never blended into one number, and never a fabricated or estimated
// price — same principle the trip planner and the Codex price service
// both already follow.
const MAX_OFF_MATCHES = 5
const MAX_OPEN_PRICES_LOOKUPS = 3 // cap outbound Open Prices calls per search

export async function GET(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const q = (request.nextUrl.searchParams.get('q') ?? '').trim()
  if (!q) return Response.json({ error: 'q is required' }, { status: 400 })
  if (q.length > 100) return Response.json({ error: 'q is too long' }, { status: 400 })

  const empty: ProductSearchResult = { query: q, restockReports: [], communityPrices: [], products: [] }

  try {
    const normalized = normalizeItemKey(q)

    const [restockRows, offMatches] = await Promise.all([
      prisma.priceSighting.findMany({
        where: {
          item: { contains: normalized, mode: 'insensitive' },
          createdAt: { gte: priceFreshnessCutoff() },
        },
        orderBy: { price: 'asc' },
        take: 20,
      }),
      searchFoodProducts(q, MAX_OFF_MATCHES).catch((err) => {
        console.error('[product-search] Open Food Facts lookup failed', err)
        return []
      }),
    ])

    const restockReports = dedupeCheapestPerStore(restockRows.map(toPriceSighting))

    const products: ProductMatch[] = offMatches.map((m) => ({
      code: m.code,
      productName: m.productName,
      brand: m.brand,
      imageUrl: m.imageUrl,
      nutriscoreGrade: m.nutriscoreGrade,
    }))

    // Open Prices is keyed by barcode, so it only runs for OFF matches that
    // actually have one — and only for the first few, so one broad search
    // term can't fan out into a long chain of outbound requests.
    const barcodedMatches = offMatches.filter((m) => m.code).slice(0, MAX_OPEN_PRICES_LOOKUPS)
    const openPricesResults = await Promise.allSettled(
      barcodedMatches.map(async (m) => {
        const observations = await getOpenPricesForBarcode(m.code as string)
        return observations.map((o): CommunityPrice => ({
          productName: m.productName,
          brand: m.brand,
          imageUrl: m.imageUrl,
          price: o.price,
          currency: o.currency,
          date: o.date,
          locationLabel: o.locationLabel,
        }))
      })
    )

    const communityPrices: CommunityPrice[] = openPricesResults
      .filter((r): r is PromiseFulfilledResult<CommunityPrice[]> => r.status === 'fulfilled')
      .flatMap((r) => r.value)
      .sort((a, b) => a.price - b.price)

    const data: ProductSearchResult = { query: q, restockReports, communityPrices, products }
    return Response.json({ data })
  } catch (err) {
    console.error('[product-search GET]', err)
    return Response.json({ data: empty })
  }
}
