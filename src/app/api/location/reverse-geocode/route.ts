import { auth } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'

const GEOCODE_URL = 'https://maps.googleapis.com/maps/api/geocode/json'

interface AddressComponent {
  long_name: string
  short_name: string
  types: string[]
}

interface GeocodeResult {
  address_components: AddressComponent[]
  formatted_address: string
}

interface GeocodeResponse {
  results?: GeocodeResult[]
  status: string
}

function componentFor(components: AddressComponent[], type: string): string | undefined {
  return components.find((c) => c.types.includes(type))?.long_name
}

// Builds a coarse "City, Region, Country" label from a full geocode result —
// deliberately less precise than the lat/lng we actually store, so Settings
// shows something readable without implying we've captured a street address.
function buildLabel(components: AddressComponent[]): string {
  const city =
    componentFor(components, 'locality') ??
    componentFor(components, 'postal_town') ??
    componentFor(components, 'administrative_area_level_2')
  const region = componentFor(components, 'administrative_area_level_1')
  const country = componentFor(components, 'country')

  return [city, region, country].filter(Boolean).join(', ')
}

// Reverse-geocodes a lat/lng into a human-readable location label, used only
// when the user hits "Use my current location" in Settings — the browser
// gives us coordinates, this turns them into something like
// "Regina, Saskatchewan, Canada" to show back to them.
export async function GET(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const lat = parseFloat(searchParams.get('lat') ?? '')
  const lng = parseFloat(searchParams.get('lng') ?? '')

  if (isNaN(lat) || isNaN(lng)) {
    return Response.json({ error: 'lat and lng are required' }, { status: 400 })
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY ?? ''
  if (!apiKey) {
    return Response.json({ error: 'GOOGLE_PLACES_API_KEY not configured' }, { status: 500 })
  }

  try {
    const url = `${GEOCODE_URL}?latlng=${lat},${lng}&key=${apiKey}`
    const res = await fetch(url, { cache: 'no-store' })
    const data = (await res.json()) as GeocodeResponse

    if (data.status !== 'OK' || !data.results?.length) {
      // Fall back to raw coordinates rather than failing outright — still
      // usable for nearby-store lookups even without a pretty label.
      return Response.json({ data: { label: `${lat.toFixed(3)}, ${lng.toFixed(3)}` } })
    }

    const label = buildLabel(data.results[0].address_components) || data.results[0].formatted_address
    return Response.json({ data: { label } })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[/api/location/reverse-geocode] error:', message)
    return Response.json({ data: { label: `${lat.toFixed(3)}, ${lng.toFixed(3)}` } })
  }
}
