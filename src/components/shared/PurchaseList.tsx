'use client'

import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, Search, Camera } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Purchase } from '@/types'
import { ImageIntelligence } from './ImageIntelligence'

const SOURCE_STYLES: Record<string, string> = {
  telegram: 'bg-blue-50 text-blue-600',
  whatsapp: 'bg-green-50 text-green-700',
  receipt: 'bg-orange-50 text-orange-600',
  image: 'bg-teal-50 text-[#0F7B6C]',
  manual: 'bg-gray-100 text-gray-500',
}

interface PurchaseListProps {
  initialPurchases: Purchase[]
  categories: string[]
}

export function PurchaseList({ initialPurchases, categories }: PurchaseListProps) {
  const [purchases, setPurchases] = useState(initialPurchases)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [deleting, setDeleting]     = useState<string | null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [teams, setTeams]           = useState<{ id: string; name: string }[]>([])

  // Fetch teams so ImageIntelligence can offer the team selector
  useEffect(() => {
    fetch('/api/teams')
      .then((r) => r.json())
      .then((json) => {
        if (json.data) setTeams(json.data.map((t: { id: string; name: string }) => ({ id: t.id, name: t.name })))
      })
      .catch(() => {})
  }, [])

  const filtered = useMemo(() => {
    return purchases.filter((p) => {
      const matchesSearch = p.item.toLowerCase().includes(search.toLowerCase())
      const matchesCategory = !categoryFilter || p.category === categoryFilter
      return matchesSearch && matchesCategory
    })
  }, [purchases, search, categoryFilter])

  async function handleDelete(id: string) {
    setDeleting(id)
    try {
      const res = await fetch(`/api/purchases/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setPurchases((prev) => prev.filter((p) => p.id !== id))
      }
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#1B3A5C]/35 pointer-events-none" />
          <Input
            placeholder="Search items…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 text-[#1B3A5C] placeholder:text-[#1B3A5C]/35"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm text-[#1B3A5C] focus:outline-none focus:ring-2 focus:ring-[#0F7B6C]/30 focus:border-[#0F7B6C] min-w-[160px]"
        >
          <option value="">All categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 border-[#0F7B6C]/30 text-[#0F7B6C] hover:bg-[#0F7B6C]/5 hover:border-[#0F7B6C] shrink-0"
          onClick={() => setImportOpen(true)}
        >
          <Camera className="h-3.5 w-3.5" />
          Smart Import
        </Button>
      </div>

      <ImageIntelligence
        open={importOpen}
        onOpenChange={setImportOpen}
        onImport={(newPurchases) => setPurchases((prev) => [...newPurchases, ...prev])}
        teams={teams}
      />

      {/* Count */}
      <p className="text-xs text-[#1B3A5C]/45">
        {filtered.length} {filtered.length === 1 ? 'purchase' : 'purchases'}
        {(search || categoryFilter) && ' matching filters'}
      </p>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="py-12 text-center text-sm text-[#1B3A5C]/40">
          {purchases.length === 0
            ? 'No purchases yet — log your first via Telegram or WhatsApp'
            : 'No purchases match your filters'}
        </div>
      ) : (
        <ul className="divide-y divide-gray-50">
          <AnimatePresence initial={false}>
            {filtered.map((p, i) => {
              const sourceStyle = SOURCE_STYLES[p.source] ?? SOURCE_STYLES.manual
              return (
                <motion.li
                  key={p.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    transition: { delay: Math.min(i * 0.05, 0.4), duration: 0.3, ease: 'easeOut' },
                  }}
                  exit={{
                    opacity: 0,
                    height: 0,
                    overflow: 'hidden',
                    transition: { type: 'spring', bounce: 0, duration: 0.35 },
                  }}
                  className="flex items-center gap-4 py-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-[#1B3A5C]">{p.item}</span>
                      <span className="text-sm text-[#1B3A5C]/50">
                        × {p.quantity}
                        {p.unit ? ` ${p.unit}` : ''}
                      </span>
                      {p.source === 'image' && (
                        <Camera className="h-3 w-3 text-[#0F7B6C]" aria-label="Imported from image" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {p.category && (
                        <span className="rounded-full bg-[#0F7B6C]/10 text-[#0F7B6C] text-[10px] font-medium px-2 py-0.5">
                          {p.category}
                        </span>
                      )}
                      <span
                        className={`rounded-full text-[10px] font-medium px-2 py-0.5 ${sourceStyle}`}
                      >
                        {p.source}
                      </span>
                      <span className="text-[#1B3A5C]/35 text-xs">{formatDate(p.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {p.price != null && (
                      <span className="text-sm font-semibold text-[#1B3A5C]">
                        {formatCurrency(p.price)}
                      </span>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-[#1B3A5C]/30 hover:text-[#EF4444] hover:bg-[#EF4444]/10"
                      onClick={() => handleDelete(p.id)}
                      disabled={deleting === p.id}
                      aria-label={`Delete ${p.item}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </motion.li>
              )
            })}
          </AnimatePresence>
        </ul>
      )}
    </div>
  )
}
