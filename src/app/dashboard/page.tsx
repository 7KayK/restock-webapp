import { Suspense } from 'react'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ShoppingCart, Bell, DollarSign, Package } from 'lucide-react'
import { format, startOfMonth, subMonths } from 'date-fns'
import { formatCurrency } from '@/lib/utils'
import { StatCard, StatCardSkeleton } from '@/components/dashboard/StatCard'
import { SpendTrendChart } from '@/components/charts/SpendTrendChart'
import { CategoryChart } from '@/components/charts/CategoryChart'
import type { MonthlySpendPoint, CategorySpend } from '@/types'

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

async function StatCards() {
  const { userId } = await auth()
  if (!userId) return null

  try {
    const user = await prisma.user.findUnique({ where: { clerkId: userId } })
    if (!user) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { title: 'Total Purchases', value: 0, sub: 'Log your first purchase', icon: ShoppingCart },
            { title: 'This Month Spend', value: formatCurrency(0), sub: format(new Date(), 'MMMM yyyy'), icon: DollarSign },
            { title: 'Active Reminders', value: 0, sub: 'No reminders yet', icon: Bell },
            { title: 'Items Tracked', value: 0, sub: 'Add purchases to begin', icon: Package },
          ].map((c) => (
            <StatCard key={c.title} title={c.title} value={c.value} sub={c.sub} icon={c.icon} />
          ))}
        </div>
      )
    }

    const monthStart = startOfMonth(new Date())

    const [totalPurchases, activeReminders, monthlySpend, uniqueItems] = await Promise.all([
      prisma.purchase.count({ where: { userId: user.id } }),
      prisma.reminder.count({ where: { userId: user.id, active: true } }),
      prisma.purchase.aggregate({
        where: { userId: user.id, createdAt: { gte: monthStart }, price: { not: null } },
        _sum: { price: true },
      }),
      prisma.purchase
        .findMany({ where: { userId: user.id }, select: { item: true }, distinct: ['item'] })
        .then((r) => r.length),
    ])

    const spend = monthlySpend._sum.price ?? 0

    const cards = [
      {
        title: 'Total Purchases',
        value: totalPurchases,
        sub: totalPurchases === 0 ? 'Log your first purchase' : 'All time',
        icon: ShoppingCart,
      },
      {
        title: 'This Month Spend',
        value: formatCurrency(spend),
        sub: format(new Date(), 'MMMM yyyy'),
        icon: DollarSign,
      },
      {
        title: 'Active Reminders',
        value: activeReminders,
        sub: activeReminders === 0 ? 'No reminders yet' : 'Items due for restock',
        icon: Bell,
      },
      {
        title: 'Items Tracked',
        value: uniqueItems,
        sub: uniqueItems === 0 ? 'Add purchases to begin' : 'Unique items logged',
        icon: Package,
      },
    ]

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <StatCard key={c.title} title={c.title} value={c.value} sub={c.sub} icon={c.icon} />
        ))}
      </div>
    )
  } catch {
    return null
  }
}

function StatCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
  )
}

