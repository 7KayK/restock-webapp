'use client'

import { useEffect, useState } from 'react'
import { AlertCircle, Package } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { FoodProduct } from '@/types'

const NUTRISCORE_STYLES: Record<string, string> = {
  a: 'bg-green-600 text-white',
  b: 'bg-green-400 text-white',
  c: 'bg-yellow-400 text-[#16211B]',
  d: 'bg-orange-400 text-white',
  e: 'bg-red-500 text-white',
}

// Product-metadata lookups (name/brand/image/Nutri-Score, via Open Food
// Facts — see src/lib/kroger.ts) for your most-purchased items. Moved here
// from the old Deals page, and fetched client-side from the existing
// /api/deals route rather than as a server component, so it can live
// alongside the client-only Shopping page without splitting that page's
// server/client boundary.
export function ProductInfoPanel() {
  const [products, setProducts] = useState<FoodProduct[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/deals')
      .then((r) => r.json())
      .then((json: { data?: FoodProduct[]; error?: string }) => {
        if (cancelled) return
        if (json.data) setProducts(json.data)
        else setError(json.error ?? 'Failed to load product info')
      })
      .catch(() => {
        if (!cancelled) setError('Failed to load product info')
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (error) {
    return (
      <Card className="bg-white border-[rgba(19,43,34,0.10)] shadow-[0_2px_10px_rgba(19,43,34,0.05)]">
        <CardContent className="py-12 text-center">
          <AlertCircle className="h-8 w-8 mx-auto mb-3 text-[#EF4444]/60" />
          <p className="text-sm text-[#132B22]/45">{error}</p>
        </CardContent>
      </Card>
    )
  }

  if (products === null) {
    return (
      <Card className="bg-white border-[rgba(19,43,34,0.10)] shadow-[0_2px_10px_rgba(19,43,34,0.05)]">
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-[rgba(19,43,34,0.10)] p-4 space-y-3">
                <Skeleton className="h-20 w-full rounded-lg" />
                <div className="space-y-1.5">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-4 w-full" />
                </div>
                <Skeleton className="h-5 w-24" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (products.length === 0) {
    return (
      <Card className="bg-white border-[rgba(19,43,34,0.10)] shadow-[0_2px_10px_rgba(19,43,34,0.05)]">
        <CardContent className="py-12 text-center">
          <Package className="h-8 w-8 mx-auto mb-3 text-[#132B22]/20" />
          <p className="text-sm text-[#132B22]/45">No product info yet</p>
          <p className="text-xs text-[#132B22]/30 mt-1">
            Keep logging purchases — product matches improve with more data
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white border-[rgba(19,43,34,0.10)] shadow-[0_2px_10px_rgba(19,43,34,0.05)]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base text-[#132B22]">Your Items</CardTitle>
          <span className="text-xs text-[#132B22]/40">{products.length} matched</span>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
    ? NUTRISCORE_STYLES[product.nutriscoreGrade] ?? 'bg-[#EFE7D6] text-[#3a473e]'
    : null

  return (
    <div className="rounded-xl border border-[rgba(19,43,34,0.10)] bg-white p-4 flex flex-col gap-3">
      {/* Product image */}
      {product.imageUrl && (
        <div className="h-20 w-full flex items-center justify-center rounded-lg bg-[#F7F2E7] overflow-hidden">
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
        <p className="text-xs font-medium text-[#132B22]/45 uppercase tracking-wide truncate">
          {product.item}
        </p>
        <p className="text-sm font-semibold text-[#132B22] leading-snug mt-0.5 line-clamp-2">
          {product.productName}
        </p>
        {product.brand && (
          <p className="text-xs text-[#132B22]/50 mt-0.5">{product.brand}</p>
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
        <p className="text-[10px] text-[#132B22]/30">Open Food Facts</p>
      </div>
    </div>
  )
}
