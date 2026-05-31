import { Suspense } from 'react'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { getOrCreateUser } from '@/lib/getOrCreateUser'
import { searchFoodProduct } from '@/lib/kroger'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ShoppingBag, Package } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { FoodProduct } from '@/types'

const NUTRISCORE_STYLES: Record<string, string> = {
  a: 'bg-green-600 text-white',
  b: 'bg-green-400 text-white',
  c: 'bg-yellow-400 text-gray-800',
  d: 'bg-orange-400 text-white',
  e: 'bg-red-500 text-white',
}

async function ProductsContent() {
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
            No items yet — log purchases via Telegram or WhatsApp to see product information
          </p>
        </CardContent>
      </Card>
    )
  }

  const results = await Promise.allSettled(
    topItems.map(async (t): Promise<FoodProduct | null> => {
      const product = await searchFoodProduct(t.item)
      if (!product) return null
      return { item: t.item, ...product }
    })
  )

  const products: FoodProduct[] = []
  for (const r of results) {
    if (r.status === 'fulfilled' && r.value !== null) products.push(r.value)
  }
  products.sort((a, b) => a.item.localeCompare(b.item))

  if (products.length === 0) {
    return (
      <Card className="bg-white border-gray-100 shadow-none">
        <CardContent className="py-16 text-center">
          <Package className="h-8 w-8 mx-auto mb-3 text-[#1B3A5C]/20" />
          <p className="text-sm text-[#1B3A5C]/45">No product matches found for your items yet</p>
          <p className="text-xs text-[#1B3A5C]/30 mt-1">
            Keep logging purchases — product info improves with more data
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white border-gray-100 shadow-none">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base text-[#1B3A5C]">Your Items</CardTitle>
          <span className="text-xs text-[#1B3A5C]/40">{products.length} matched</span>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {products.map((product) => (
            <ProductCard key={product.productId} product={product} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function ProductCard({ product }: { product: FoodProduct }) {
  const nutriStyle = product.nutriscoreGrade
    ? NUTRISCORE_STYLES[product.nutriscoreGrade] ?? 'bg-gray-200 text-gray-600'
    : null

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4 flex flex-col gap-3">
      {/* Product image */}
      {product.imageUrl && (
        <div className="h-24 w-full flex items-center justify-center rounded-lg bg-gray-50 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.imageUrl}
            alt={product.productName}
            className="max-h-full max-w-full object-contain"
          />
        </div>
      )}

      {/* Names */}
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-[#1B3A5C]/45 uppercase tracking-wide truncate">
          {product.item}
        </p>
        <p className="text-sm font-semibold text-[#1B3A5C] leading-snug mt-0.5 line-clamp-2">
          {product.productName}
        </p>
        {product.brand && (
          <p className="text-xs text-[#1B3A5C]/50 mt-0.5">{product.brand}</p>
        )}
      </div>

      {/* Nutriscore badge */}
      <div className="flex items-center justify-between mt-auto">
        {nutriStyle ? (
          <span className={cn('text-[10px] font-bold rounded px-1.5 py-0.5 uppercase tracking-wide', nutriStyle)}>
            Nutri-Score {product.nutriscoreGrade!.toUpperCase()}
          </span>
        ) : (
          <span />
        )}
        <p className="text-[10px] text-[#1B3A5C]/30">Open Food Facts</p>
      </div>
    </div>
  )
}

function ProductsSkeleton() {
  return (
    <Card className="bg-white border-gray-100 shadow-none">
      <CardHeader className="pb-3">
        <Skeleton className="h-5 w-32" />
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-gray-100 p-4 space-y-3">
              <Skeleton className="h-24 w-full rounded-lg" />
              <div className="space-y-1.5">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-5 w-24" />
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
        <h1 className="text-xl md:text-2xl font-bold text-[#1B3A5C]">Deals</h1>
        <p className="text-sm text-[#1B3A5C]/50 mt-0.5">
          Product information for your most purchased items
        </p>
      </div>

      <Suspense fallback={<ProductsSkeleton />}>
        <ProductsContent />
      </Suspense>
    </div>
  )
}