async function SpendChartsSection() {
  const { userId } = await auth()
  if (!userId) return null

  const emptyTrend = buildMonthPoints([], 6)

  try {
    const user = await prisma.user.findUnique({ where: { clerkId: userId } })
    if (!user) {
      return <SpendChartCards trendData={emptyTrend} categoryData={[]} />
    }

    const sixMonthsAgo = startOfMonth(subMonths(new Date(), 5))

    const [purchases, categoryGroups] = await Promise.all([
      prisma.purchase.findMany({
        where: { userId: user.id, createdAt: { gte: sixMonthsAgo }, price: { not: null } },
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
    ])

    const trendData = buildMonthPoints(purchases, 6)
    const categoryData: CategorySpend[] = categoryGroups.map((g) => ({
      category: g.category ?? 'Uncategorized',
      total: g._sum.price ?? 0,
      count: g._count.id,
      avg: g._avg.price ?? 0,
    }))

    return <SpendChartCards trendData={trendData} categoryData={categoryData} />
  } catch {
    return <SpendChartCards trendData={emptyTrend} categoryData={[]} />
  }
}

function SpendChartCards({
  trendData,
  categoryData,
}: {
  trendData: MonthlySpendPoint[]
  categoryData: CategorySpend[]
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-2 bg-white border-gray-100 shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-[#1B3A5C]">Spend Trend</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <SpendTrendChart data={trendData} />
        </CardContent>
      </Card>
      <Card className="bg-white border-gray-100 shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-[#1B3A5C]">By Category</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <CategoryChart data={categoryData} />
        </CardContent>
      </Card>
    </div>
  )
}

function ChartsSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-2 bg-white border-gray-100 shadow-none">
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-28" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[220px] w-full rounded-lg" />
        </CardContent>
      </Card>
      <Card className="bg-white border-gray-100 shadow-none">
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-24" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[220px] w-full rounded-lg" />
        </CardContent>
      </Card>
    </div>
  )
}

const SOURCE_STYLES: Record<string, string> = {
  telegram: 'bg-blue-50 text-blue-600',
  whatsapp: 'bg-green-50 text-green-700',
  receipt: 'bg-orange-50 text-orange-600',
  manual: 'bg-gray-100 text-gray-500',
}

async function RecentPurchases() {
  const { userId } = await auth()
  if (!userId) return null

  try {
    const user = await prisma.user.findUnique({ where: { clerkId: userId } })
    if (!user) return <EmptyRecentPurchases />

    const purchases = await prisma.purchase.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
    })

    if (!purchases.length) return <EmptyRecentPurchases />

    return (
      <Card className="bg-white border-gray-100 shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-[#1B3A5C]">Recent Purchases</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ul className="divide-y divide-gray-50">
            {purchases.map((p) => {
              const sourceStyle = SOURCE_STYLES[p.source] ?? SOURCE_STYLES.manual
              return (
                <li key={p.id} className="flex items-center justify-between py-3 gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-medium text-[#1B3A5C] truncate">
                        {p.item}
                        <span className="font-normal text-[#1B3A5C]/50 ml-1.5">
                          × {p.quantity}
                          {p.unit ? ` ${p.unit}` : ''}
                        </span>
                      </span>
                      <div className="flex items-center gap-2 mt-0.5">
                        {p.category && (
                          <span className="inline-block rounded-full bg-[#0F7B6C]/10 text-[#0F7B6C] text-[10px] font-medium px-2 py-0.5">
                            {p.category}
                          </span>
                        )}
                        <span className={`inline-block rounded-full text-[10px] font-medium px-2 py-0.5 ${sourceStyle}`}>
                          {p.source}
                        </span>
                        <span className="text-[#1B3A5C]/35 text-xs">
                          {format(p.createdAt, 'MMM d')}
                        </span>
                      </div>
                    </div>
                  </div>
                  {p.price != null && (
                    <span className="text-sm font-semibold text-[#1B3A5C] shrink-0">
                      {formatCurrency(p.price)}
                    </span>
                  )}
                </li>
              )
            })}
          </ul>
        </CardContent>
      </Card>
    )
  } catch {
    return null
  }
}

function EmptyRecentPurchases() {
  return (
    <Card className="bg-white border-gray-100 shadow-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-base text-[#1B3A5C]">Recent Purchases</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-[#1B3A5C]/50 py-4 text-center">
          No purchases yet — log your first via Telegram or WhatsApp
        </p>
      </CardContent>
    </Card>
  )
}

function RecentSkeleton() {
  return (
    <Card className="bg-white border-gray-100 shadow-none">
      <CardHeader className="pb-2">
        <Skeleton className="h-5 w-36" />
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-4 w-14" />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold text-[#1B3A5C]">Dashboard</h1>
        <p className="text-sm text-[#1B3A5C]/50 mt-0.5">Your restocking overview</p>
      </div>

      <Suspense fallback={<StatCardsSkeleton />}>
        <StatCards />
      </Suspense>

      <Suspense fallback={<ChartsSkeleton />}>
        <SpendChartsSection />
      </Suspense>

      <Suspense fallback={<RecentSkeleton />}>
        <RecentPurchases />
      </Suspense>
    </div>
  )
}
