'use client'

import { useEffect, useMemo, useState } from 'react'
import { Loader2, AlertCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { CartResultView, NoListToPrice } from '@/components/shared/CartResultView'
import { toCartRequestItems } from '@/lib/cartRequest'
import type { CartBuilderResult, ShoppingItem } from '@/types'

// Prices whatever's actually on the shopper's current list right now —
// passed in directly from the Shopping page's live `items` state — against
// crowdsourced price sightings, building two totals: one store vs. a mixed
// cart split across whichever stores are cheapest per item.
//
// This used to read the "Save list for next shopping" localStorage
// snapshot instead, falling back to a separate API fetch. That snapshot
// only updates when someone explicitly clicks Save, so it silently goes
// stale the moment an item is added or removed without hitting that
// button — which is exactly what made this card show a different, smaller
// item list than the rest of the page. The on-screen list is now the only
// source of truth, so this card always matches what's actually visible
// above it.
export function CartBuilder({ items }: { items: ShoppingItem[] }) {
  const requestItems = useMemo(() => toCartRequestItems(items), [items])
  const [result, setResult] = useState<CartBuilderResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(requestItems.length > 0)

  useEffect(() => {
    if (requestItems.length === 0) return

    let cancelled = false
    fetch('/api/deals/cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: requestItems }),
    })
      .then((r) => r.json())
      .then((json: { data?: CartBuilderResult; error?: string }) => {
        if (cancelled) return
        if (json.data) setResult(json.data)
        else setError(json.error ?? 'Failed to build cart')
      })
      .catch(() => {
        if (!cancelled) setError('Failed to build cart')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [requestItems])

  if (requestItems.length === 0) return <NoListToPrice />

  if (loading) {
    return (
      <Card className="bg-white border-[rgba(19,43,34,0.10)] shadow-[0_2px_10px_rgba(19,43,34,0.05)]">
        <CardContent className="py-16 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-[#132B22]" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="bg-white border-[rgba(19,43,34,0.10)] shadow-[0_2px_10px_rgba(19,43,34,0.05)]">
        <CardContent className="py-16 text-center">
          <AlertCircle className="h-8 w-8 mx-auto mb-3 text-[#EF4444]/60" />
          <p className="text-sm text-[#132B22]/45">{error}</p>
        </CardContent>
      </Card>
    )
  }

  if (!result) return null

  return <CartResultView result={result} />
}
