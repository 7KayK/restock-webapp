'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BellOff, Clock, PackageX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatDate, formatRelativeDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { Reminder } from '@/types'

type ReminderStatus = 'overdue' | 'due-soon' | 'upcoming' | 'snoozed'

function getStatus(reminder: Reminder): ReminderStatus {
  const now = new Date()
  const snoozedUntil = reminder.snoozedUntil ? new Date(reminder.snoozedUntil) : null
  if (snoozedUntil && snoozedUntil > now) return 'snoozed'

  const daysUntil = Math.ceil(
    (new Date(reminder.predictedDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  )
  if (daysUntil < 0) return 'overdue'
  if (daysUntil <= 3) return 'due-soon'
  return 'upcoming'
}

const STATUS_CONFIG = {
  overdue: {
    dot: 'bg-[#EF4444]',
    badge: 'bg-[#EF4444]/10 text-[#EF4444]',
    label: 'Overdue',
  },
  'due-soon': {
    dot: 'bg-[#EAB308]',
    badge: 'bg-[#EAB308]/10 text-[#EAB308]',
    label: 'Due soon',
  },
  upcoming: {
    dot: 'bg-[#132B22]',
    badge: 'bg-[#132B22]/10 text-[#132B22]',
    label: 'Upcoming',
  },
  snoozed: {
    dot: 'bg-[#b9c2ba]',
    badge: 'bg-[#EFE7D6] text-[#5b6a5d]',
    label: 'Snoozed',
  },
}

interface ReminderListProps {
  initialReminders: Reminder[]
}

export function ReminderList({ initialReminders }: ReminderListProps) {
  const [reminders, setReminders] = useState(initialReminders)
  const [loading, setLoading] = useState<string | null>(null)

  async function snooze(id: string) {
    setLoading(id)
    const snoozedUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    setReminders((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, snoozedUntil: new Date(snoozedUntil) } : r
      )
    )
    try {
      await fetch(`/api/reminders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ snoozedUntil }),
      })
    } finally {
      setLoading(null)
    }
  }

  async function dismiss(id: string) {
    setLoading(id)
    setReminders((prev) => prev.filter((r) => r.id !== id))
    try {
      await fetch(`/api/reminders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: false }),
      })
    } finally {
      setLoading(null)
    }
  }

  async function ranOut(id: string, item: string) {
    setLoading(id)
    setReminders((prev) => prev.filter((r) => r.id !== id))
    try {
      await Promise.all([
        fetch('/api/items/ran-out', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ item }),
        }),
        fetch(`/api/reminders/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ active: false }),
        }),
      ])
    } finally {
      setLoading(null)
    }
  }

  if (reminders.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-[#132B22]/45">
          No active reminders — log at least 2 purchases of the same item to generate predictions
        </p>
      </div>
    )
  }

  const ORDER: Record<ReminderStatus, number> = { overdue: 0, 'due-soon': 1, upcoming: 2, snoozed: 3 }
  const sorted = [...reminders].sort((a, b) => {
    const sa = ORDER[getStatus(a)]
    const sb = ORDER[getStatus(b)]
    if (sa !== sb) return sa - sb
    return new Date(a.predictedDate).getTime() - new Date(b.predictedDate).getTime()
  })

  return (
    <ul className="space-y-3">
      <AnimatePresence initial={false}>
        {sorted.map((r, i) => {
          const status = getStatus(r)
          const cfg = STATUS_CONFIG[status]
          const isBusy = loading === r.id

          return (
            <motion.li
              key={r.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{
                opacity: 1,
                y: 0,
                transition: { delay: Math.min(i * 0.05, 0.3), duration: 0.3, ease: 'easeOut' },
              }}
              exit={{
                opacity: 0,
                height: 0,
                overflow: 'hidden',
                transition: { type: 'spring', bounce: 0, duration: 0.35 },
              }}
              className="flex items-start gap-4 rounded-xl border border-[rgba(19,43,34,0.10)] bg-white px-4 py-3.5"
            >
              {/* Status dot */}
              <div className="mt-1.5 shrink-0">
                <div className={cn('h-2.5 w-2.5 rounded-full', cfg.dot)} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-[#132B22]">{r.item}</span>
                  <span className={cn('text-[10px] font-medium rounded-full px-2 py-0.5', cfg.badge)}>
                    {cfg.label}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1 flex-wrap text-xs text-[#132B22]/50">
                  <span>Due {formatDate(r.predictedDate)}</span>
                  <span>·</span>
                  <span>{formatRelativeDate(r.predictedDate)}</span>
                  <span>·</span>
                  <span>{Math.round(r.confidence * 100)}% confidence</span>
                  {status === 'snoozed' && r.snoozedUntil && (
                    <>
                      <span>·</span>
                      <span>Until {formatDate(r.snoozedUntil)}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2.5 text-xs text-[#132B22]/60 hover:text-[#132B22] hover:bg-[#EFE7D6]"
                  onClick={() => snooze(r.id)}
                  disabled={isBusy}
                  title="Snooze 7 days"
                >
                  <Clock className="h-3 w-3 mr-1" />
                  Snooze
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2.5 text-xs text-[#132B22]/60 hover:text-[#EF4444] hover:bg-[#EF4444]/10"
                  onClick={() => ranOut(r.id, r.item)}
                  disabled={isBusy}
                  title="I ran out of this item"
                >
                  <PackageX className="h-3 w-3 mr-1" />
                  Ran out
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2.5 text-xs text-[#132B22]/60 hover:text-[#132B22] hover:bg-[#EFE7D6]"
                  onClick={() => dismiss(r.id)}
                  disabled={isBusy}
                  title="Dismiss reminder"
                >
                  <BellOff className="h-3 w-3 mr-1" />
                  Dismiss
                </Button>
              </div>
            </motion.li>
          )
        })}
      </AnimatePresence>
    </ul>
  )
}
