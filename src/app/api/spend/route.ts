import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { startOfMonth, subMonths } from 'date-fns'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (!user) return Response.json({ data: { total: 0, byCategory: {}, byMonth: [] } })

  const sixMonthsAgo = startOfMonth(subMonths(new Date(), 5))

  const purchases = await prisma.purchase.findMany({
    where: {
      userId: user.id,
      createdAt: { gte: sixMonthsAgo },
      price: { not: null },
    },
    select: { price: true, category: true, createdAt: true },
  })

  const byCategory: Record<string, number> = {}
  const byMonthMap: Record<string, number> = {}
  let total = 0

  for (const p of purchases) {
    const amount = p.price ?? 0
    total += amount

    const cat = p.category ?? 'Uncategorized'
    byCategory[cat] = (byCategory[cat] ?? 0) + amount

    const month = p.createdAt.toISOString().slice(0, 7)
    byMonthMap[month] = (byMonthMap[month] ?? 0) + amount
  }

  const byMonth = Object.entries(byMonthMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, amount]) => ({ month, amount }))

  return Response.json({ data: { total, byCategory, byMonth } })
}
