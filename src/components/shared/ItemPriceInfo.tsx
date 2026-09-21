'use client'

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Tag, Loader2, Plus, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatPrice, SUPPORTED_CURRENCIES } from '@/lib/currency'
import type { PriceSighting } from '@/types'

// Inline "known prices for this item" panel used on the Shopping list.
// Shows crowdsourced sightings (cheapest first) and lets the shopper add
// their own — "I saw this here for $X" — right from the list, since that's
// when they actually have the price in front of them.
export function ItemPriceInfo({ itemName, initialPrices }: { itemName: string; initialPrices?: PriceSighting[] }) {
  const [expanded, setExpanded] = useState(false)
  const [sightings, setSightings] = useState<PriceSighting[] | null>(initialPrices ?? null)
  const [loading, setLoading] = useState(false)
  const [formOpen, setFormOpen] = useState(false)

  function toggle() {
    const next = !expanded
    setExpanded(next)
    if (next) refresh()
  }

  async function refresh() {
    setLoading(true)
    try {
      const res = await fetch(`/api/price-sightings?item=${encodeURIComponent(itemName)}`)
      const json = (await res.json()) as { data?: PriceSighting[] }
      setSightings(json.data ?? [])
    } catch {
      // leave existing sightings in place on a failed refresh
    } finally {
      setLoading(false)
    }
  }

  const cheapest = (initialPrices ?? sightings)?.[0]

  return (
    <div className="mt-1">
      <button
        onClick={toggle}
        className="inline-flex items-center gap-1 text-[10px] font-medium text-[#132B22]/50 hover:text-[#132B22] transition-colors"
      >
        <Tag className="h-2.5 w-2.5" />
        {cheapest ? `from ${formatPrice(cheapest.price, cheapest.currency)}` : 'No prices yet'}
        {expanded ? <ChevronUp className="h-2.5 w-2.5" /> : <ChevronDown className="h-2.5 w-2.5" />}
      </button>

      {expanded && (
        <div className="mt-1.5 rounded-lg border border-[rgba(19,43,34,0.10)] bg-[#F7F2E7]/60 p-2.5 space-y-2">
          {loading ? (
            <div className="flex items-center gap-1.5 text-xs text-[#132B22]/45 py-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              Loading prices…
            </div>
          ) : sightings && sightings.length > 0 ? (
            <ul className="space-y-1">
              {sightings.slice(0, 5).map((s) => (
                <li key={s.id} className="flex items-center justify-between text-xs">
                  <span className="text-[#132B22]/70 truncate pr-2">{s.storeName}</span>
                  <span className="flex items-center gap-1.5 shrink-0">
                    <span className="font-medium text-[#132B22]">{formatPrice(s.price, s.currency)}</span>
                    <span className="text-[10px] text-[#132B22]/35">
                      {formatDistanceToNow(new Date(s.createdAt), { addSuffix: true })}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-[#132B22]/45">
              Nobody&apos;s reported a price for this yet — be the first.
            </p>
          )}

          {formOpen ? (
            <ReportPriceForm
              itemName={itemName}
              onSaved={(s) => {
                setSightings((prev) => [s, ...(prev ?? [])].sort((a, b) => a.price - b.price))
                setFormOpen(false)
              }}
              onCancel={() => setFormOpen(false)}
            />
          ) : (
            <button
              onClick={() => setFormOpen(true)}
              className="inline-flex items-center gap-1 text-xs font-medium text-[#132B22] hover:underline"
            >
              <Plus className="h-3 w-3" />
              I saw this here for…
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function ReportPriceForm({
  itemName,
  onSaved,
  onCancel,
}: {
  itemName: string
  onSaved: (s: PriceSighting) => void
  onCancel: () => void
}) {
  const [storeName, setStoreName] = useState('')
  const [price, setPrice] = useState('')
  const [currency, setCurrency] = useState('')
  const [unit, setUnit] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    const priceNum = parseFloat(price)
    if (!storeName.trim()) return setError('Store name is required')
    if (!Number.isFinite(priceNum) || priceNum <= 0) return setError('Enter a valid price')
    if (!currency) return setError('Pick a currency')

    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/price-sightings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item: itemName,
          storeName: storeName.trim(),
          price: priceNum,
          currency,
          unit: unit.trim() || undefined,
        }),
      })
      const json = (await res.json()) as { data?: PriceSighting; error?: string }
      if (!res.ok || !json.data) throw new Error(json.error ?? 'Failed to save price')
      onSaved(json.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save price')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-1.5 pt-1 border-t border-[rgba(19,43,34,0.10)]">
      <div className="grid grid-cols-2 gap-1.5">
        <Input
          placeholder="Store (e.g. Walmart)"
          value={storeName}
          onChange={(e) => setStoreName(e.target.value)}
          className="h-7 text-xs"
        />
        <div className="flex gap-1.5">
          <Input
            type="number"
            min="0"
            step="0.01"
            placeholder="Price"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="h-7 text-xs"
          />
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="h-7 rounded-md border border-input bg-transparent px-1.5 text-xs text-[#132B22]"
          >
            <option value="">Currency</option>
            {SUPPORTED_CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code}
              </option>
            ))}
          </select>
        </div>
      </div>
      <Input
        placeholder="Unit (optional, e.g. 1L, 500g)"
        value={unit}
        onChange={(e) => setUnit(e.target.value)}
        className="h-7 text-xs"
      />
      {error && <p className="text-[10px] text-[#EF4444]">{error}</p>}
      <div className="flex gap-1.5">
        <Button
          size="sm"
          onClick={submit}
          disabled={saving}
          className="h-6 px-2 text-[11px] bg-[#132B22] hover:bg-[#132B22]/90 text-white"
        >
          {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Save'}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onCancel}
          disabled={saving}
          className="h-6 px-2 text-[11px] text-[#132B22]/50"
        >
          Cancel
        </Button>
      </div>
    </div>
  )
}
