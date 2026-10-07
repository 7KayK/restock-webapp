'use client'

import Link from 'next/link'
import { ShoppingCart, Store, Split } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { formatPrice } from '@/lib/currency'
import type { CartBuilderResult } from '@/types'

// Shared rendering for a cart-builder result — used by the Deals page's
// always-on Cart Builder and by the Shopping page's on-demand "Find prices
// near me" search, so both stay visually and behaviorally identical.
export function CartResultView({ result }: { result: CartBuilderResult }) {
  const hasAnyPrices = result.byStore.length > 0 || result.mixed.length > 0

  if (!hasAnyPrices) {
    return (
      <Card className="bg-white border-[rgba(19,43,34,0.10)] shadow-[0_2px_10px_rgba(19,43,34,0.05)]">
        <CardContent className="py-12 text-center space-y-2">
          <ShoppingCart className="h-8 w-8 mx-auto text-[#132B22]/20" />
          <p className="text-sm text-[#132B22]/60">No prices found for this list yet.</p>
          <div className="text-left max-w-sm mx-auto pt-2">
            <CartNotes result={result} />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {result.mixed.map((cart) => (
        <Card key={cart.currency} className="bg-white border-[rgba(19,43,34,0.10)] shadow-[0_2px_10px_rgba(19,43,34,0.05)]">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Split className="h-4 w-4 text-[#132B22]" />
                <CardTitle className="text-base">Cheapest, mixed across stores</CardTitle>
              </div>
              <span className="text-lg font-semibold text-[#132B22]">{formatPrice(cart.total, cart.currency)}</span>
            </div>
            <CardDescription>
              Buying each item at whichever reported store has it cheapest.
              {cart.missing.length > 0 && ` ${cart.missing.length} item${cart.missing.length === 1 ? '' : 's'} not priced yet.`}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <ul className="divide-y divide-[rgba(19,43,34,0.08)]">
              {cart.items.map((it) => (
                <li key={it.name} className="flex items-center justify-between py-1.5 text-sm">
                  <span className="text-[#132B22]/80">
                    <span className="capitalize">{it.name}</span>
                    {it.quantity > 1 && <span className="text-[#132B22]/40"> ×{it.quantity}</span>}
                  </span>
                  {it.price !== null ? (
                    <span className="flex items-center gap-2 text-[#132B22]">
                      <span className="text-xs text-[#132B22]/40">{it.storeName}</span>
                      <span className="font-medium">{formatPrice(it.price, cart.currency)}</span>
                    </span>
                  ) : (
                    <span className="text-xs text-[#132B22]/35">no price yet</span>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ))}

      {result.byStore.length > 0 && (
        <Card className="bg-white border-[rgba(19,43,34,0.10)] shadow-[0_2px_10px_rgba(19,43,34,0.05)]">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Store className="h-4 w-4 text-[#132B22]" />
              <CardTitle className="text-base">Buy it all from one store</CardTitle>
            </div>
            <CardDescription>Ranked by how much of your list each store covers, then price.</CardDescription>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            {result.byStore.map((store) => (
              <div
                key={`${store.storePlaceId ?? store.storeName}-${store.currency}`}
                className="rounded-xl border border-[rgba(19,43,34,0.10)] p-3"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-[#132B22]">{store.storeName}</p>
                  <span className="text-sm font-semibold text-[#132B22]">
                    {formatPrice(store.total, store.currency)}
                  </span>
                </div>
                <p className="text-xs text-[#132B22]/45 mt-0.5">
                  Covers {store.coveredCount} of {store.totalItems} items
                  {store.coveredCount < store.totalItems &&
                    ` — missing ${store.items.filter((it) => it.price === null).map((it) => it.name).join(', ')}`}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <CartNotes result={result} />
    </div>
  )
}

// Small empty-state used when there's no list to price yet.
export function NoListToPrice() {
  return (
    <Card className="bg-white border-[rgba(19,43,34,0.10)] shadow-[0_2px_10px_rgba(19,43,34,0.05)]">
      <CardContent className="py-12 text-center space-y-3">
        <ShoppingCart className="h-8 w-8 mx-auto text-[#132B22]/20" />
        <p className="text-sm text-[#132B22]/45">Add a few items to your list first, then search for prices.</p>
        <Link href="/dashboard/shopping" className="text-xs text-[#132B22] underline">
          Go to Shopping list
        </Link>
      </CardContent>
    </Card>
  )
}

// Explains, line by line, why a list item has no price — and flags any
// price that came from a similar-but-not-identical report name — so the
// cart never fails silently. Used in both the empty and populated states.
function CartNotes({ result }: { result: CartBuilderResult }) {
  const similar = result.similarMatches ?? []
  if (result.unpriced.length === 0 && similar.length === 0) return null

  return (
    <div className="text-xs text-[#132B22]/50 px-1 space-y-2">
      {similar.length > 0 && (
        <div className="space-y-0.5">
          <p className="font-medium text-[#132B22]/60">Priced from a similar item:</p>
          <ul className="space-y-0.5">
            {similar.map((m) => (
              <li key={m.listItem}>
                <span className="capitalize">{m.listItem}</span>
                <span className="text-[#132B22]/35"> — using reports for &ldquo;{m.reportedAs}&rdquo;</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {result.unpriced.length > 0 && (
        <div className="space-y-1">
          <p className="font-medium text-[#132B22]/60">No price for these items yet:</p>
          <ul className="space-y-0.5">
            {result.unpriced.map((name) => {
              const reason = result.unpricedReasons?.[name]
              return (
                <li key={name}>
                  <span className="capitalize">{name}</span>
                  <span className="text-[#132B22]/35">
                    {reason === 'stale'
                      ? ' — only old reports (over 3 weeks), please re-check the price'
                      : reason === 'unit-mismatch'
                        ? ' — reports use a different unit than your list (e.g. litres vs count)'
                        : ' — nobody has reported a price yet'}
                  </span>
                </li>
              )
            })}
          </ul>
          <p className="text-[#132B22]/35">
            Tap an item on your list to report what you saw it for — every report helps the next shopper.
          </p>
        </div>
      )}
    </div>
  )
}
