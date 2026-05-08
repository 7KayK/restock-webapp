import { auth } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const lat = searchParams.get('lat')
  const lng = searchParams.get('lng')

  if (!lat || !lng) {
    return Response.json({ error: 'lat and lng are required' }, { status: 400 })
  }

  // Placeholder — wire up Google Places API here using NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  return Response.json({ data: [] })
}
