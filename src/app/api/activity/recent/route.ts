import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import type { RecentActivity } from '@/types'

const EMPTY: RecentActivity = {
  found: false,
  source: null,
  count: 0,
  lastItem: null,
  minutesAgo: null,
}

export async function GET() {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const user = await prisma.user.findUnique({ where: { clerkId: userId } })
    if (!user) return Response.json({ data: EMPTY })

    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000)

    const recentPurchases = await prisma.purchase.findMany({
      where: {
        userId: user.id,
        source: { in: ['telegram', 'whatsapp'] },
        createdAt: { gte: twoHoursAgo },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: { source: true, createdAt: true, item: true },
    })

    if (recentPurchases.length === 0) {
      return Response.json({ data: EMPTY })
    }

    const latest = recentPurchases[0]
    const minutesAgo = Math.round((Date.now() - latest.createdAt.getTime()) / 60000)

    const data: RecentActivity = {
      found: true,
      source: latest.source as 'telegram' | 'whatsapp',
      count: recentPurchases.length,
      lastItem: latest.item,
      minutesAgo,
    }

    return Response.json({ data })
  } catch {
    return Response.json({ error: 'Failed to fetch recent activity' }, { status: 500 })
  }
}
