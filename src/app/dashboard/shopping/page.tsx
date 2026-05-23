'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Playfair_Display } from 'next/font/google'
import {
  MapPin, Tag, CalendarDays, Camera, Keyboard,
  Plus, X, Check, Loader2, Bell, Sparkles, ArrowLeft,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { ImageIntelligence } from '@/components/shared/ImageIntelligence'
import type { ShoppingItem, Purchase } from '@/types'

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

const SOURCE_LABELS: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  reminder:  { label: 'Reminder',  icon: Bell,     color: 'text-[#0F7B6C] bg-[#0F7B6C]/10' },
  predicted: { label: 'Predicted', icon: Sparkles, color: 'text-purple-600 bg-purple-50' },
  manual:    { label: 'Added',     icon: Plus,     color: 'text-gray-500 bg-gray-100' },
}

export default function ShoppingPage() {
  const [items, setItems]           = useState<ListItem[]>([])
  const [loading, setLoading]       = useState(true)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [addInput, setAddInput]     = useState('')
  const [showDone, setShowDone]     = useState(false)
  const [completing, setCompleting] = useState(false)
  const [scanOpen, setScanOpen]     = useState(false)
  const addRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/shopping/list')
      .then((r) => r.json())
      .then((json) => {
        if (json.data?.items) {
          setItems(json.data.items.map((it: ShoppingItem) => ({
            ...it,
            _id: uid(),
            _done: false,
            _editingName: false,
            _editingQty: false,
          })))
        }
      })
      .finally(() => setLoading(false))
  }, [])

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
      const r = await fetch('/api/shopping/list')
      const json = await r.json()
      if (json.data?.items?.length) {
        setItems(json.data.items.map((it: ShoppingItem) => ({
          ...it,
          _id: uid(),
          _done: false,
          _editingName: false,
          _editingQty: false,
        })))
      }
    } finally {
      setLoadingHistory(false)
    }
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
          <Button variant="ghost" size="icon" className="h-8 w-8 text-[#1B3A5C]/50">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#1B3A5C]">Shopping Trip</h1>
          <p className="text-sm text-[#1B3A5C]/50 mt-0.5">
            {loading ? 'Building your smart list…' : `${activeItems.length} item${activeItems.length !== 1 ? 's' : ''} to buy`}
          </p>
        </div>
      </div>

      {/* Action row */}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" className="gap-1.5 border-gray-200 text-[#1B3A5C]/70" asChild>
          <Link href="/dashboard/stores">
            <MapPin className="h-3.5 w-3.5" />
            Nearest store
          </Link>
        </Button>
        <Button variant="outline" size="sm" className="gap-1.5 border-gray-200 text-[#1B3A5C]/70" asChild>
          <Link href="/dashboard/deals">
            <Tag className="h-3.5 w-3.5" />
            See deals
          </Link>
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 border-gray-200 text-[#1B3A5C]/70"
          onClick={() => window.open(calendarUrl, '_blank', 'noopener,noreferrer')}
          disabled={activeItems.length === 0}
        >
          <CalendarDays className="h-3.5 w-3.5" />
          Add to Calendar
        </Button>
      </div>

      {/* List */}
      <Card className="bg-white border-gray-100 shadow-none">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-[#0F7B6C]" />
            </div>
          ) : items.length === 0 ? (
            <div className="px-4 pt-6 pb-4 space-y-4">
              <p className={cn(playfair.className, 'text-[#1B3A5C] leading-snug')} style={{ fontSize: '22px' }}>
                What do you need to pick up?
              </p>
              <div className="grid grid-cols-3 gap-3">
                <EntryCard onClick={() => setScanOpen(true)}>
                  <Camera className="h-5 w-5 text-[#0F7B6C]" />
                  <span className="text-sm font-semibold text-[#1B3A5C]">📷 Snap a list</span>
                  <span className="text-[11px] text-[#1B3A5C]/50 leading-tight">Photo, screenshot or handwritten note</span>
                </EntryCard>
                <EntryCard onClick={() => addRef.current?.focus()}>
                  <Keyboard className="h-5 w-5 text-[#0F7B6C]" />
                  <span className="text-sm font-semibold text-[#1B3A5C]">⌨️ Type it in</span>
                  <span className="text-[11px] text-[#1B3A5C]/50 leading-tight">Add items one by one</span>
                </EntryCard>
                <EntryCard onClick={handleBuildFromHistory} disabled={loadingHistory}>
                  {loadingHistory
                    ? <Loader2 className="h-5 w-5 text-[#0F7B6C] animate-spin" />
                    : <Sparkles className="h-5 w-5 text-[#0F7B6C]" />}
                  <span className="text-sm font-semibold text-[#1B3A5C]">✨ Build from history</span>
                  <span className="text-[11px] text-[#1B3A5C]/50 leading-tight">We'll suggest what you're running low on</span>
                </EntryCard>
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-gray-50">
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
                  <li className="px-4 py-2 bg-gray-50">
                    <p className="text-[10px] font-semibold text-[#1B3A5C]/35 uppercase tracking-wider">
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
          <div className="flex items-center gap-2 px-4 py-3 border-t border-gray-100">
            <Plus className="h-4 w-4 text-[#1B3A5C]/25 shrink-0" />
            <Input
              ref={addRef}
              placeholder="Add an item…"
              value={addInput}
              onChange={(e) => setAddInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') addItem() }}
              className="border-0 p-0 h-8 text-sm text-[#1B3A5C] placeholder:text-[#1B3A5C]/35 focus-visible:ring-0 bg-transparent"
            />
            {addInput.trim() && (
              <Button size="sm" className="bg-[#0F7B6C] hover:bg-[#0F7B6C]/90 text-white h-7 px-3" onClick={addItem}>
                Add
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Done Shopping */}
      <div className="space-y-3">
        <Button
          className="w-full bg-[#0F7B6C] hover:bg-[#0F7B6C]/90 text-white gap-2"
          onClick={() => setShowDone((v) => !v)}
        >
          <Check className="h-4 w-4" />
          Done Shopping
        </Button>

        {showDone && (
          <Card className="bg-white border-[#0F7B6C]/20 shadow-none">
            <CardContent className="p-4 space-y-3">
              <p className="text-sm font-medium text-[#1B3A5C]">How would you like to log this trip?</p>
              <Button
                className="w-full bg-[#0F7B6C] hover:bg-[#0F7B6C]/90 text-white gap-2"
                onClick={() => { setShowDone(false); setScanOpen(true) }}
              >
                <Camera className="h-4 w-4" />
                Scan receipt
              </Button>
              <Button
                variant="outline"
                className="w-full gap-2 border-gray-200 text-[#1B3A5C]/70"
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
      </div>

      <ImageIntelligence
        open={scanOpen}
        onOpenChange={setScanOpen}
        onImport={(_purchases: Purchase[]) => {
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
      className="flex flex-col gap-2 rounded-lg bg-white p-4 text-left cursor-pointer transition-colors disabled:opacity-60"
      style={{
        border: `0.5px solid ${hovered ? '#0F7B6C' : '#e5e7eb'}`,
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
          'h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors',
          item._done
            ? 'border-[#22C55E] bg-[#22C55E]'
            : 'border-gray-200 hover:border-[#0F7B6C]'
        )}
        aria-label={item._done ? 'Mark as not done' : 'Mark as done'}
      >
        {item._done && <Check className="h-3 w-3 text-white" />}
      </button>

      <div className="flex-1 min-w-0">
        {item._editingName ? (
          <Input
            autoFocus
            value={nameVal}
            onChange={(e) => setNameVal(e.target.value)}
            onBlur={() => onUpdateName(item._id, nameVal || item.name)}
            onKeyDown={(e) => { if (e.key === 'Enter') onUpdateName(item._id, nameVal || item.name) }}
            className="h-7 text-sm py-0 px-1 text-[#1B3A5C]"
          />
        ) : (
          <span
            className={cn(
              'text-sm font-medium text-[#1B3A5C] capitalize cursor-pointer hover:text-[#0F7B6C] transition-colors',
              item._done && 'line-through'
            )}
            onClick={() => {
              item._editingName = true
              setNameVal(item.name)
              onUpdateName(item._id, item.name) // trigger re-render via parent? no...
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
            <span className="text-[10px] text-[#1B3A5C]/40">{item.category}</span>
          )}
        </div>
      </div>

      {/* Quantity */}
      {item._editingQty ? (
        <Input
          autoFocus
          type="number"
          min={1}
          value={qtyVal}
          onChange={(e) => setQtyVal(e.target.value)}
          onBlur={() => onUpdateQty(item._id, parseInt(qtyVal) || 1)}
          onKeyDown={(e) => { if (e.key === 'Enter') onUpdateQty(item._id, parseInt(qtyVal) || 1) }}
          className="h-7 w-14 text-xs text-center text-[#1B3A5C] p-0"
        />
      ) : (
        <button
          onClick={() => { item._editingQty = true; setQtyVal(String(item.quantity)) }}
          className="text-xs text-[#1B3A5C]/50 hover:text-[#0F7B6C] transition-colors min-w-[2rem] text-right"
        >
          ×{item.quantity}{item.unit ? ` ${item.unit}` : ''}
        </button>
      )}

      <button
        onClick={() => onRemove(item._id)}
        className="opacity-0 group-hover:opacity-100 p-1 rounded text-[#1B3A5C]/25 hover:text-[#EF4444] hover:bg-[#EF4444]/8 transition-all shrink-0"
        aria-label={`Remove ${item.name}`}
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </li>
  )
}
