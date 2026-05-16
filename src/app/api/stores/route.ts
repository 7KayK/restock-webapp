import { auth } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'
import { findNearbyGroceryStores } from '@/lib/places'

export async function GET(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const lat = parseFloat(searchParams.get('lat') ?? '')
  const lng = parseFloat(searchParams.get('lng') ?? '')

  console.log('[/api/stores] lat:', lat, 'lng:', lng)

  if (isNaN(lat) || isNaN(lng)) {
    return Response.json({ error: 'lat and lng are required' }, { status: 400 })
  }

  try {
    const stores = await findNearbyGroceryStores(lat, lng)
    console.log('[/api/stores] returned', stores.length, 'stores')
    return Response.json({ data: stores })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[/api/stores] error — lat:', lat, 'lng:', lng, '— detail:', message)
    return Response.json({ error: 'Failed to fetch nearby stores', detail: message }, { status: 500 })
  }
}
