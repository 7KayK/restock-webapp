import { auth } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getOrCreateUser } from '@/lib/getOrCreateUser'
import { isSupportedCurrency } from '@/lib/currency'
import { priceFreshnessCutoff, toPriceSighting } from '@/lib/priceSightings'
import type { PriceSighting } from '@/types'

// GET /api/price-sightings?item=milk — recent, cheapest-first sightings for
// one item. Distance-based ranking is intentionally not applied here yet
// (see roadmap note in the shopping-list route) — this just answers
// "what's this actually going for lately, anywhere reported."
export async function GET(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const item = (searchParams.get('item') ?? '').trim().toLowerCase()
  if (!item) return Response.json({ error: 'item is required' }, { status: 400 })

  try {
    const sightings = await prisma.priceSighting.findMany({
      where: { item, createdAt: { gte: priceFreshnessCutoff() } },
      orderBy: { price: 'asc' },
      take: 20,
    })

    const data: PriceSighting[] = sightings.map(toPriceSighting)

    return Response.json({ data })
  } catch {
    return Response.json({ error: 'Failed to fetch price sightings' }, { status: 500 })
  }
}

// POST /api/price-sightings — "I saw this here for $X." The crowdsourced
// core of the price-comparison feature: works in every market Restock is
// tested in, with no dependency on any one store having an API.
export async function POST(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = (await request.json()) as {
      item?: unknown
      storeName?: unknown
      storePlaceId?: unknown
      storeLat?: unknown
      storeLng?: unknown
      price?: unknown
      currency?: unknown
      unit?: unknown
    }

    const item = typeof body.item === 'string' ? body.item.trim().toLowerCase() : ''
    if (!item) return Response.json({ error: 'item is required' }, { status: 400 })

    const storeName = typeof body.storeName === 'string' ? body.storeName.trim() : ''
    if (!storeName) return Response.json({ error: 'storeName is required' }, { status: 400 })

    const price = typeof body.price === 'number' ? body.price : NaN
    if (!Number.isFinite(price) || price <= 0) {
      return Response.json({ error: 'price must be a positive number' }, { status: 400 })
    }

    if (!isSupportedCurrency(body.currency)) {
      return Response.json({ error: 'currency is not supported' }, { status: 400 })
    }

    const storePlaceId = typeof body.storePlaceId === 'string' ? body.storePlaceId : null
    const storeLat = typeof body.storeLat === 'number' ? body.storeLat : null
    const storeLng = typeof body.storeLng === 'number' ? body.storeLng : null
    const unit = typeof body.unit === 'string' && body.unit.trim() ? body.unit.trim() : null

    const user = await getOrCreateUser(userId)

    const sighting = await prisma.priceSighting.create({
      data: {
        item,
        storeName,
        storePlaceId,
        storeLat,
        storeLng,
        price,
        currency: body.currency,
        unit,
        source: 'crowdsourced',
        reportedById: user.id,
      },
    })

    const data: PriceSighting = toPriceSighting(sighting)

    return Response.json({ data }, { status: 201 })
  } catch {
    return Response.json({ error: 'Failed to save price sighting' }, { status: 500 })
  }
}
