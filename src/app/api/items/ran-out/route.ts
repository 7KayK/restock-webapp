import { auth } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getOrCreateUser } from '@/lib/getOrCreateUser'

// Records a user-reported depletion event.
// Stored as a Purchase with quantity=0 and source='depleted' so the
// pantry algorithm can compare predicted vs actual finish dates.
export async function POST(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { item, category } = body

    if (!item) return Response.json({ error: 'item is required' }, { status: 400 })

    const user = await getOrCreateUser(userId)

    await prisma.purchase.create({
      data: {
        userId: user.id,
        item: item.trim().toLowerCase(),
        quantity: 0,
        category: category ?? null,
        source: 'depleted',
      },
    })

    return Response.json({ ok: true })
  } catch {
    return Response.json({ error: 'Failed to record depletion' }, { status: 500 })
  }
}
