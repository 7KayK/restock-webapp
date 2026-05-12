import { Suspense } from 'react'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { getOrCreateUser } from '@/lib/getOrCreateUser'
import { searchKrogerProduct } from '@/lib/kroger'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tag, ShoppingBag } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { KrogerDeal } from '@/types'

async function DealsContent() {
  const { userId } = await auth()
  if (!userId) return null

  const user = await getOrCreateUser(userId)

  const topItems = await prisma.purchase.groupBy({
    by: ['item'],
    where: { userId: user.id },
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: 10,
  })

  if (topItems.length === 0) {
    return (
      <Card className="bg-white border-gray-100 shadow-none">
        <CardContent className="py-16 text-center">
          <ShoppingBag className="h-8 w-8 mx-auto mb-3 text-[#1B3A5C]/20" />
          <p className="text-sm text-[#1B3A5C]/45">
            No deals yet — log purchases via Telegram or WhatsApp to see matched deals
          </p>
        </CardContent>
      </Card>
    )
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
    if (r.status === 'fulfilled' && r.value !== null) deals.push(r.value)
  }
  deals.sort((a, b) => {
    if (a.hasPromo !== b.hasPromo) return a.hasPromo ? -1 : 1
    return a.item.localeCompare(b.item)
  })

  if (deals.length === 0) {
    return (
      <Card className="bg-white border-gray-100 shadow-none">
        <CardContent className="py-16 text-center">
          <Tag className="h-8 w-8 mx-auto mb-3 text-[#1B3A5C]/20" />
          <p className="text-sm text-[#1B3A5C]/45">
            No Kroger matches found for your items yet
          </p>
          <p className="text-xs text-[#1B3A5C]/30 mt-1">
            Kroger availability varies by region
          </p>
        </CardContent>
      </Card>
    )
  }

  const promoCount = deals.filter((d) => d.hasPromo).length

  return (
    <Card className="bg-white border-gray-100 shadow-none">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base text-[#1B3A5C]">Matched Deals</CardTitle>
          {promoCount > 0 && (
            <span className="text-xs font-medium rounded-full bg-[#22C55E]/10 text-[#22C55E] px-2.5 py-0.5">
              {promoCount} on sale
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {deals.map((deal) => (
            <DealCard key={deal.productId} deal={deal} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function DealCard({ deal }: { deal: KrogerDeal }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-medium text-[#1B3A5C]/45 uppercase tracking-wide truncate">
            {deal.item}
          </p>
          <p className="text-sm font-semibold text-[#1B3A5C] leading-snug mt-0.5 line-clamp-2">
            {deal.productName}
          </p>
          {deal.size && (
            <p className="text-xs text-[#1B3A5C]/40 mt-0.5">{deal.size}</p>
          )}
        </div>
        {deal.hasPromo && (
          <span className="shrink-0 text-[10px] font-bold rounded-full bg-[#22C55E]/10 text-[#22C55E] px-2 py-0.5 uppercase tracking-wide">
            Sale
          </span>
        )}
      </div>

      {/* Pricing */}
      <div className="flex items-end gap-2 mt-auto">
        {deal.hasPromo && deal.promoPrice !== null ? (
          <>
            <span className="text-xl font-bold text-[#22C55E]">
              {formatCurrency(deal.promoPrice)}
            </span>
            <span className="text-sm text-[#1B3A5C]/35 line-through mb-0.5">
              {formatCurrency(deal.regularPrice)}
            </span>
            {deal.savings !== null && (
              <span className="ml-auto text-xs font-semibold text-[#22C55E] bg-[#22C55E]/10 rounded-full px-2 py-0.5">
                Save {formatCurrency(deal.savings)}
              </span>
            )}
          </>
        ) : (
          <span className="text-xl font-bold text-[#1B3A5C]">
            {formatCurrency(deal.regularPrice)}
          </span>
        )}
      </div>

      <p className="text-[10px] text-[#1B3A5C]/30">via Kroger</p>
    </div>
  )
}

function DealsSkeleton() {
  return (
    <Card className="bg-white border-gray-100 shadow-none">
      <CardHeader className="pb-3">
        <Skeleton className="h-5 w-32" />
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-gray-100 p-4 space-y-3">
              <div className="space-y-1.5">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-12" />
              </div>
              <Skeleton className="h-7 w-20" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default function DealsPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-[#1B3A5C]">Deals</h1>
        <p className="text-sm text-[#1B3A5C]/50 mt-0.5">
          Kroger prices matched to your most purchased items
        </p>
      </div>

      <Suspense fallback={<DealsSkeleton />}>
        <DealsContent />
      </Suspense>
    </div>
  )
}
