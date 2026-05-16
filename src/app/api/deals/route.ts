import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { getOrCreateUser } from '@/lib/getOrCreateUser'
import { searchFoodProduct } from '@/lib/kroger'
import type { FoodProduct } from '@/types'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const user = await getOrCreateUser(userId)

    const topItems = await prisma.purchase.groupBy({
      by: ['item'],
      where: { userId: user.id },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    })

    if (topItems.length === 0) {
      return Response.json({ data: [] })
    }

    const results = await Promise.allSettled(
      topItems.map(async (t): Promise<FoodProduct | null> => {
        const product = await searchFoodProduct(t.item)
        if (!product) return null
        return { item: t.item, ...product }
      })
    )

    const products: FoodProduct[] = []
    for (const r of results) {
      if (r.status === 'fulfilled' && r.value !== null) products.push(r.value)
    }

    products.sort((a, b) => a.item.localeCompare(b.item))

    return Response.json({ data: products })
  } catch {
    return Response.json({ error: 'Failed to fetch product information' }, { status: 500 })
  }
}
