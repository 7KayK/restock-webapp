'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { Playfair_Display } from 'next/font/google'
import {
  MapPin, CalendarDays, Camera, Keyboard, Search,
  Plus, X, Check, Loader2, Bell, Sparkles, ArrowLeft, Bookmark, BookmarkCheck, Warehouse,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { ImageIntelligence } from '@/components/shared/ImageIntelligence'
import { ItemPriceInfo } from '@/components/shared/ItemPriceInfo'
import { PriceSearchPanel } from '@/components/shared/PriceSearchPanel'
import { CartBuilder } from '@/components/shared/CartBuilder'
import { TripPlanner } from '@/components/shared/TripPlanner'
import { ProductInfoPanel } from '@/components/shared/ProductInfoPanel'
import { ProductSearchPanel } from '@/components/shared/ProductSearchPanel'
import { toCartRequestItems } from '@/lib/cartRequest'
import type { CartRequestItem, ShoppingItem } from '@/types'

const playfair = Playfair_Display({ subsets: ['latin'] })

interface ListItem extends ShoppingItem {
  _id: string
  _done: boolean
  _editingName: boolean
  _editingQty: boolean
}

function buildCalendarUrl(names: string[]): string {
  const today = new Date()
  const tomorrow = new Date(today.getTime() + 86_400_000)
  const pad = (n: number) => String(n).padStart(2, '0')
  const fmt = (d: Date) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`
  const title   = encodeURIComponent('Restock Shopping Trip')
  const dates   = `${fmt(today)}/${fmt(tomorrow)}`
  const details = encodeURIComponent(
    names.length
      ? `Items to buy:\n${names.map((n) => `• ${n}`).join('\n')}\n\nCreated by Restock.`
      : 'Created by Restock.'
  )
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}`
}

let _idCounter = 0
function uid() { return `item-${++_idCounter}` }

function toListItems(raw: ShoppingItem[]): ListItem[] {
  return raw.map((it) => ({
    ...it,
    _id: uid(),
    _done: it.done ?? false,
    _editingName: false,
    _editingQty: false,
  }))
}

// What the list PUT sends per row (the on-screen-only _-fields stay behind).
type SavedRow = Pick<ShoppingItem, 'name' | 'quantity' | 'unit' | 'category' | 'source' | 'reminderId' | 'reason'> & { done: boolean }

type SyncIssue = 'failed' | 'conflict' | 'load-failed'
const SYNC_MESSAGES: Record<SyncIssue, string> = {
  'failed':      "Couldn't sync your list — your changes are still here, and we'll retry on your next edit.",
  'conflict':    'This list was changed on another device, so we loaded the latest version. Your last edit here was not saved.',
  'load-failed': "Couldn't load your saved list, so changes here won't be saved. Reload the page to try again.",
}

const SOURCE_LABELS: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  reminder:  { label: 'Reminder',  icon: Bell,       color: 'text-[#132B22] bg-[#132B22]/10' },
  predicted: { label: 'Predicted', icon: Sparkles,   color: 'text-purple-600 bg-purple-50' },
  manual:    { label: 'Added',     icon: Plus,       color: 'text-[#5b6a5d] bg-[#EFE7D6]' },
  pantry:    { label: 'Pantry',    icon: Warehouse,  color: 'text-[#21834E] bg-[#21834E]/10' },
}

