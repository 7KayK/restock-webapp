import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseRegion } from '@/lib/region'
import { probeWebSearch } from '@/lib/priceLookup'
import { DEFAULT_MODEL } from '@/lib/claude'

// Self-check for the whole price/location stack, so a failure names its cause
// instead of showing up as a vague empty screen.
//
//   /api/health?token=<HEALTH_TOKEN>            fast checks (database, tables, keys, Google)
//   /api/health?token=<HEALTH_TOKEN>&deep=1     also runs ONE real web price lookup (costs a few cents)
//
// Disabled (404) unless HEALTH_TOKEN is set in the environment and matches, so
// it can't be used by strangers to run paid calls. Never returns key values.
export const maxDuration = 60

type Check = { name: string; ok: boolean; detail: string }

async function timed<T>(fn: () => Promise<T>): Promise<T> {
  return fn()
}

export async function GET(request: NextRequest) {
  const expected = process.env.HEALTH_TOKEN
  const { searchParams } = new URL(request.url)
  if (!expected || searchParams.get('token') !== expected) {
    return new Response('Not found', { status: 404 })
  }
  const deep = searchParams.get('deep') === '1'
  const checks: Check[] = []
  const add = (name: string, ok: boolean, detail: string) => checks.push({ name, ok, detail })

  // 1. Keys present (names only, never values)
  const keys = ['ANTHROPIC_API_KEY', 'GOOGLE_PLACES_API_KEY', 'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY', 'DATABASE_URL']
  for (const k of keys) add(`env ${k}`, !!process.env[k], process.env[k] ? 'set' : 'MISSING')
  add('model used for lookups', true, process.env.ANTHROPIC_LOOKUP_MODEL ?? DEFAULT_MODEL)

  // 2. Database + the new tables
  try {
    await prisma.$queryRaw`SELECT 1`
    add('database reachable', true, 'ok')
  } catch (err) {
    add('database reachable', false, err instanceof Error ? err.message.slice(0, 200) : 'failed')
  }
  try {
    const [official, lookups] = await Promise.all([prisma.typicalPrice.count(), prisma.priceLookup.count()])
    add('tables TypicalPrice / PriceLookup', true, `${official} official rows, ${lookups} cached web lookups`)
  } catch (err) {
    add('tables TypicalPrice / PriceLookup', false, 'missing: run `npx prisma db push` (' + (err instanceof Error ? err.message.slice(0, 120) : '') + ')')
  }

  // 3. Region parsing
  const r = parseRegion('Regina, Saskatchewan, Canada')
  add('region parsing', r?.currency === 'CAD', r ? `${r.countryCode} / ${r.currency}` : 'failed')

  // 4. Google APIs, all on GOOGLE_PLACES_API_KEY (Regina)
  const gkey = process.env.GOOGLE_PLACES_API_KEY ?? ''
  if (gkey) {
    const lat = 50.4452
    const lng = -104.6189
    try {
      const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${gkey}`, { cache: 'no-store', signal: AbortSignal.timeout(10_000) })
      const data = (await res.json()) as { status?: string; error_message?: string }
      add('Google Geocoding API', data.status === 'OK', data.status === 'OK' ? 'ok' : `${data.status}: ${data.error_message ?? ''}`.slice(0, 250))
    } catch (err) {
      add('Google Geocoding API', false, err instanceof Error ? err.message : 'failed')
    }
    try {
      const res = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': gkey, 'X-Goog-FieldMask': 'places.id' },
        body: JSON.stringify({ includedTypes: ['supermarket'], maxResultCount: 1, locationRestriction: { circle: { center: { latitude: lat, longitude: lng }, radius: 5000 } } }),
        cache: 'no-store',
        signal: AbortSignal.timeout(10_000),
      })
      const text = await res.text()
      add('Google Places API (New)', res.ok, res.ok ? 'ok' : `HTTP ${res.status}: ${text.slice(0, 220)}`)
    } catch (err) {
      add('Google Places API (New)', false, err instanceof Error ? err.message : 'failed')
    }
    try {
      const res = await fetch('https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': gkey, 'X-Goog-FieldMask': 'originIndex,destinationIndex,duration,status' },
        body: JSON.stringify({
          origins: [{ waypoint: { location: { latLng: { latitude: lat, longitude: lng } } } }],
          destinations: [{ waypoint: { location: { latLng: { latitude: 50.4801, longitude: -104.6 } } } }],
          travelMode: 'DRIVE',
          routingPreference: 'TRAFFIC_AWARE',
        }),
        cache: 'no-store',
        signal: AbortSignal.timeout(10_000),
      })
      const text = await res.text()
      add('Google Routes API', res.ok, res.ok ? 'ok' : `HTTP ${res.status}: ${text.slice(0, 220)}`)
    } catch (err) {
      add('Google Routes API', false, err instanceof Error ? err.message : 'failed')
    }
  } else {
    add('Google APIs', false, 'GOOGLE_PLACES_API_KEY missing')
  }

  // 5. Deep: one real web price lookup (paid), nothing saved
  if (deep && r) {
    const probe = await timed(() => probeWebSearch('milk', r))
    add(
      'live web price lookup (milk, Regina)',
      probe.ok,
      probe.ok ? `model ${probe.model}: ${probe.observations} listings, ${probe.price} per ${probe.unit}` : `model ${probe.model}: ${probe.error}`
    )
  } else if (!deep) {
    add('live web price lookup', true, 'skipped (add &deep=1 to run one real lookup)')
  }

  const failed = checks.filter((c) => !c.ok)
  return Response.json({
    status: failed.length === 0 ? 'ALL_OK' : 'PROBLEMS',
    failed: failed.map((c) => c.name),
    checkedAt: new Date().toISOString(),
    checks,
  })
}
