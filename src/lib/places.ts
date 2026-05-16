import type { GroceryStore } from '@/types'

const NEARBY_URL = 'https://places.googleapis.com/v1/places:searchNearby'
const FIELD_MASK = 'places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.currentOpeningHours,places.types'

interface PlaceResult {
  id: string
  displayName: { text: string; languageCode?: string }
  formattedAddress: string
  location: { latitude: number; longitude: number }
  rating?: number
  currentOpeningHours?: { openNow: boolean }
}

interface PlacesResponse {
  places?: PlaceResult[]
  error?: { code: number; message: string; status: string }
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

export async function findNearbyGroceryStores(lat: number, lng: number): Promise<GroceryStore[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY ?? ''
  if (!apiKey) throw new Error('GOOGLE_PLACES_API_KEY not configured')

  const body = {
    includedTypes: ['grocery_store', 'supermarket', 'food_store'],
    maxResultCount: 15,
    locationRestriction: {
      circle: {
        center: { latitude: lat, longitude: lng },
        radius: 10000.0,
      },
    },
  }

  console.log('[places] POST', NEARBY_URL, '| key:', apiKey.slice(0, 8) + '…')

  const res = await fetch(NEARBY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': FIELD_MASK,
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  })

  const data = (await res.json()) as PlacesResponse

  if (!res.ok || data.error) {
    console.error('[places] error:', JSON.stringify(data.error ?? { httpStatus: res.status }))
    return []
  }

  const places = data.places ?? []
  console.log(`[places] results: ${places.length}`)

  return places
    .map((place) => {
      const distanceKm =
        Math.round(haversineKm(lat, lng, place.location.latitude, place.location.longitude) * 10) / 10
      const openNow = place.currentOpeningHours?.openNow
      return {
        placeId: place.id,
        name: place.displayName.text,
        address: place.formattedAddress,
        lat: place.location.latitude,
        lng: place.location.longitude,
        distanceKm,
        rating: place.rating,
        openNow,
        hoursToday: openNow === undefined ? 'Hours unavailable' : openNow ? 'Open now' : 'Closed',
      }
    })
    .sort((a, b) => a.distanceKm - b.distanceKm)
}
