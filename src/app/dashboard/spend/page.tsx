import { Suspense } from 'react'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { format, subMonths, startOfMonth } from 'date-fns'
import { formatCurrency } from '@/lib/utils'
import { SpendBarChart } from '@/components/charts/SpendBarChart'
import type { MonthlySpendPoint, CategorySpend, TopItem } from '@/types'

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

async function SpendAnalysisContent() {
  const { userId } = await auth()
  if (!userId) return null

  try {
    const user = await prisma.user.findUnique({ where: { clerkId: userId } })

    if (!user) {
      return <EmptyState />
    }

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

    const totalCategorySpend = byCategory.reduce((s, c) => s + c.total, 0)

    return (
      <div className="space-y-6">
        {/* Month-over-month card */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <MoMCard
            label={format(now, 'MMMM yyyy')}
            amount={currentMonthSpend}
            sub="Current month"
          />
          <MoMCard
            label={format(subMonths(now, 1), 'MMMM yyyy')}
            amount={previousMonthSpend}
            sub="Previous month"
          />
          <ChangeCard changePercent={changePercent} />
        </div>

        {/* 12-month bar chart */}
        <Card className="bg-white border-gray-100 shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-[#1B3A5C]">Monthly Spend — Last 12 Months</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <SpendBarChart data={byMonth} />
          </CardContent>
        </Card>

        {/* Category table + Top items table */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-white border-gray-100 shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-[#1B3A5C]">Spend by Category</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {byCategory.length === 0 ? (
                <p className="text-sm text-[#1B3A5C]/50 py-6 text-center">No priced purchases yet</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[#1B3A5C]/40 text-xs">
                      <th className="text-left py-2 font-medium">Category</th>
                      <th className="text-right py-2 font-medium">Purchases</th>
                      <th className="text-right py-2 font-medium">Avg</th>
                      <th className="text-right py-2 font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {byCategory.map((c) => (
                      <tr key={c.category}>
                        <td className="py-2.5">
                          <div className="flex items-center gap-2">
                            <div
                              className="h-1.5 rounded-full bg-[#0F7B6C]"
                              style={{
                                width: `${Math.max(4, (c.total / (totalCategorySpend || 1)) * 60)}px`,
                                opacity: 0.7,
                              }}
                            />
                            <span className="text-[#1B3A5C] font-medium truncate max-w-[120px]">
                              {c.category}
                            </span>
                          </div>
                        </td>
                        <td className="text-right text-[#1B3A5C]/60 py-2.5">{c.count}</td>
                        <td className="text-right text-[#1B3A5C]/60 py-2.5">{formatCurrency(c.avg)}</td>
                        <td className="text-right font-semibold text-[#1B3A5C] py-2.5">
                          {formatCurrency(c.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-100 shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-[#1B3A5C]">Top Items</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {topItems.length === 0 ? (
                <p className="text-sm text-[#1B3A5C]/50 py-6 text-center">No purchases yet</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[#1B3A5C]/40 text-xs">
                      <th className="text-left py-2 font-medium">Item</th>
                      <th className="text-right py-2 font-medium">Times</th>
                      <th className="text-right py-2 font-medium">Last</th>
                      <th className="text-right py-2 font-medium">Spend</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {topItems.map((item) => (
                      <tr key={item.item}>
                        <td className="py-2.5 font-medium text-[#1B3A5C] truncate max-w-[140px]">
                          {item.item}
                        </td>
                        <td className="text-right text-[#1B3A5C]/60 py-2.5">{item.purchaseCount}×</td>
                        <td className="text-right text-[#1B3A5C]/60 py-2.5 text-xs">
                          {format(new Date(item.lastPurchased), 'MMM d')}
                        </td>
                        <td className="text-right font-semibold text-[#1B3A5C] py-2.5">
                          {item.totalSpend > 0 ? formatCurrency(item.totalSpend) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  } catch {
    return <ErrorState />
  }
}

function MoMCard({ label, amount, sub }: { label: string; amount: number; sub: string }) {
  return (
    <Card className="bg-white border-gray-100 shadow-none">
      <CardContent className="pt-5">
        <p className="text-xs text-[#1B3A5C]/50 mb-1">{sub}</p>
        <p className="text-2xl font-bold text-[#1B3A5C]">{formatCurrency(amount)}</p>
        <p className="text-xs text-[#1B3A5C]/40 mt-0.5">{label}</p>
      </CardContent>
    </Card>
  )
}

function ChangeCard({ changePercent }: { changePercent: number | null }) {
  if (changePercent === null) {
    return (
      <Card className="bg-white border-gray-100 shadow-none">
        <CardContent className="pt-5">
          <p className="text-xs text-[#1B3A5C]/50 mb-1">Month-over-month</p>
          <div className="flex items-center gap-2">
            <Minus className="h-5 w-5 text-[#1B3A5C]/30" />
            <p className="text-2xl font-bold text-[#1B3A5C]/30">—</p>
          </div>
          <p className="text-xs text-[#1B3A5C]/40 mt-0.5">No prior month data</p>
        </CardContent>
      </Card>
    )
  }

  const isUp = changePercent > 0
  const isFlat = changePercent === 0

  return (
    <Card className="bg-white border-gray-100 shadow-none">
      <CardContent className="pt-5">
        <p className="text-xs text-[#1B3A5C]/50 mb-1">Month-over-month</p>
        <div className="flex items-center gap-2">
          {isFlat ? (
            <Minus className="h-5 w-5 text-[#1B3A5C]/50" />
          ) : isUp ? (
            <TrendingUp className="h-5 w-5 text-[#EF4444]" />
          ) : (
            <TrendingDown className="h-5 w-5 text-[#22C55E]" />
          )}
          <p
            className={`text-2xl font-bold ${
              isFlat
                ? 'text-[#1B3A5C]/50'
                : isUp
                ? 'text-[#EF4444]'
                : 'text-[#22C55E]'
            }`}
          >
            {isUp ? '+' : ''}{changePercent}%
          </p>
        </div>
        <p className="text-xs text-[#1B3A5C]/40 mt-0.5">vs previous month</p>
      </CardContent>
    </Card>
  )
}

function EmptyState() {
  return (
    <Card className="bg-white border-gray-100 shadow-none">
      <CardContent className="py-16 text-center">
        <p className="text-[#1B3A5C]/50 text-sm">
          No spend data yet — log purchases via Telegram or WhatsApp to see your analysis
        </p>
      </CardContent>
    </Card>
  )
}

function ErrorState() {
  return (
    <Card className="bg-white border-gray-100 shadow-none">
      <CardContent className="py-16 text-center">
        <p className="text-[#1B3A5C]/50 text-sm">Failed to load spend data</p>
      </CardContent>
    </Card>
  )
}

function SpendSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="bg-white border-gray-100 shadow-none">
            <CardContent className="pt-5">
              <Skeleton className="h-3 w-24 mb-2" />
              <Skeleton className="h-8 w-28" />
              <Skeleton className="h-3 w-20 mt-1" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="bg-white border-gray-100 shadow-none">
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[280px] w-full rounded-lg" />
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i} className="bg-white border-gray-100 shadow-none">
            <CardHeader className="pb-2">
              <Skeleton className="h-5 w-36" />
            </CardHeader>
            <CardContent className="space-y-3">
              {Array.from({ length: 5 }).map((_, j) => (
                <Skeleton key={j} className="h-8 w-full" />
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default function SpendPage() {
  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold text-[#1B3A5C]">Spend Analysis</h1>
        <p className="text-sm text-[#1B3A5C]/50 mt-0.5">Track your spending patterns over time</p>
      </div>

      <Suspense fallback={<SpendSkeleton />}>
        <SpendAnalysisContent />
      </Suspense>
    </div>
  )
}
