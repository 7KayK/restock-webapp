import { auth } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'
import { normalizeItems } from '@/lib/cartBuilder'
import { buildTypicalEstimate } from '@/lib/typicalPrices'
import { parseRegion } from '@/lib/region'
import { labelForCoords } from '@/lib/geocode'
import { findNearbyGroceryStores } from '@/lib/places'
import { getDriveTimes } from '@/lib/routes'
import { rankStores } from '@/lib/storeRanking'
import type { BestStoreResult } from '@/types'

// Live web price lookups can take 10-30 s for a list.
export const maxDuration = 60

// "Where should I shop?" — prices the list from typical local prices (live web
// lookup, official averages as backup), adjusts per store type, then adds the
// cost of getting to each nearby store (traffic-aware drive time, fuel, the
// shopper's time) and flags items a store probably doesn't stock. Runs only
// when the shopper asks, because routing and lookups cost money.
//
// What it does NOT know: live shelf stock or how busy a store is. No public
// source provides either; the "may not stock" flag is a category guess.
export async function POST(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = (await request.json()) as { items?: unknown; origin?: { lat?: unknown; lng?: unknown } }
    const items = normalizeItems(body.items)
    const lat = typeof body.origin?.lat === 'number' ? body.origin.lat : null
    const lng = typeof body.origin?.lng === 'number' ? body.origin.lng : null

    const empty = (reason: BestStoreResult['reason'], areaLabel: string | null = null): Response =>
      Response.json({
        data: { areaLabel, currency: null, typical: null, stores: [], reason } satisfies BestStoreResult,
      })

    if (lat === null || lng === null) return empty('no-location')
    if (items.length === 0) return empty('no-prices')

    // Where the shopper is right now decides the market, not an old saved address.
    const label = await labelForCoords(lat, lng)
    const region = parseRegion(label)
    if (!region) return empty('unsupported-region', label)

    const [typical, nearby] = await Promise.all([
      buildTypicalEstimate(items, region),
      findNearbyGroceryStores(lat, lng).catch((err) => {
        console.error('[best-store] nearby failed', err)
        return []
      }),
    ])

    if (!typical || typical.items.length === 0) return empty('no-prices', label)
    if (nearby.length === 0) {
      return Response.json({
        data: { areaLabel: typical.areaLabel, currency: typical.currency, typical, stores: [], reason: 'no-stores' } satisfies BestStoreResult,
      })
    }

    const drives = await getDriveTimes({ lat, lng }, nearby.map((s) => ({ lat: s.lat, lng: s.lng })))
    const routingFailed = drives.every((d) => d.durationSec === null && d.distanceMeters === null)
    const stores = rankStores({ stores: nearby, drives, typical })

    const data: BestStoreResult = {
      areaLabel: typical.areaLabel,
      currency: typical.currency,
      typical,
      stores,
      reason: null,
      routingNote: routingFailed ? 'routing-failed' : null,
    }
    return Response.json({ data })
  } catch (err) {
    console.error('[deals best-store POST]', err)
    return Response.json({ error: 'Failed to rank stores' }, { status: 500 })
  }
}
