const MATRIX_URL = 'https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix'
const FIELD_MASK = 'originIndex,destinationIndex,duration,distanceMeters,condition,status'

export interface RouteMatrixEntry {
  durationSec: number | null
  distanceMeters: number | null
}

// Traffic-aware drive time + distance from one origin to many destinations,
// in a single call — used by "Make the trip" to compare stores on more
// than just shelf price. Reuses GOOGLE_PLACES_API_KEY (see src/lib/places.ts)
// since it's the same Google Cloud project, but the Routes API is a
// separate API that has to be enabled for that project in Google Cloud
// Console, with an active billing account — if it isn't, every call here
// fails and "Make the trip" gracefully falls back to price-only ranking
// rather than breaking.
export async function getDriveTimes(
  origin: { lat: number; lng: number },
  destinations: { lat: number; lng: number }[]
): Promise<RouteMatrixEntry[]> {
  const empty = destinations.map(() => ({ durationSec: null, distanceMeters: null }))
  if (destinations.length === 0) return empty

  const apiKey = process.env.GOOGLE_PLACES_API_KEY ?? ''
  if (!apiKey) {
    console.error('[routes] GOOGLE_PLACES_API_KEY not configured')
    return empty
  }

  const body = {
    origins: [{ waypoint: { location: { latLng: { latitude: origin.lat, longitude: origin.lng } } } }],
    destinations: destinations.map((d) => ({
      waypoint: { location: { latLng: { latitude: d.lat, longitude: d.lng } } },
    })),
    travelMode: 'DRIVE',
    routingPreference: 'TRAFFIC_AWARE',
  }

  try {
    const res = await fetch(MATRIX_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': FIELD_MASK,
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    })

    if (!res.ok) {
      console.error('[routes] computeRouteMatrix HTTP', res.status, await res.text())
      return empty
    }

    const raw = (await res.json()) as Array<{
      destinationIndex?: number
      duration?: string
      distanceMeters?: number
      condition?: string
    }>

    const byIndex = new Map<number, RouteMatrixEntry>()
    for (const el of raw) {
      const idx = el.destinationIndex ?? 0
      const ok = el.condition === 'ROUTE_EXISTS'
      byIndex.set(idx, {
        durationSec:    ok && el.duration ? parseInt(el.duration.replace('s', ''), 10) : null,
        distanceMeters: ok ? el.distanceMeters ?? null : null,
      })
    }

    return destinations.map((_, i) => byIndex.get(i) ?? { durationSec: null, distanceMeters: null })
  } catch (err) {
    console.error('[routes] computeRouteMatrix failed:', err)
    return empty
  }
}
