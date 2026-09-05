'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import type { RecentActivity } from '@/types'

const DISMISSED_KEY = 'restock-continuity-dismissed'

export function ContinuityBanner() {
  const [activity, setActivity] = useState<RecentActivity | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem(DISMISSED_KEY)) return

    fetch('/api/activity/recent')
      .then((r) => r.json())
      .then((json) => {
        const data = json.data as RecentActivity | undefined
        if (data?.found) {
          setActivity(data)
          setVisible(true)
        }
      })
      .catch(() => {})
  }, [])

  function dismiss() {
    sessionStorage.setItem(DISMISSED_KEY, '1')
    setVisible(false)
  }

  if (!visible || !activity) return null

  const channelName = activity.source === 'telegram' ? 'Telegram' : 'WhatsApp'
  const purchaseLabel = activity.count === 1 ? '1 purchase' : `${activity.count} purchases`
  const timeLabel =
    activity.minutesAgo === null || activity.minutesAgo < 1
      ? 'just now'
      : `${activity.minutesAgo} min${activity.minutesAgo !== 1 ? 's' : ''} ago`

  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border-l-4 border-[#132B22] bg-[#132B22]/5 px-4 py-3">
      <p className="text-sm text-[#132B22]">
        <span className="font-semibold">Continuing from {channelName}</span>
        {' — '}
        {purchaseLabel} logged {timeLabel}
      </p>
      <button
        onClick={dismiss}
        aria-label="Dismiss banner"
        className="shrink-0 text-[#132B22]/40 hover:text-[#132B22] transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
