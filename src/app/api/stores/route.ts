import { auth } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'
import { findNearbyKrogerStores } from '@/lib/kroger'

export async function GET(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const lat = parseFloat(searchParams.get('lat') ?? '')
  const lng = parseFloat(searchParams.get('lng') ?? '')

  if (isNaN(lat) || isNaN(lng)) {
    return Response.json({ error: 'lat and lng are required' }, { status: 400 })
  }

  try {
    const stores = await findNearbyKrogerStores(lat, lng)
    return Response.json({ data: stores })
  } catch (err) {
    console.error('[/api/stores] error:', err)
    return Response.json({ error: 'Failed to fetch nearby stores' }, { status: 500 })
  }
}
