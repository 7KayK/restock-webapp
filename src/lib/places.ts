import type { GroceryStore } from '@/types'

const NEARBY_URL = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json'

interface PlacesResult {
  place_id: string
  name: string
  vicinity: string
  geometry: { location: { lat: number; lng: number } }
  rating?: number
  opening_hours?: { open_now: boolean }
}

interface PlacesResponse {
  status: string
  results: PlacesResult[]
  error_message?: string
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

async function nearbyByType(apiKey: string, lat: number, lng: number, type: string): Promise<PlacesResult[]> {
  const url = `${NEARBY_URL}?location=${lat},${lng}&radius=10000&type=${type}&key=${apiKey}`
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) {
    console.error('[places] HTTP error:', res.status, 'type:', type)
    return []
  }
  const data = (await res.json()) as PlacesResponse
  if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
    console.error('[places] API error:', data.status, data.error_message, 'type:', type)
    return []
  }
  return data.results
}

export async function findNearbyGroceryStores(lat: number, lng: number): Promise<GroceryStore[]> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ''
  if (!apiKey) throw new Error('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY not configured')

  const [groceryResults, supermarketResults] = await Promise.all([
    nearbyByType(apiKey, lat, lng, 'grocery_or_supermarket'),
    nearbyByType(apiKey, lat, lng, 'supermarket'),
  ])

  // Merge and deduplicate by place_id
  const seen = new Set<string>()
  const merged: PlacesResult[] = []
  for (const r of [...groceryResults, ...supermarketResults]) {
    if (!seen.has(r.place_id)) {
      seen.add(r.place_id)
      merged.push(r)
    }
  }

  return merged
    .map((place) => {
      const distanceKm =
        Math.round(haversineKm(lat, lng, place.geometry.location.lat, place.geometry.location.lng) * 10) / 10
      let hoursToday = 'Hours unavailable'
      if (place.opening_hours !== undefined) {
        hoursToday = place.opening_hours.open_now ? 'Open now' : 'Closed'
      }
      return {
        placeId: place.place_id,
        name: place.name,
        address: place.vicinity,
        lat: place.geometry.location.lat,
        lng: place.geometry.location.lng,
        distanceKm,
        rating: place.rating,
        openNow: place.opening_hours?.open_now,
        hoursToday,
      }
    })
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, 15)
}
