import { auth } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'
import { normalizeItems, buildByStoreOptions } from '@/lib/cartBuilder'
import { getDriveTimes } from '@/lib/routes'
import { estimateGasCost } from '@/lib/tripCost'
import type { TripResult, TripStoreOption } from '@/types'

// "Make the trip" — ranks the same store options /api/deals/cart prices,
// but factoring in drive time (traffic-aware) and an estimated round-trip
// gas cost from wherever the shopper is right now, not just shelf price.
// Deliberately a separate, on-demand endpoint rather than folded into
// /api/deals/cart: Google's Routes API is billed per call, and cart pricing
// already refreshes automatically on every list edit (see CartBuilder.tsx)
// — routing should only run when someone explicitly clicks the button.
//
// Store availability/crowdedness are NOT part of this: neither has a
// legitimate public API for grocery stores (Google's busy-times data isn't
// exposed to third-party apps), so v1 sticks to price + time + gas — see
// the MVP scope note in src/app/api/shopping/list/route.ts's history.
export async function POST(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = (await request.json()) as { items?: unknown; origin?: { lat?: unknown; lng?: unknown } }
    const items = normalizeItems(body.items)
    const originLat = typeof body.origin?.lat === 'number' ? body.origin.lat : null
    const originLng = typeof body.origin?.lng === 'number' ? body.origin.lng : null

    if (originLat === null || originLng === null) {
      return Response.json({ error: 'origin location is required' }, { status: 400 })
    }
    if (items.length === 0) {
      return Response.json({ data: { stores: [] } satisfies TripResult })
    }

    const { byStore } = await buildByStoreOptions(items)

    // Only stores with a known lat/lng (picked from Places search when
    // reported) can be routed to — a sighting reported as free text has
    // none. Those stores still show up, priced, just without time/gas.
    const routableIndices: number[] = []
    const routableCoords: { lat: number; lng: number }[] = []
    byStore.forEach((s, i) => {
      if (s.storeLat !== null && s.storeLng !== null) {
        routableIndices.push(i)
        routableCoords.push({ lat: s.storeLat, lng: s.storeLng })
      }
    })

    const drives = await getDriveTimes({ lat: originLat, lng: originLng }, routableCoords)
    const driveByIndex = new Map(routableIndices.map((byStoreIdx, j) => [byStoreIdx, drives[j]]))

    const stores: TripStoreOption[] = byStore.map((s, i) => {
      const drive = driveByIndex.get(i)
      const distanceKm = drive?.distanceMeters != null ? Math.round((drive.distanceMeters / 1000) * 10) / 10 : null
      const driveMinutes = drive?.durationSec != null ? Math.round(drive.durationSec / 60) : null
      const gasCost = drive?.distanceMeters != null ? estimateGasCost(drive.distanceMeters * 2) : null
      const tripTotal = gasCost !== null ? Math.round((s.total + gasCost) * 100) / 100 : null
      return { ...s, driveMinutes, distanceKm, gasCost, tripTotal }
    })

    // Coverage first (same priority as the plain cart view), then trip
    // total when it's known, falling back to price alone for stores
    // routing couldn't reach.
    stores.sort(
      (a, b) => b.coveredCount - a.coveredCount || (a.tripTotal ?? a.total) - (b.tripTotal ?? b.total)
    )

    return Response.json({ data: { stores } satisfies TripResult })
  } catch (err) {
    console.error('[deals trip POST]', err)
    return Response.json({ error: 'Failed to plan the trip' }, { status: 500 })
  }
}
