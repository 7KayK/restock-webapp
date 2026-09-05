export const dynamic = 'force-dynamic'

import { Suspense } from 'react'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { PurchaseList } from '@/components/shared/PurchaseList'
import type { Purchase } from '@/types'

async function PurchaseHistory() {
  const { userId } = await auth()
  if (!userId) return null

  try {
    const user = await prisma.user.findUnique({ where: { clerkId: userId } })

    let purchases: Purchase[] = []
    let categories: string[] = []

    if (user) {
      const rows = await prisma.purchase.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 500,
      })

      purchases = rows.map((p) => ({
        ...p,
        unit: p.unit ?? null,
        category: p.category ?? null,
        price: p.price ?? null,
      }))

      categories = Array.from(
        new Set(rows.map((p) => p.category).filter((c): c is string => c != null))
      ).sort()
    }

    return (
      <Card className="bg-white border-[rgba(19,43,34,0.10)] shadow-[0_2px_10px_rgba(19,43,34,0.05)]">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base text-[#132B22]">All Purchases</CardTitle>
            <span className="text-xs text-[#132B22]/40 font-normal">
              {purchases.length} total
            </span>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <PurchaseList initialPurchases={purchases} categories={categories} />
        </CardContent>
      </Card>
    )
  } catch {
    return (
      <Card className="bg-white border-[rgba(19,43,34,0.10)] shadow-[0_2px_10px_rgba(19,43,34,0.05)]">
        <CardContent className="py-12 text-center text-sm text-[#132B22]/45">
          Failed to load purchase history
        </CardContent>
      </Card>
    )
  }
}

function HistorySkeleton() {
  return (
    <Card className="bg-white border-[rgba(19,43,34,0.10)] shadow-[0_2px_10px_rgba(19,43,34,0.05)]">
      <CardHeader className="pb-3">
        <Skeleton className="h-5 w-32" />
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <div className="flex gap-3">
          <Skeleton className="h-8 flex-1" />
          <Skeleton className="h-8 w-40" />
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between py-1">
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-48" />
            </div>
            <Skeleton className="h-4 w-12" />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export default function HistoryPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl md:text-2xl font-medium text-[#132B22] [font-family:var(--font-playfair)]">Purchase History</h1>
        <p className="text-sm text-[#132B22]/50 mt-0.5">
          Every item logged across all channels
        </p>
      </div>

      <Suspense fallback={<HistorySkeleton />}>
        <PurchaseHistory />
      </Suspense>
    </div>
  )
}
