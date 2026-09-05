'use client'

import { useState, useRef, useCallback } from 'react'
import {
  Camera, Upload, X, Loader2, Check, ChevronRight,
  ShoppingCart, Bell, CalendarDays, RotateCcw,
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { Purchase, ImageIntelligenceResult, ImageIntelligenceItem } from '@/types'

type Step = 'idle' | 'processing' | 'review' | 'action' | 'saving' | 'success'
type ActionType = 'purchases' | 'reminders' | 'calendar'

interface EditableItem extends ImageIntelligenceItem {
  _removed: boolean
}

interface ImageIntelligenceProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: (purchases: Purchase[]) => void
  mode?: 'import' | 'inventory'
  teams?: { id: string; name: string }[]
  defaultTeamId?: string | null
}

const STATUS_STYLES: Record<string, string> = {
  out_of_stock:  'bg-[#EF4444]/10 text-[#EF4444]',
  running_low:   'bg-[#C9A15A]/10 text-[#C9A15A]',
  purchased:     'bg-[#22C55E]/10 text-[#22C55E]',
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result.split(',')[1])
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

const TYPE_LABELS: Record<string, string> = {
  receipt:       '🧾 Receipt',
  shopping_bag:  '🛍 Shopping bag',
  pantry:        '🏠 Pantry scan',
  product_label: '🏷 Product label',
  unknown:       '📸 Image',
}

const ACTIONS: { id: ActionType; label: string; desc: string; Icon: React.ElementType }[] = [
  { id: 'purchases', label: 'Log as purchases', desc: 'Add to your purchase history', Icon: ShoppingCart },
  { id: 'reminders', label: 'Create reminders',  desc: 'Get notified when to restock',  Icon: Bell },
  { id: 'calendar',  label: 'Add to calendar',   desc: 'Schedule a shopping trip',      Icon: CalendarDays },
]

