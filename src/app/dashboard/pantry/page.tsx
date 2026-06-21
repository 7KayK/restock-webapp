'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { format, differenceInDays } from 'date-fns'
import { Package, Camera } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PantryItem, PantryStatus, PantryResponse } from '@/types'

const PLAYFAIR: React.CSSProperties = {
  fontFamily: 'var(--font-playfair), "Playfair Display", Georgia, serif',
}

const STATUS_COLOR: Record<PantryStatus, string> = {
  stocked: '#22C55E',
  low: '#FF6B35',
  out: '#EF4444',
}

const STATUS_BG: Record<PantryStatus, string> = {
  stocked: 'bg-green-50 text-green-700',
  low: 'bg-orange-50 text-orange-600',
  out: 'bg-red-50 text-red-600',
}

const CONFIDENCE_BG: Record<string, string> = {
  high: 'bg-[#0F7B6C]/10 text-[#0F7B6C]',
  medium: 'bg-yellow-50 text-yellow-700',
  low: 'bg-gray-100 text-gray-500',
}

type Filter = 'all' | PantryStatus

function CircularProgress({ pct, status }: { pct: number; status: PantryStatus }) {
  const r = 18
  const circ = 2 * Math.PI * r
  const offset = circ - (Math.min(100, Math.max(0, pct)) / 100) * circ
  const color = STATUS_COLOR[status]

  return (
    <svg width="48" height="48" viewBox="0 0 48 48" aria-hidden="true">
      <circle cx="24" cy="24" r={r} fill="none" stroke="#F3F4F6" strokeWidth="4" />
      <circle
        cx="24"
        cy="24"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="4"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 24 24)"
      />
      <text
        x="24"
        y="24"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="9"
        fontWeight="700"
        fill={color}
      >
        {pct}%
      </text>
    </svg>
  )
}

function DepletionLabel({ isoDate }: { isoDate: string }) {
  const date = new Date(isoDate)
  const days = differenceInDays(date, new Date())
  const label = days < 0 ? 'Overdue' : `Need by ${format(date, 'MMM d')}`
  const color =
    days < 0 || days <= 3
      ? 'text-[#EF4444]'
      : days <= 7
      ? 'text-[#FF6B35]'
      : 'text-[#1B3A5C]/40'
  return <span className={cn('text-[11px]', color)}>{label}</span>
}

function PantryCard({ item }: { item: PantryItem }) {
  return (
    <div className="bg-white border border-gray-100 rounded-lg p-4 flex flex-col gap-3 hover:shadow-sm transition-shadow">
      {/* Top row: progress ring + name/category */}
      <div className="flex items-start gap-3">
        <CircularProgress pct={item.estimatedRemaining} status={item.status} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#1B3A5C] leading-snug truncate">{item.name}</p>
          {item.category && (
            <p className="text-[11px] text-[#1B3A5C]/45 mt-0.5 truncate">{item.category}</p>
          )}
        </div>
      </div>

      {/* Status + confidence badges */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize', STATUS_BG[item.status])}>
          {item.status === 'stocked' ? 'Stocked' : item.status === 'low' ? 'Running low' : 'Out'}
        </span>
        <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full capitalize', CONFIDENCE_BG[item.confidence])}>
          {item.confidence} confidence
        </span>
      </div>

      {/* Dates */}
      <div className="flex flex-col gap-0.5">
        <span className="text-[11px] text-[#1B3A5C]/40">
          Last bought: {format(new Date(item.lastPurchasedAt), 'MMM d, yyyy')}
        </span>
        <DepletionLabel isoDate={item.predictedDepletionDate} />
      </div>
    </div>
  )
}

function SummaryStatCard({
  label,
  count,
  color,
}: {
  label: string
  count: number
  color: string
}) {
  return (
    <div className="bg-white border border-gray-100 rounded-lg px-5 py-4 flex items-center gap-4">
      <span className="text-2xl font-bold" style={{ color }}>
        {count}
      </span>
      <span className="text-sm text-[#1B3A5C]/60">{label}</span>
    </div>
  )
}

export default function PantryPage() {
  const [data, setData] = useState<PantryResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('all')

  useEffect(() => {
    fetch('/api/pantry')
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const items = data?.items ?? []
  const counts = data?.counts ?? { stocked: 0, low: 0, out: 0 }
  const filtered = filter === 'all' ? items : items.filter((i) => i.status === filter)

  const FILTERS: { key: Filter; label: string }[] = [
    { key: 'all', label: `All (${items.length})` },
    { key: 'out', label: `Out (${counts.out})` },
    { key: 'low', label: `Low (${counts.low})` },
    { key: 'stocked', label: `Stocked (${counts.stocked})` },
  ]

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1
            className="text-2xl md:text-3xl text-[#1B3A5C] font-semibold"
            style={PLAYFAIR}
          >
            Your Pantry
          </h1>
          {!loading && (
            <p className="text-sm text-[#1B3A5C]/50 mt-1">
              {counts.out > 0 && `${counts.out} out · `}
              {counts.low > 0 && `${counts.low} running low · `}
              {counts.stocked} stocked
            </p>
          )}
        </div>
        <Link
          href="/dashboard/history"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0F7B6C] text-white text-sm font-medium hover:bg-[#0A6459] transition-colors shrink-0"
        >
          <Camera className="h-4 w-4" />
          Smart Import
        </Link>
      </div>

      {/* Summary stat cards */}
      <div className="grid grid-cols-3 gap-4">
        <SummaryStatCard label="Stocked" count={counts.stocked} color="#22C55E" />
        <SummaryStatCard label="Running Low" count={counts.low} color="#FF6B35" />
        <SummaryStatCard label="Out" count={counts.out} color="#EF4444" />
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 border-b border-gray-100">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
              filter === key
                ? 'border-[#0F7B6C] text-[#0F7B6C]'
                : 'border-transparent text-[#1B3A5C]/50 hover:text-[#1B3A5C]'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Loading skeletons */}
      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white border border-gray-100 rounded-lg p-4 h-36 animate-pulse" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
            <Package className="h-7 w-7 text-gray-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-[#1B3A5C]">Your pantry is empty</p>
            <p className="text-sm text-[#1B3A5C]/45 mt-1">
              Log a purchase to start tracking your stock.
            </p>
          </div>
          <Link
            href="/dashboard/history"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0F7B6C] text-white text-sm font-medium hover:bg-[#0A6459] transition-colors"
          >
            <Camera className="h-4 w-4" />
            Smart Import
          </Link>
        </div>
      )}

      {/* Filtered empty */}
      {!loading && items.length > 0 && filtered.length === 0 && (
        <p className="text-sm text-[#1B3A5C]/45 py-10 text-center">
          No items with status &ldquo;{filter}&rdquo;.
        </p>
      )}

      {/* Item grid */}
      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((item) => (
            <PantryCard key={item.name} item={item} />
          ))}
        </div>
      )}
    </div>
  )
}
