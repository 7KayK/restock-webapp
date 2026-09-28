'use client'

import { useState, useCallback } from 'react'
import { Search, Loader2, AlertCircle, Store, Globe2, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { formatPrice } from '@/lib/currency'
import type { ProductSearchResult } from '@/types'

const NUTRISCORE_STYLES: Record<string, string> = {
  a: 'bg-green-600 text-white',
  b: 'bg-green-400 text-white',
  c: 'bg-yellow-400 text-[#16211B]',
  d: 'bg-orange-400 text-white',
  e: 'bg-red-500 text-white',
}

// A real free-text product search — "what does this cost, anywhere" —
// which Restock didn't have before this. Deliberately always visible on
// the Shopping page, not gated behind having a list already, since the gap
// this closes (searching "tortilla wraps" cold and getting nothing) had
// nothing to do with what was on anyone's list. See
// src/app/api/product-search/route.ts for what each of the three result
// groups below actually is and why they're kept separate rather than
// blended into one number.
export function ProductSearchPanel() {
  const [query, setQuery] = useState('')
  const [result, setResult] = useState<ProductSearchResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const runSearch = useCallback(() => {
    const q = query.trim()
    if (!q) return
    setLoading(true)
    setError(null)
    fetch(`/api/product-search?q=${encodeURIComponent(q)}`)
      .then((r) => r.json())
      .then((json: { data?: ProductSearchResult; error?: string }) => {
        if (json.data) setResult(json.data)
        else setError(json.error ?? 'Search failed')
      })
      .catch(() => setError('Search failed'))
      .finally(() => setLoading(false))
  }, [query])

  const hasSearched = result !== null
  const hasAnyResults =
    !!result && (result.restockReports.length > 0 || result.communityPrices.length > 0 || result.products.length > 0)

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold text-[#132B22]/70 uppercase tracking-wide">Search products</h2>

      <div className="flex items-center gap-2">
        <Input
          placeholder="Search any product… e.g. tortilla wraps"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') runSearch() }}
          className="h-9 text-sm text-[#132B22]"
        />
        <Button
          size="sm"
          onClick={runSearch}
          disabled={loading || !query.trim()}
          className="bg-[#132B22] hover:bg-[#132B22]/90 text-white h-9 gap-1.5 shrink-0"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
          Search
        </Button>
      </div>

      {error && (
        <Card className="bg-white border-[rgba(19,43,34,0.10)] shadow-[0_2px_10px_rgba(19,43,34,0.05)]">
          <CardContent className="py-6 text-center flex items-center justify-center gap-2 text-sm text-[#132B22]/45">
            <AlertCircle className="h-4 w-4 text-[#EF4444]/60" />
            {error}
          </CardContent>
        </Card>
      )}

      {hasSearched && !error && !hasAnyResults && (
        <Card className="bg-white border-[rgba(19,43,34,0.10)] shadow-[0_2px_10px_rgba(19,43,34,0.05)]">
          <CardContent className="py-10 text-center space-y-1.5">
            <Package className="h-7 w-7 mx-auto text-[#132B22]/20" />
            <p className="text-sm text-[#132B22]/45">Nothing found for &ldquo;{result?.query}&rdquo;.</p>
            <p className="text-xs text-[#132B22]/30">
              Try a shorter or more generic term, or report a price yourself to get it started.
            </p>
          </CardContent>
        </Card>
      )}

      {hasSearched && hasAnyResults && (
        <div className="space-y-4">
          {result!.restockReports.length > 0 && (
            <Card className="bg-white border-[rgba(19,43,34,0.10)] shadow-[0_2px_10px_rgba(19,43,34,0.05)]">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Store className="h-4 w-4 text-[#132B22]" />
                  <CardTitle className="text-base">Reported on Restock</CardTitle>
                </div>
                <CardDescription>Prices other Restock shoppers (or your own receipts) have reported.</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="divide-y divide-[rgba(19,43,34,0.08)]">
                  {result!.restockReports.slice(0, 8).map((s) => (
                    <li key={s.id} className="flex items-center justify-between py-1.5 text-sm">
                      <span className="text-[#132B22]/80 capitalize">{s.item}</span>
                      <span className="flex items-center gap-2 text-[#132B22]">
                        <span className="text-xs text-[#132B22]/40">{s.storeName}</span>
                        <span className="font-medium">{formatPrice(s.price, s.currency)}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {result!.communityPrices.length > 0 && (
            <Card className="bg-white border-[rgba(19,43,34,0.10)] shadow-[0_2px_10px_rgba(19,43,34,0.05)]">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Globe2 className="h-4 w-4 text-[#132B22]" />
                  <CardTitle className="text-base">Reported globally (Open Prices)</CardTitle>
                </div>
                <CardDescription>
                  From the Open Food Facts community — not necessarily reported near you, and not a live in-store price.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="divide-y divide-[rgba(19,43,34,0.08)]">
                  {result!.communityPrices.slice(0, 8).map((p, i) => (
                    <li key={i} className="flex items-center justify-between py-1.5 text-sm gap-3">
                      <span className="text-[#132B22]/80 min-w-0 truncate">
                        {p.productName}{p.brand && <span className="text-[#132B22]/40"> · {p.brand}</span>}
                      </span>
                      <span className="flex items-center gap-2 text-[#132B22] shrink-0">
                        {p.locationLabel && (
                          <span className="text-xs text-[#132B22]/40 max-w-[10rem] truncate">{p.locationLabel}</span>
                        )}
                        <span className="font-medium">{formatPrice(p.price, p.currency)}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {result!.products.length > 0 && (
            <Card className="bg-white border-[rgba(19,43,34,0.10)] shadow-[0_2px_10px_rgba(19,43,34,0.05)]">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Matching products</CardTitle>
                <CardDescription>Product info only — no price data reported yet for these.</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {result!.products.slice(0, 6).map((product, i) => {
                    const nutriStyle = product.nutriscoreGrade
                      ? NUTRISCORE_STYLES[product.nutriscoreGrade] ?? 'bg-[#EFE7D6] text-[#3a473e]'
                      : null
                    return (
                      <div key={product.code ?? i} className="rounded-xl border border-[rgba(19,43,34,0.10)] bg-white p-4 flex flex-col gap-3">
                        {product.imageUrl && (
                          <div className="h-20 w-full flex items-center justify-center rounded-lg bg-[#F7F2E7] overflow-hidden">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={product.imageUrl} alt={product.productName} className="max-h-full max-w-full object-contain" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-[#132B22] leading-snug line-clamp-2">{product.productName}</p>
                          {product.brand && <p className="text-xs text-[#132B22]/50 mt-0.5">{product.brand}</p>}
                        </div>
                        <div className="flex items-center justify-between mt-auto">
                          {nutriStyle ? (
                            <span className={`text-[10px] font-bold rounded px-1.5 py-0.5 uppercase tracking-wide ${nutriStyle}`}>
                              Nutri-Score {product.nutriscoreGrade!.toUpperCase()}
                            </span>
                          ) : <span />}
                          <p className="text-[10px] text-[#132B22]/30">Open Food Facts</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </section>
  )
}
