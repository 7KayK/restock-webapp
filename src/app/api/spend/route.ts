import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { format, subMonths, startOfMonth } from 'date-fns'
import type { SpendAnalysis, MonthlySpendPoint, CategorySpend, TopItem } from '@/types'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const user = await prisma.user.findUnique({ where: { clerkId: userId } })
    if (!user) return Response.json({ data: emptyAnalysis() })

    const twelveMonthsAgo = startOfMonth(subMonths(new Date(), 11))

    const [purchases, categoryGroups, itemGroups] = await Promise.all([
      prisma.purchase.findMany({
        where: { userId: user.id, createdAt: { gte: twelveMonthsAgo }, price: { not: null } },
        select: { price: true, createdAt: true },
      }),
      prisma.purchase.groupBy({
        by: ['category'],
        where: { userId: user.id, price: { not: null } },
        _sum: { price: true },
        _count: { id: true },
        _avg: { price: true },
        orderBy: { _sum: { price: 'desc' } },
      }),
      prisma.purchase.groupBy({
        by: ['item'],
        where: { userId: user.id },
        _sum: { price: true, quantity: true },
        _count: { id: true },
        _max: { createdAt: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),
    ])

    const byMonth = buildMonthPoints(purchases, 12)

    const now = new Date()
    const currentMonthKey = format(now, 'yyyy-MM')
    const prevMonthKey = format(subMonths(now, 1), 'yyyy-MM')
    const currentMonthSpend = byMonth.find((m) => m.month === currentMonthKey)?.amount ?? 0
    const previousMonthSpend = byMonth.find((m) => m.month === prevMonthKey)?.amount ?? 0
    const changePercent =
      previousMonthSpend === 0
        ? null
        : Math.round(((currentMonthSpend - previousMonthSpend) / previousMonthSpend) * 100)

    const byCategory: CategorySpend[] = categoryGroups.map((g) => ({
      category: g.category ?? 'Uncategorized',
      total: g._sum.price ?? 0,
      count: g._count.id,
      avg: g._avg.price ?? 0,
    }))

    const topItems: TopItem[] = itemGroups.map((g) => ({
      item: g.item,
      totalQty: g._sum.quantity ?? 0,
      totalSpend: g._sum.price ?? 0,
      purchaseCount: g._count.id,
      lastPurchased: (g._max.createdAt ?? new Date()).toISOString(),
    }))

    const result: SpendAnalysis = {
      byMonth,
      byCategory,
      topItems,
      currentMonthSpend,
      previousMonthSpend,
      changePercent,
    }

    return Response.json({ data: result })
  } catch {
    return Response.json({ error: 'Failed to fetch spend data' }, { status: 500 })
  }
}

function buildMonthPoints(
  purchases: Array<{ price: number | null; createdAt: Date }>,
  months: number
): MonthlySpendPoint[] {
  const now = new Date()
  const points: MonthlySpendPoint[] = []
  for (let i = months - 1; i >= 0; i--) {
    const d = subMonths(now, i)
    points.push({
      month: format(d, 'yyyy-MM'),
      label: format(d, 'MMM yyyy'),
      amount: 0,
      isCurrentMonth: i === 0,
    })
  }
  for (const p of purchases) {
    const key = format(p.createdAt, 'yyyy-MM')
    const pt = points.find((x) => x.month === key)
    if (pt) pt.amount += p.price ?? 0
  }
  return points
}

function emptyAnalysis(): SpendAnalysis {
  const byMonth = buildMonthPoints([], 12)
  return { byMonth, byCategory: [], topItems: [], currentMonthSpend: 0, previousMonthSpend: 0, changePercent: null }
}
