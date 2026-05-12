import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { getOrCreateUser } from '@/lib/getOrCreateUser'
import { searchKrogerProduct } from '@/lib/kroger'
import type { KrogerDeal } from '@/types'

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
      topItems.map(async (t): Promise<KrogerDeal | null> => {
        const product = await searchKrogerProduct(t.item)
        if (!product || product.regularPrice === 0) return null
        return { item: t.item, ...product }
      })
    )

    const deals: KrogerDeal[] = []
    for (const r of results) {
      if (r.status === 'fulfilled' && r.value !== null) {
        deals.push(r.value)
      }
    }

    // Promo items first, then alphabetical
    deals.sort((a, b) => {
      if (a.hasPromo !== b.hasPromo) return a.hasPromo ? -1 : 1
      return a.item.localeCompare(b.item)
    })

    return Response.json({ data: deals })
  } catch {
    return Response.json({ error: 'Failed to fetch deals' }, { status: 500 })
  }
}
