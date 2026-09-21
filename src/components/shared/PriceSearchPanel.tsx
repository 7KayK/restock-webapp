'use client'

import { useCallback, useEffect, useState } from 'react'
import { Loader2, AlertCircle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CartResultView } from '@/components/shared/CartResultView'
import type { CartBuilderResult, CartRequestItem } from '@/types'

// On-demand "search now" companion to the Deals page's always-on Cart
// Builder — triggered right from the Shopping list with whatever's on it
// at that moment (no need to save the list first). The parent only ever
// passes a new `itemNames` reference when the shopper explicitly re-runs
// the search, so this effect fires once per search, not on every keystroke
// elsewhere on the page. Items carry quantity and unit so totals reflect how
// much is being bought, not just which items.
export function PriceSearchPanel({ items, onClose }: { items: CartRequestItem[]; onClose: () => void }) {
  const [result, setResult] = useState<CartBuilderResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Pure fetch — no synchronous setState at the top, so the mount/refresh
  // effect below can call it directly without tripping the "no setState in
  // effect" rule. All state writes happen inside the async .then()/.catch()
  // chain, which the linter treats as deferred, not part of the render pass.
  const fetchPrices = useCallback(() => {
    return fetch('/api/deals/cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    })
      .then((r) => r.json())
      .then((json: { data?: CartBuilderResult; error?: string }) => {
        if (json.data) setResult(json.data)
        else setError(json.error ?? 'Failed to search prices')
      })
      .catch(() => setError('Failed to search prices'))
      .finally(() => setLoading(false))
  }, [items])

  useEffect(() => {
    fetchPrices()
  }, [fetchPrices])

  // Explicit "Search again" handler — this runs from a click, not an
  // effect, so resetting loading/error synchronously here is fine.
  const searchAgain = useCallback(() => {
    setLoading(true)
    setError(null)
    fetchPrices()
  }, [fetchPrices])

  return (
    <div className="rounded-xl border border-[rgba(19,43,34,0.10)] bg-[#F7F2E7]/50 p-3 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-[#132B22]">Prices near you</p>
        <button
          onClick={onClose}
          className="p-1 rounded text-[#132B22]/40 hover:text-[#132B22] hover:bg-[#132B22]/5 transition-colors"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-[#132B22]" />
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 text-sm text-[#132B22]/45 py-4 justify-center">
          <AlertCircle className="h-4 w-4 text-[#EF4444]/60" />
          {error}
        </div>
      ) : result ? (
        <CartResultView result={result} />
      ) : null}

      <Button
        variant="outline"
        size="sm"
        onClick={searchAgain}
        disabled={loading}
        className="w-full text-[#132B22] border-[#132B22]/20"
      >
        Search again
      </Button>
    </div>
  )
}
