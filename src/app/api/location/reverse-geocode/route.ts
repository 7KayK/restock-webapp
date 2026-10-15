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
  error_message?: string
}

// Backup when Google's Geocoding API refuses the request (billing off, API not
// enabled, key restrictions). Without a readable "City, Region, Country" label
// Restock can't tell which market the shopper is in, so typical prices and
// local search silently switch off. OpenStreetMap's Nominatim needs no key; its
// usage policy asks for an identifying User-Agent and low volume, which a
// once-per-location-save fallback respects.
async function osmLabel(lat: number, lng: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=10&addressdetails=1&accept-language=en&lat=${lat}&lon=${lng}`,
      { headers: { 'User-Agent': 'Restock/1.0 (https://restock.chat)' }, cache: 'no-store' }
    )
    if (!res.ok) return null
    const data = (await res.json()) as { address?: Record<string, string> }
    const a = data.address
    if (!a?.country) return null
    const city = a.city ?? a.town ?? a.village ?? a.municipality ?? a.county
    const region = a.state ?? a.region
    return [city, region, a.country].filter(Boolean).join(', ')
  } catch {
    return null
  }
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
      // Visible in the Vercel logs: this is how a Google Cloud setup problem
      // (REQUEST_DENIED = billing / API not enabled / key restriction) shows up.
      console.error('[/api/location/reverse-geocode] Google geocode failed:', data.status, data.error_message ?? '')
      const backup = await osmLabel(lat, lng)
      if (backup) return Response.json({ data: { label: backup } })
      // Last resort: raw coordinates — still usable for nearby-store lookups.
      return Response.json({ data: { label: `${lat.toFixed(3)}, ${lng.toFixed(3)}` } })
    }

    const label = buildLabel(data.results[0].address_components) || data.results[0].formatted_address
    return Response.json({ data: { label } })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[/api/location/reverse-geocode] error:', message)
    const backup = await osmLabel(lat, lng)
    return Response.json({ data: { label: backup ?? `${lat.toFixed(3)}, ${lng.toFixed(3)}` } })
  }
}
