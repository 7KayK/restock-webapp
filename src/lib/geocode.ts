// Turns coordinates into the coarse "City, Region, Country" label Restock uses
// to decide which market a shopper is in. Google Geocoding first; if Google
// refuses (billing off, API not enabled, key restricted) OpenStreetMap's
// Nominatim is the backup, and raw coordinates are the last resort.

const GEOCODE_URL = 'https://maps.googleapis.com/maps/api/geocode/json'

interface AddressComponent {
  long_name: string
  short_name: string
  types: string[]
}

interface GeocodeResponse {
  results?: { address_components: AddressComponent[]; formatted_address: string }[]
  status: string
  error_message?: string
}

// Nominatim needs no key; its usage policy asks for an identifying User-Agent
// and low volume, which an occasional lookup respects.
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

function buildLabel(components: AddressComponent[]): string {
  const city =
    componentFor(components, 'locality') ??
    componentFor(components, 'postal_town') ??
    componentFor(components, 'administrative_area_level_2')
  const region = componentFor(components, 'administrative_area_level_1')
  const country = componentFor(components, 'country')
  return [city, region, country].filter(Boolean).join(', ')
}

export async function labelForCoords(lat: number, lng: number): Promise<string> {
  const raw = `${lat.toFixed(3)}, ${lng.toFixed(3)}`
  const apiKey = process.env.GOOGLE_PLACES_API_KEY ?? ''
  if (apiKey) {
    try {
      const res = await fetch(`${GEOCODE_URL}?latlng=${lat},${lng}&key=${apiKey}`, { cache: 'no-store' })
      const data = (await res.json()) as GeocodeResponse
      if (data.status === 'OK' && data.results?.length) {
        return buildLabel(data.results[0].address_components) || data.results[0].formatted_address
      }
      // REQUEST_DENIED here = billing / API not enabled / key restriction.
      console.error('[geocode] Google geocode failed:', data.status, data.error_message ?? '')
    } catch (err) {
      console.error('[geocode] error:', err instanceof Error ? err.message : String(err))
    }
  }
  return (await osmLabel(lat, lng)) ?? raw
}
