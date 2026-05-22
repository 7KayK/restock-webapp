import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import type { ChannelStatus } from '@/types'

const EMPTY: ChannelStatus = {
  telegramId: null,
  whatsappNumber: null,
  recentBotActivity: null,
  telegramLastAt: null,
  whatsappLastAt: null,
}

export async function GET() {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const user = await prisma.user.findUnique({ where: { clerkId: userId } })
    if (!user) return Response.json({ data: EMPTY })

    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000)

    const [recentBotPurchases, lastTelegram, lastWhatsapp] = await Promise.all([
      prisma.purchase.findMany({
        where: {
          userId: user.id,
          source: { in: ['telegram', 'whatsapp'] },
          createdAt: { gte: twoHoursAgo },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: { source: true, createdAt: true },
      }),
      prisma.purchase.findFirst({
        where: { userId: user.id, source: 'telegram' },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      }),
      prisma.purchase.findFirst({
        where: { userId: user.id, source: 'whatsapp' },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      }),
    ])

    let recentBotActivity: ChannelStatus['recentBotActivity'] = null
    if (recentBotPurchases.length > 0) {
      const latest = recentBotPurchases[0]
      const minutesAgo = Math.round((Date.now() - latest.createdAt.getTime()) / 60000)
      recentBotActivity = {
        source: latest.source as 'telegram' | 'whatsapp',
        count: recentBotPurchases.length,
        minutesAgo,
      }
    }

    const data: ChannelStatus = {
      telegramId: user.telegramId,
      whatsappNumber: user.whatsappNumber,
      recentBotActivity,
      telegramLastAt: lastTelegram?.createdAt?.toISOString() ?? null,
      whatsappLastAt: lastWhatsapp?.createdAt?.toISOString() ?? null,
    }

    return Response.json({ data })
  } catch {
    return Response.json({ error: 'Failed to fetch channel status' }, { status: 500 })
  }
}
