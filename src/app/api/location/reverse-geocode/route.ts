import { auth } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'
import { labelForCoords } from '@/lib/geocode'

// Reverse-geocodes a lat/lng into a human-readable location label, used when
// the user hits "Use my current location" in Settings — the browser gives us
// coordinates, this turns them into something like "Regina, Saskatchewan,
// Canada" to show back to them. See src/lib/geocode.ts for the fallbacks.
export async function GET(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const lat = parseFloat(searchParams.get('lat') ?? '')
  const lng = parseFloat(searchParams.get('lng') ?? '')

  if (isNaN(lat) || isNaN(lng)) {
    return Response.json({ error: 'lat and lng are required' }, { status: 400 })
  }

  const label = await labelForCoords(lat, lng)
  return Response.json({ data: { label } })
}
