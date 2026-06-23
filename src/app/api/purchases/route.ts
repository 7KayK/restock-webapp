import { auth } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getOrCreateUser } from '@/lib/getOrCreateUser'

export async function GET(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const user = await getOrCreateUser(userId)

    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 200)
    const offset = parseInt(searchParams.get('offset') ?? '0')

    const [purchases, total] = await Promise.all([
      prisma.purchase.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.purchase.count({ where: { userId: user.id } }),
    ])

    return Response.json({ data: purchases, total, limit, offset })
  } catch {
    return Response.json({ error: 'Failed to fetch purchases' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { item, quantity, unit, category, price, source } = body

    if (!item || quantity == null) {
      return Response.json({ error: 'item and quantity are required' }, { status: 400 })
    }

    const user = await getOrCreateUser(userId)

    const purchase = await prisma.purchase.create({
      data: {
        userId: user.id,
        item,
        quantity: parseFloat(quantity),
        unit: unit ?? null,
        category: category ?? null,
        price: price != null ? parseFloat(price) : null,
        source: source ?? 'manual',
      },
    })

    // Fire-and-forget: refresh reminders for this item now that there's new data
    fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.restock.chat'}/api/reminders/sync`, {
      method: 'POST',
      headers: { Cookie: request.headers.get('cookie') ?? '' },
    }).catch(() => { /* non-critical */ })

    return Response.json({ data: purchase }, { status: 201 })
  } catch {
    return Response.json({ error: 'Failed to create purchase' }, { status: 500 })
  }
}
