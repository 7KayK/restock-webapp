import { Suspense } from 'react'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ShoppingCart, Bell, DollarSign, Package } from 'lucide-react'
import { startOfMonth } from 'date-fns'
import { formatCurrency } from '@/lib/utils'

async function getStats(clerkId: string) {
  try {
    const user = await prisma.user.findUnique({ where: { clerkId } })
    if (!user) return null

    const monthStart = startOfMonth(new Date())

    const [totalPurchases, activeReminders, monthlySpend, uniqueItems] = await Promise.all([
      prisma.purchase.count({ where: { userId: user.id } }),
      prisma.reminder.count({ where: { userId: user.id, active: true } }),
      prisma.purchase.aggregate({
        where: {
          userId: user.id,
          createdAt: { gte: monthStart },
          price: { not: null },
        },
        _sum: { price: true },
      }),
      prisma.purchase
        .findMany({
          where: { userId: user.id },
          select: { item: true },
          distinct: ['item'],
        })
        .then((r) => r.length),
    ])

    return {
      totalPurchases,
      activeReminders,
      monthlySpend: monthlySpend._sum.price ?? 0,
      itemsTracked: uniqueItems,
    }
  } catch {
    return null
  }
}

async function StatCards() {
  const { userId } = await auth()
  if (!userId) return null

  const stats = await getStats(userId)

  const cards = [
    {
      title: 'Total Purchases',
      value: stats?.totalPurchases ?? 0,
      sub: stats?.totalPurchases === 0 ? 'Log your first purchase' : 'All time',
      icon: ShoppingCart,
    },
    {
      title: 'This Month Spend',
      value: formatCurrency(stats?.monthlySpend ?? 0),
      sub: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
      icon: DollarSign,
    },
    {
      title: 'Active Reminders',
      value: stats?.activeReminders ?? 0,
      sub: stats?.activeReminders === 0 ? 'No reminders yet' : 'Items due for restock',
      icon: Bell,
    },
    {
      title: 'Items Tracked',
      value: stats?.itemsTracked ?? 0,
      sub: stats?.itemsTracked === 0 ? 'Add purchases to begin' : 'Unique items logged',
      icon: Package,
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(({ title, value, sub, icon: Icon }) => (
        <Card key={title} className="bg-white border-gray-100 shadow-none">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-[#1B3A5C]/60">{title}</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-[#0F7B6C]/10 flex items-center justify-center shrink-0">
              <Icon className="h-4 w-4 text-[#0F7B6C]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#1B3A5C]">{value}</div>
            <p className="text-xs text-[#1B3A5C]/45 mt-0.5">{sub}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function StatCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="bg-white border-gray-100 shadow-none">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-7 w-16" />
            <Skeleton className="h-3 w-36 mt-1.5" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default function DashboardPage() {
  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold text-[#1B3A5C]">Dashboard</h1>
        <p className="text-sm text-[#1B3A5C]/50 mt-0.5">Your household restocking overview</p>
      </div>

      <Suspense fallback={<StatCardsSkeleton />}>
        <StatCards />
      </Suspense>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white border-gray-100 shadow-none">
          <CardHeader>
            <CardTitle className="text-base text-[#1B3A5C]">Upcoming Restocks</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-[#1B3A5C]/50">
              Add purchases to get AI-powered restock predictions.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-100 shadow-none">
          <CardHeader>
            <CardTitle className="text-base text-[#1B3A5C]">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-[#1B3A5C]/50">
              Your purchase history will appear here.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