export default function ShoppingPage() {
  const [items, setItems]           = useState<ListItem[]>([])
  const [loading, setLoading]       = useState(true)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [addInput, setAddInput]     = useState('')
  const [phase, setPhase]           = useState<'building' | 'shopping'>('building')
  const [showDone, setShowDone]     = useState(false)
  const [completing, setCompleting] = useState(false)
  const [scanOpen, setScanOpen]     = useState(false)
  const [savedToast, setSavedToast] = useState(false)
  const [priceSearch, setPriceSearch] = useState<CartRequestItem[] | null>(null)
  const addRef = useRef<HTMLInputElement>(null)
  // Set once the initial load below finishes, so the sync effect further
  // down doesn't immediately write the just-loaded list straight back.
  const hasHydratedRef = useRef(false)
  // Save queue state — see flushSaves below.
  const saveInFlightRef = useRef<Promise<void> | null>(null)
  const pendingSaveRef = useRef<SavedRow[] | null>(null)
  // The list revision this tab last saw from the server; sent with every
  // save so a stale tab is rejected instead of overwriting another device.
  const revisionRef = useRef<number | null>(null)
  const [syncIssue, setSyncIssue] = useState<SyncIssue | null>(null)

  // Load the shopper's persisted list on mount. /api/shopping/list now
  // returns their actual saved list (seeding it from smart suggestions only
  // the first time it's empty) rather than recomputing suggestions on every
  // request, so this always reflects whatever was left here last — see
  // src/app/api/shopping/list/route.ts.
  useEffect(() => {
    fetch('/api/shopping/list')
      .then((r) => r.json())
      .then((json) => {
        // Only start syncing once we know which revision we're editing. A
        // failed load must not fall through to saving, or the first edit
        // would replace the stored list with just that edit.
        if (typeof json.data?.revision === 'number') {
          revisionRef.current = json.data.revision
          hasHydratedRef.current = true
        } else {
          setSyncIssue('load-failed')
        }
        if (json.data?.items?.length) {
          const loaded = toListItems(json.data.items)
          setItems((prev) => (prev.length > 0 ? prev : loaded))
        }
      })
      .catch(() => setSyncIssue('load-failed'))
      .finally(() => setLoading(false))
  }, [])

  // Sync the list to the database whenever it changes, so adds/edits/
  // removes survive a reload or a switch to another device instead of only
  // living in this tab's memory. Debounced, and skipped until the initial
  // load above finishes.
  //
  // Saves are single-flight: at most one PUT is ever on the wire, and edits
  // that arrive meanwhile collapse into one pending snapshot that goes out
  // when the current request finishes. Without that, a slow older PUT could
  // land after a newer one and overwrite it with stale data.
  const flushSaves = useCallback(() => {
    if (saveInFlightRef.current) return // the running loop picks up the pending snapshot
    saveInFlightRef.current = (async () => {
      try {
        while (pendingSaveRef.current) {
          const rows = pendingSaveRef.current
          pendingSaveRef.current = null
          try {
            const r = await fetch('/api/shopping/list', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ items: rows, baseRevision: revisionRef.current }),
            })
            const json = (await r.json().catch(() => null)) as
              | { data?: { revision?: number; items?: ShoppingItem[] } }
              | null
            const revision = json?.data?.revision

            if (r.ok) {
              if (typeof revision === 'number') revisionRef.current = revision
              setSyncIssue(null)
            } else if (r.status === 409 && typeof revision === 'number' && json?.data?.items) {
              // Another device saved first. Show what's actually stored, and
              // drop any queued snapshot — it was built on the stale list.
              revisionRef.current = revision
              pendingSaveRef.current = null
              setItems(toListItems(json.data.items))
              setSyncIssue('conflict')
            } else {
              setSyncIssue('failed')
            }
          } catch {
            setSyncIssue('failed')
          }
        }
      } finally {
        saveInFlightRef.current = null
      }
    })()
  }, [])

  useEffect(() => {
    if (!hasHydratedRef.current) return
    const timeout = setTimeout(() => {
      pendingSaveRef.current = items.map((it) => ({
        name: it.name,
        quantity: it.quantity,
        unit: it.unit,
        category: it.category,
        source: it.source,
        reminderId: it.reminderId,
        reason: it.reason ?? null,
        done: it._done,
      }))
      flushSaves()
    }, 600)
    return () => clearTimeout(timeout)
  }, [items, flushSaves])

  function addItem() {
    const name = addInput.trim().toLowerCase()
    if (!name) return
    setItems((prev) => [
      ...prev,
      { name, quantity: 1, unit: null, category: null, source: 'manual', _id: uid(), _done: false, _editingName: false, _editingQty: false },
    ])
    setAddInput('')
    addRef.current?.focus()
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((it) => it._id !== id))
  }

  function toggleDone(id: string) {
    setItems((prev) => prev.map((it) => it._id === id ? { ...it, _done: !it._done } : it))
  }

  function updateName(id: string, name: string) {
    setItems((prev) => prev.map((it) => it._id === id ? { ...it, name: name.toLowerCase(), _editingName: false } : it))
  }

  function updateQty(id: string, qty: number) {
    setItems((prev) => prev.map((it) => it._id === id ? { ...it, quantity: Math.max(1, qty), _editingQty: false } : it))
  }

  async function handleBuildFromHistory() {
    setLoadingHistory(true)
    try {
      // Let any save already on the wire land first, so it can't finish
      // after (and overwrite) the regenerated list.
      await saveInFlightRef.current
      const r = await fetch('/api/shopping/list?regenerate=1')
      const json = await r.json()
      // Regenerating rewrites the stored list server-side, which moves its
      // revision on — keep ours in step so the next save isn't rejected.
      if (typeof json.data?.revision === 'number') revisionRef.current = json.data.revision
      if (json.data?.items?.length) {
        setItems(toListItems(json.data.items))
      }
    } finally {
      setLoadingHistory(false)
    }
  }

  function saveListForLater() {
    try {
      const toSave = items.map(({ name, quantity, unit, category, source }) => ({ name, quantity, unit, category, source }))
      localStorage.setItem('restock-saved-list', JSON.stringify(toSave))
      setSavedToast(true)
      setTimeout(() => setSavedToast(false), 2500)
    } catch { /* ignore */ }
  }

  const activeItems = items.filter((it) => !it._done)
  const doneItems   = items.filter((it) => it._done)

  async function markAllComplete() {
    setCompleting(true)
    try {
      await fetch('/api/shopping/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          completed: items.map((it) => ({ name: it.name, reminderId: it.reminderId })),
        }),
      })
      window.location.href = '/dashboard/history'
    } catch {
      setCompleting(false)
    }
  }

  const calendarUrl = buildCalendarUrl(activeItems.map((it) => `${it.name} ×${it.quantity}`))

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-[#132B22]/50">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl md:text-2xl font-medium text-[#132B22] [font-family:var(--font-playfair)]">Shopping Trip</h1>
          <p className="text-sm text-[#132B22]/50 mt-0.5">
            {loading
              ? 'Building your smart list…'
              : phase === 'building'
                ? `${items.length} item${items.length !== 1 ? 's' : ''} — building list`
                : `${activeItems.length} item${activeItems.length !== 1 ? 's' : ''} left to buy`}
          </p>
        </div>
      </div>

      {/* Action row */}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" className="gap-1.5 border-[rgba(19,43,34,0.18)] text-[#132B22]/70" asChild>
          <Link href="/dashboard/stores">
            <MapPin className="h-3.5 w-3.5" />
            Nearest store
          </Link>
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 border-[rgba(19,43,34,0.18)] text-[#132B22]/70"
          onClick={() => window.open(calendarUrl, '_blank', 'noopener,noreferrer')}
          disabled={activeItems.length === 0}
        >
          <CalendarDays className="h-3.5 w-3.5" />
          Add to Calendar
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 border-[rgba(19,43,34,0.18)] text-[#132B22]/70"
          onClick={() => setPriceSearch(toCartRequestItems(activeItems))}
          disabled={activeItems.length === 0}
        >
          <Search className="h-3.5 w-3.5" />
          Find prices near me
        </Button>
      </div>

      {priceSearch && (
        <PriceSearchPanel items={priceSearch} onClose={() => setPriceSearch(null)} />
      )}

      {/* Always visible — unlike "Find prices near me" above (which only
          searches whatever's currently on the list), this is a real
          free-text product search that works with nothing on the list at
          all. See src/components/shared/ProductSearchPanel.tsx. */}
      <ProductSearchPanel />

      {/* List */}
      <Card className="bg-white border-[rgba(19,43,34,0.10)] shadow-[0_2px_10px_rgba(19,43,34,0.05)]">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-[#132B22]" />
            </div>
          ) : items.length === 0 ? (
            <div className="px-4 pt-6 pb-4 space-y-4">
              <p className={cn(playfair.className, 'text-[#132B22] leading-snug')} style={{ fontSize: '22px' }}>
                What do you need to pick up?
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-stretch">
                <EntryCard onClick={() => setScanOpen(true)}>
                  <Camera className="h-6 w-6 text-[#132B22]" />
                  <span className="text-sm font-semibold text-[#132B22]">Snap a list</span>
                  <span className="text-[11px] text-[#132B22]/50 leading-tight">Photo, screenshot or handwritten note</span>
                </EntryCard>
                <EntryCard onClick={() => addRef.current?.focus()}>
                  <Keyboard className="h-6 w-6 text-[#132B22]" />
                  <span className="text-sm font-semibold text-[#132B22]">Type it in</span>
                  <span className="text-[11px] text-[#132B22]/50 leading-tight">Add items one by one</span>
                </EntryCard>
                <EntryCard onClick={handleBuildFromHistory} disabled={loadingHistory}>
                  {loadingHistory
                    ? <Loader2 className="h-6 w-6 text-[#132B22] animate-spin" />
                    : <Sparkles className="h-6 w-6 text-[#132B22]" />}
                  <span className="text-sm font-semibold text-[#132B22]">Build from history</span>
                  <span className="text-[11px] text-[#132B22]/50 leading-tight">We&apos;ll suggest what you&apos;re running low on</span>
                </EntryCard>
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-[rgba(19,43,34,0.08)]">
              {activeItems.map((item) => (
                <ListRow
                  key={item._id}
                  item={item}
                  onToggle={toggleDone}
                  onRemove={removeItem}
                  onUpdateName={updateName}
                  onUpdateQty={updateQty}
                />
              ))}

              {doneItems.length > 0 && (
                <>
                  <li className="px-4 py-2 bg-[#F7F2E7]">
                    <p className="text-[10px] font-semibold text-[#132B22]/35 uppercase tracking-wider">
                      Done ({doneItems.length})
                    </p>
                  </li>
                  {doneItems.map((item) => (
                    <ListRow
                      key={item._id}
                      item={item}
                      onToggle={toggleDone}
                      onRemove={removeItem}
                      onUpdateName={updateName}
                      onUpdateQty={updateQty}
                    />
                  ))}
                </>
              )}
            </ul>
          )}

          {/* Add item row */}
          <div className="flex items-center gap-2 px-4 py-3 border-t border-[rgba(19,43,34,0.10)]">
            <Plus className="h-4 w-4 text-[#132B22]/25 shrink-0" />
            <Input
              ref={addRef}
              placeholder="Add an item…"
              value={addInput}
              onChange={(e) => setAddInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') addItem() }}
              className="border-0 p-0 h-9 md:h-8 text-base md:text-sm text-[#132B22] placeholder:text-[#132B22]/35 focus-visible:ring-0 bg-transparent"
            />
            {addInput.trim() && (
              <Button size="sm" className="bg-[#132B22] hover:bg-[#132B22]/90 text-white h-9 md:h-7 px-4 md:px-3" onClick={addItem}>
                Add
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {syncIssue && (
        <p role="alert" className={cn('text-xs', syncIssue === 'conflict' ? 'text-[#EAB308]' : 'text-[#EF4444]/80')}>
          {SYNC_MESSAGES[syncIssue]}
        </p>
      )}

      {/* Phase-aware bottom actions */}
      {items.length > 0 && (
        <div className="space-y-3">
          {phase === 'building' ? (
            <>
              <Button
                className="w-full bg-[#132B22] hover:bg-[#132B22]/90 text-white gap-2"
                onClick={() => setPhase('shopping')}
              >
                <Check className="h-4 w-4" />
                My list is ready — start shopping
              </Button>
              <Button
                variant="outline"
                className="w-full gap-2 border-[rgba(19,43,34,0.18)] text-[#132B22]/70"
                onClick={saveListForLater}
              >
                {savedToast
                  ? <><BookmarkCheck className="h-4 w-4 text-[#22C55E]" /><span className="text-[#22C55E]">List saved!</span></>
                  : <><Bookmark className="h-4 w-4" />Save list for next shopping</>
                }
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                className="w-full gap-2 border-[rgba(19,43,34,0.18)] text-[#132B22]/70"
                onClick={() => { setPhase('building'); setShowDone(false) }}
              >
                ← Edit list
              </Button>
              <Button
                className="w-full bg-[#132B22] hover:bg-[#132B22]/90 text-white gap-2"
                onClick={() => setShowDone((v) => !v)}
              >
                <Check className="h-4 w-4" />
                Done Shopping
              </Button>

              {showDone && (
                <Card className="bg-white border-[#132B22]/20 shadow-[0_2px_10px_rgba(19,43,34,0.05)]">
                  <CardContent className="p-4 space-y-3">
                    <p className="text-sm font-medium text-[#132B22]">How would you like to log this trip?</p>
                    <Button
                      className="w-full bg-[#132B22] hover:bg-[#132B22]/90 text-white gap-2"
                      onClick={() => { setShowDone(false); setScanOpen(true) }}
                    >
                      <Camera className="h-4 w-4" />
                      Scan receipt
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full gap-2 border-[rgba(19,43,34,0.18)] text-[#132B22]/70"
                      onClick={markAllComplete}
                      disabled={completing || items.length === 0}
                    >
                      {completing
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <Check className="h-4 w-4" />}
                      Mark as purchased (no receipt)
                    </Button>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      )}

      {/* Make a cart — pricing + product info, folded in from the old
          Deals page so it lives next to the list it's pricing. */}
      {items.length > 0 && (
        <div className="space-y-8 pt-2">
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-[#132B22]/70 uppercase tracking-wide">Make a cart</h2>
            <CartBuilder items={items} />
            <TripPlanner items={items} />
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-[#132B22]/70 uppercase tracking-wide">Product info</h2>
            <ProductInfoPanel />
          </section>
        </div>
      )}

      <ImageIntelligence
        open={scanOpen}
        onOpenChange={setScanOpen}
        onImport={() => {
          window.location.href = '/dashboard/history'
        }}
      />
    </div>
  )
}

interface ListRowProps {
  item: ListItem
  onToggle: (id: string) => void
  onRemove: (id: string) => void
  onUpdateName: (id: string, name: string) => void
  onUpdateQty: (id: string, qty: number) => void
}

function EntryCard({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="flex flex-col gap-2 rounded-lg bg-white p-4 pb-5 text-left cursor-pointer transition-colors disabled:opacity-60 w-full h-full"
      style={{
        border: `0.5px solid ${hovered ? '#132B22' : '#e3d9c4'}`,
        transition: 'border-color 150ms ease',
      }}
    >
      {children}
    </button>
  )
}

function ListRow({ item, onToggle, onRemove, onUpdateName, onUpdateQty }: ListRowProps) {
  const [nameVal, setNameVal] = useState(item.name)
  const [qtyVal, setQtyVal]   = useState(String(item.quantity))
  // Editing is tracked locally rather than by mutating `item._editingName` /
  // `item._editingQty` in place — React props/state are read-only, and
  // mutating them directly doesn't trigger a re-render (and trips
  // react-hooks/immutability). This also fixes the actual bug that came
  // with it: onUpdateName/onUpdateQty (called on blur/Enter) reset those
  // fields to false via a real setItems call, which raced ahead of the
  // mutation and meant the name/qty input never really stayed open.
  const [editingName, setEditingName] = useState(false)
  const [editingQty, setEditingQty] = useState(false)
  const src = SOURCE_LABELS[item.source] ?? SOURCE_LABELS.manual
  const SrcIcon = src.icon

  return (
    <li className={cn(
      'flex items-center gap-3 px-4 py-3 group transition-colors',
      item._done && 'opacity-50'
    )}>
      <button
        onClick={() => onToggle(item._id)}
        className={cn(
          'h-6 w-6 md:h-5 md:w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors',
          item._done
            ? 'border-[#22C55E] bg-[#22C55E]'
            : 'border-[rgba(19,43,34,0.18)] hover:border-[#132B22]'
        )}
        aria-label={item._done ? 'Mark as not done' : 'Mark as done'}
      >
        {item._done && <Check className="h-3 w-3 text-white" />}
      </button>

      <div className="flex-1 min-w-0">
        {editingName ? (
          <Input
            autoFocus
            value={nameVal}
            onChange={(e) => setNameVal(e.target.value)}
            onBlur={() => { onUpdateName(item._id, nameVal || item.name); setEditingName(false) }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { onUpdateName(item._id, nameVal || item.name); setEditingName(false) }
            }}
            className="h-9 md:h-7 text-base md:text-sm py-0 px-1 text-[#132B22]"
          />
        ) : (
          <span
            className={cn(
              'text-sm font-medium text-[#132B22] capitalize cursor-pointer hover:text-[#132B22] transition-colors',
              item._done && 'line-through'
            )}
            onClick={() => {
              setNameVal(item.name)
              setEditingName(true)
            }}
          >
            {item.name}
          </span>
        )}
        <div className="flex items-center gap-2 mt-0.5">
          <span className={`inline-flex items-center gap-1 text-[10px] font-medium rounded px-1.5 py-0.5 ${src.color}`}>
            <SrcIcon className="h-2.5 w-2.5" />
            {src.label}
          </span>
          {item.category && (
            <span className="text-[10px] text-[#132B22]/40">{item.category}</span>
          )}
        </div>
        {!item._done && item.reason && (
          <p className="text-[11px] text-[#132B22]/45 mt-0.5">{item.reason}</p>
        )}
        {!item._done && <ItemPriceInfo itemName={item.name} initialPrices={item.prices} />}
      </div>

      {/* Quantity */}
      {editingQty ? (
        <Input
          autoFocus
          type="number"
          min={1}
          value={qtyVal}
          onChange={(e) => setQtyVal(e.target.value)}
          onBlur={() => { onUpdateQty(item._id, parseInt(qtyVal) || 1); setEditingQty(false) }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { onUpdateQty(item._id, parseInt(qtyVal) || 1); setEditingQty(false) }
          }}
          className="h-9 md:h-7 w-16 md:w-14 text-base md:text-xs text-center text-[#132B22] p-0"
        />
      ) : (
        <button
          onClick={() => { setQtyVal(String(item.quantity)); setEditingQty(true) }}
          className="text-xs text-[#132B22]/50 hover:text-[#132B22] transition-colors min-w-[2.5rem] min-h-9 text-right px-1"
        >
          ×{item.quantity}{item.unit ? ` ${item.unit}` : ''}
        </button>
      )}

      <button
        onClick={() => onRemove(item._id)}
        className="p-2 -mr-2 rounded text-[#132B22]/40 md:text-[#132B22]/25 md:opacity-0 md:group-hover:opacity-100 hover:text-[#EF4444] hover:bg-[#EF4444]/8 transition-all shrink-0"
        aria-label={`Remove ${item.name}`}
      >
        <X className="h-4 w-4 md:h-3.5 md:w-3.5" />
      </button>
    </li>
  )
}