export function ImageIntelligence({
  open, onOpenChange, onImport,
  mode = 'import',
  teams = [],
  defaultTeamId = null,
}: ImageIntelligenceProps) {
  const [step, setStep]               = useState<Step>('idle')
  const [error, setError]             = useState<string | null>(null)
  const [result, setResult]           = useState<ImageIntelligenceResult | null>(null)
  const [items, setItems]             = useState<EditableItem[]>([])
  const [action, setAction]           = useState<ActionType>('purchases')
  const [calendarDate, setCalendarDate] = useState('')
  const [calendarUrl, setCalendarUrl] = useState<string | null>(null)
  const [isDragging, setIsDragging]   = useState(false)
  const [successCount, setSuccessCount] = useState(0)
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(defaultTeamId)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function reset() {
    setStep('idle'); setError(null); setResult(null); setItems([])
    setAction('purchases'); setCalendarDate(''); setCalendarUrl(null)
    setIsDragging(false); setSuccessCount(0); setSelectedTeamId(defaultTeamId)
  }

  function handleClose(open: boolean) {
    if (!open) reset()
    onOpenChange(open)
  }

  async function processFile(file: File) {
    setError(null)
    setStep('processing')

    const SUPPORTED = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic']
    const mediaType = SUPPORTED.includes(file.type)
      ? (file.type === 'image/heic' ? 'image/jpeg' : file.type)
      : 'image/jpeg'

    try {
      const base64 = await fileToBase64(file)
      const res = await fetch('/api/images/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mediaType }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Processing failed')

      const r: ImageIntelligenceResult = json.data
      if ((r.confidence ?? 0) < 0.4) {
        setError("I couldn't identify household items in that image. Try a clear photo of a receipt or shopping bag.")
        setStep('idle')
        return
      }
      if (!r.items.length) {
        setError('No items found. Try a receipt or shopping bag photo.')
        setStep('idle')
        return
      }

      setResult(r)
      setItems(r.items.map((it) => ({ ...it, _removed: false })))
      setStep('review')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process image. Please try again.')
      setStep('idle')
    }
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }, [])

  async function handleSave(overrideAction?: ActionType) {
    const activeItems = items.filter((it) => !it._removed)
    if (!activeItems.length) return

    const saveAction = overrideAction ?? action
    setStep('saving')
    setError(null)

    try {
      const res = await fetch('/api/images/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action:       saveAction,
          items:        activeItems,
          calendarDate: calendarDate || undefined,
          teamId:       selectedTeamId ?? null,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Save failed')

      setSuccessCount(activeItems.length)

      if (saveAction === 'purchases') {
        onImport(json.data.purchases ?? [])
      } else if (saveAction === 'calendar') {
        setCalendarUrl(json.data.calendarUrl)
      }

      setStep('success')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save. Please try again.')
      setStep('action')
    }
  }

  function updateItem(idx: number, field: keyof ImageIntelligenceItem, value: string | number) {
    setItems((prev) => prev.map((it, i) => i === idx ? { ...it, [field]: value } : it))
  }

  function removeItem(idx: number) {
    setItems((prev) => prev.map((it, i) => i === idx ? { ...it, _removed: true } : it))
  }

  const activeItems = items.filter((it) => !it._removed)

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle className="text-[#132B22] flex items-center gap-2">
            <Camera className="h-4 w-4 text-[#132B22]" />
            {mode === 'inventory' ? 'Scan Inventory' : 'Smart Import'}
          </DialogTitle>
        </DialogHeader>

        {/* ── Step: idle / upload ── */}
        {(step === 'idle') && (
          <div className="space-y-4">
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                'flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed cursor-pointer py-12 px-6 transition-colors',
                isDragging
                  ? 'border-[#132B22] bg-[#132B22]/8'
                  : 'border-[#132B22]/25 hover:border-[#132B22]/50 hover:bg-[#132B22]/4'
              )}
            >
              <div className="rounded-full bg-[#132B22]/10 p-4">
                <Upload className="h-6 w-6 text-[#132B22]" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-[#132B22]">
                  Drag a receipt or photo here
                </p>
                <p className="text-xs text-[#132B22]/45 mt-0.5">or click to browse</p>
              </div>
              <p className="text-[10px] text-[#132B22]/35 font-medium tracking-wide uppercase">
                JPEG · PNG · WebP · HEIC
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic,.heic,.jpg,.jpeg,.png,.webp"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) processFile(file)
                e.target.value = ''
              }}
            />

            {error && (
              <p className="text-sm text-[#EF4444] bg-[#EF4444]/8 rounded-lg px-3 py-2">{error}</p>
            )}
          </div>
        )}

        {/* ── Step: processing ── */}
        {step === 'processing' && (
          <div className="flex flex-col items-center gap-4 py-12">
            <Loader2 className="h-8 w-8 text-[#132B22] animate-spin" />
            <div className="text-center">
              <p className="text-sm font-medium text-[#132B22]">Analysing your image…</p>
              <p className="text-xs text-[#132B22]/45 mt-0.5">Claude is extracting items</p>
            </div>
          </div>
        )}

        {/* ── Step: review ── */}
        {step === 'review' && result && (
          <div className="space-y-4">
            {/* Metadata */}
            <div className="rounded-lg bg-[#F7F2E7] px-3 py-2.5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#132B22]">
                  {TYPE_LABELS[result.type] ?? '📸 Image'}
                </span>
                <span className="text-[10px] text-[#132B22]/45">
                  {Math.round((result.confidence ?? 0) * 100)}% confidence
                </span>
              </div>
              {(result.store || result.date || result.totalAmount != null) && (
                <div className="flex gap-3 text-[10px] text-[#132B22]/60 flex-wrap">
                  {result.store && <span>🏪 {result.store}</span>}
                  {result.date && <span>📅 {result.date}</span>}
                  {result.totalAmount != null && <span>💰 ${result.totalAmount.toFixed(2)}</span>}
                </div>
              )}
            </div>

            {/* Editable item list */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-[#132B22]/60 uppercase tracking-wide">
                Items found — {activeItems.length} of {items.length}
              </p>

              {items.map((item, idx) => {
                if (item._removed) return null
                return (
                  <div key={idx} className="flex items-center gap-2 group">
                    {mode === 'inventory' && item.status && item.status !== 'purchased' && (
                      <span className={`text-[10px] font-medium rounded px-1.5 py-0.5 shrink-0 ${STATUS_STYLES[item.status] ?? ''}`}>
                        {item.status === 'out_of_stock' ? 'Out' : 'Low'}
                      </span>
                    )}
                    <div className="flex-1 grid grid-cols-[1fr_56px_64px] gap-1.5">
                      <Input
                        value={item.name}
                        onChange={(e) => updateItem(idx, 'name', e.target.value)}
                        className="h-8 text-xs text-[#132B22]"
                        placeholder="Item name"
                      />
                      <Input
                        type="number"
                        min={0}
                        step={0.5}
                        value={item.quantity ?? 1}
                        onChange={(e) => updateItem(idx, 'quantity', parseFloat(e.target.value) || 1)}
                        className="h-8 text-xs text-center text-[#132B22]"
                        placeholder="Qty"
                      />
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        value={item.price ?? ''}
                        onChange={(e) => updateItem(idx, 'price', e.target.value ? parseFloat(e.target.value) : null as unknown as number)}
                        className="h-8 text-xs text-center text-[#132B22]"
                        placeholder="$0.00"
                      />
                    </div>
                    <button
                      onClick={() => removeItem(idx)}
                      className="p-1 rounded text-[#132B22]/25 hover:text-[#EF4444] hover:bg-[#EF4444]/8 transition-colors opacity-0 group-hover:opacity-100"
                      aria-label={`Remove ${item.name}`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )
              })}

              {activeItems.length === 0 && (
                <p className="text-xs text-[#132B22]/40 text-center py-4">
                  All items removed — go back to upload another image
                </p>
              )}
            </div>

            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => { setStep('idle'); setError(null) }}
              >
                ← Back
              </Button>
              <Button
                size="sm"
                className="flex-1 bg-[#132B22] hover:bg-[#132B22]/90 text-white"
                onClick={() => { if (mode === 'inventory') { handleSave('purchases') } else { setStep('action') } }}
                disabled={activeItems.length === 0}
              >
                {mode === 'inventory' ? 'Save inventory' : <>Continue <ChevronRight className="h-3.5 w-3.5 ml-1" /></>}
              </Button>
            </div>
          </div>
        )}

        {/* ── Step: action ── */}
        {step === 'action' && (
          <div className="space-y-4">
            <p className="text-sm font-medium text-[#132B22]">
              What would you like to do with {activeItems.length} item{activeItems.length !== 1 ? 's' : ''}?
            </p>

            <div className="space-y-2">
              {ACTIONS.map(({ id, label, desc, Icon }) => (
                <button
                  key={id}
                  onClick={() => setAction(id)}
                  className={cn(
                    'w-full flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors',
                    action === id
                      ? 'border-[#132B22] bg-[#132B22]/6'
                      : 'border-gray-100 hover:border-[#132B22]/30 hover:bg-gray-50'
                  )}
                >
                  <Icon className={cn('h-4 w-4 shrink-0', action === id ? 'text-[#132B22]' : 'text-[#132B22]/40')} />
                  <div>
                    <p className={cn('text-sm font-medium', action === id ? 'text-[#132B22]' : 'text-[#132B22]')}>
                      {label}
                    </p>
                    <p className="text-[11px] text-[#132B22]/45">{desc}</p>
                  </div>
                  {action === id && (
                    <Check className="h-4 w-4 text-[#132B22] ml-auto shrink-0" />
                  )}
                </button>
              ))}
            </div>

            {action === 'calendar' && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#132B22]/60">Shopping trip date</label>
                <Input
                  type="date"
                  value={calendarDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setCalendarDate(e.target.value)}
                  className="h-8 text-sm text-[#132B22]"
                />
              </div>
            )}

            {/* Team selector — only for purchases and reminders */}
            {teams.length > 0 && action !== 'calendar' && (
              <div className="space-y-2 border-t border-gray-100 pt-3">
                <p className="text-xs font-medium text-[#132B22]/60">Save for</p>
                <div className="space-y-1.5">
                  <label className={cn(
                    'flex items-center gap-2.5 rounded-lg border px-3 py-2 cursor-pointer transition-colors',
                    selectedTeamId === null
                      ? 'border-[#132B22] bg-[#132B22]/6'
                      : 'border-gray-100 hover:border-[#132B22]/30'
                  )}>
                    <input
                      type="radio"
                      name="team-select"
                      className="accent-[#132B22]"
                      checked={selectedTeamId === null}
                      onChange={() => setSelectedTeamId(null)}
                    />
                    <span className="text-sm text-[#132B22]">Personal</span>
                  </label>
                  {teams.map((t) => (
                    <label key={t.id} className={cn(
                      'flex items-center gap-2.5 rounded-lg border px-3 py-2 cursor-pointer transition-colors',
                      selectedTeamId === t.id
                        ? 'border-[#132B22] bg-[#132B22]/6'
                        : 'border-gray-100 hover:border-[#132B22]/30'
                    )}>
                      <input
                        type="radio"
                        name="team-select"
                        className="accent-[#132B22]"
                        checked={selectedTeamId === t.id}
                        onChange={() => setSelectedTeamId(t.id)}
                      />
                      <span className="text-sm text-[#132B22]">{t.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <p className="text-sm text-[#EF4444] bg-[#EF4444]/8 rounded-lg px-3 py-2">{error}</p>
            )}

            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => { setStep('review'); setError(null) }}
              >
                ← Back
              </Button>
              <Button
                size="sm"
                className="flex-1 bg-[#132B22] hover:bg-[#132B22]/90 text-white"
                onClick={() => handleSave()}
                disabled={action === 'calendar' && !calendarDate}
              >
                Save items
              </Button>
            </div>
          </div>
        )}

        {/* ── Step: saving ── */}
        {step === 'saving' && (
          <div className="flex flex-col items-center gap-4 py-12">
            <Loader2 className="h-8 w-8 text-[#132B22] animate-spin" />
            <p className="text-sm text-[#132B22]/60">Saving…</p>
          </div>
        )}

        {/* ── Step: success ── */}
        {step === 'success' && (
          <div className="space-y-5">
            <div className="flex flex-col items-center gap-3 py-6">
              <div className="rounded-full bg-[#22C55E]/10 p-4">
                <Check className="h-7 w-7 text-[#22C55E]" />
              </div>
              {action === 'purchases' && (
                <div className="text-center">
                  <p className="text-base font-semibold text-[#132B22]">
                    {successCount} item{successCount !== 1 ? 's' : ''} logged!
                  </p>
                  <p className="text-xs text-[#132B22]/45 mt-0.5">Added to your purchase history</p>
                </div>
              )}
              {action === 'reminders' && (
                <div className="text-center">
                  <p className="text-base font-semibold text-[#132B22]">
                    {successCount} reminder{successCount !== 1 ? 's' : ''} created!
                  </p>
                  <p className="text-xs text-[#132B22]/45 mt-0.5">You'll be notified when to restock</p>
                </div>
              )}
              {action === 'calendar' && (
                <div className="text-center">
                  <p className="text-base font-semibold text-[#132B22]">Shopping trip ready!</p>
                  <p className="text-xs text-[#132B22]/45 mt-0.5">Open the link to add to Google Calendar</p>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2">
              {action === 'purchases' && (
                <Button
                  size="sm"
                  className="bg-[#132B22] hover:bg-[#132B22]/90 text-white"
                  onClick={() => handleClose(false)}
                >
                  Done
                </Button>
              )}
              {action === 'reminders' && (
                <Button
                  size="sm"
                  className="bg-[#132B22] hover:bg-[#132B22]/90 text-white"
                  asChild
                >
                  <a href="/dashboard/reminders">View Reminders</a>
                </Button>
              )}
              {action === 'calendar' && calendarUrl && (
                <Button
                  size="sm"
                  className="bg-[#132B22] hover:bg-[#132B22]/90 text-white"
                  onClick={() => window.open(calendarUrl, '_blank', 'noopener,noreferrer')}
                >
                  <CalendarDays className="h-4 w-4 mr-2" />
                  Open Google Calendar
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="text-[#132B22]/50 hover:text-[#132B22]"
                onClick={() => reset()}
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                Import another
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
