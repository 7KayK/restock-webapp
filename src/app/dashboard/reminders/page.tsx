export const dynamic = 'force-dynamic'

import { Suspense } from 'react'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { getOrCreateUser } from '@/lib/getOrCreateUser'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ReminderList } from '@/components/shared/ReminderList'
import type { Reminder } from '@/types'

async function syncReminders(userId: string) {
  const user = await getOrCreateUser(userId)

  const purchases = await prisma.purchase.findMany({
    where: { userId: user.id, quantity: { gt: 0 } },
    orderBy: { createdAt: 'asc' },
    select: { item: true, quantity: true, createdAt: true },
  })

  const grouped = new Map<string, typeof purchases>()
  for (const p of purchases) {
    const key = p.item.trim().toLowerCase()
    if (!grouped.has(key)) grouped.set(key, [])
    grouped.get(key)!.push(p)
  }

  const now = new Date()

  for (const [key, group] of grouped) {
    if (group.length < 2) continue

    const sorted = [...group].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    const last = sorted[sorted.length - 1]
    const count = sorted.length

    let totalGap = 0
    for (let i = 1; i < sorted.length; i++) {
      totalGap += (sorted[i].createdAt.getTime() - sorted[i - 1].createdAt.getTime()) / 86_400_000
    }
    const avgFrequencyDays = Math.max(1, totalGap / (count - 1))
    const daysSinceLast = (now.getTime() - last.createdAt.getTime()) / 86_400_000
    const daysRemaining = Math.max(0, avgFrequencyDays - daysSinceLast)
    const predictedDate = new Date(now.getTime() + daysRemaining * 86_400_000)
    const confidence = count >= 5 ? 0.9 : count >= 3 ? 0.75 : 0.55

    // Only upsert if no active reminder exists for this item, or if prediction changed significantly
    const existing = await prisma.reminder.findFirst({
      where: { userId: user.id, item: key, active: true },
    })

    const diffDays = existing
      ? Math.abs((existing.predictedDate.getTime() - predictedDate.getTime()) / 86_400_000)
      : null

    if (!existing || diffDays! > 2) {
      await prisma.reminder.updateMany({
        where: { userId: user.id, item: key, active: true },
        data: { active: false },
      })
      await prisma.reminder.create({
        data: { userId: user.id, item: key, predictedDate, confidence, active: true },
      })
    }
  }

  return user.id
}

async function ActiveReminders() {
  const { userId } = await auth()
  if (!userId) return null

  try {
    // Auto-generate/refresh predictions from purchase history on every page load
    const internalUserId = await syncReminders(userId)

    const rows = await prisma.reminder.findMany({
      where: { userId: internalUserId, active: true },
      orderBy: { predictedDate: 'asc' },
    })

    const reminders: Reminder[] = rows.map((r) => ({
      ...r,
      snoozedUntil: r.snoozedUntil ?? null,
    }))

    const activeCount = reminders.filter((r) => {
      const snoozed = r.snoozedUntil ? new Date(r.snoozedUntil) : null
      return !snoozed || snoozed <= new Date()
    }).length

    return (
      <Card className="bg-white border-gray-100 shadow-none">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base text-[#132B22]">Active Reminders</CardTitle>
            {activeCount > 0 && (
              <span className="text-xs font-medium rounded-full bg-[#132B22]/10 text-[#132B22] px-2.5 py-0.5">
                {activeCount} active
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <ReminderList initialReminders={reminders} />
        </CardContent>
      </Card>
    )
  } catch (err) {
    console.error('[reminders page]', err)
    return (
      <Card className="bg-white border-gray-100 shadow-none">
        <CardContent className="py-12 text-center text-sm text-[#132B22]/45">
          Failed to load reminders
        </CardContent>
      </Card>
    )
  }
}

function RemindersSkeleton() {
  return (
    <Card className="bg-white border-gray-100 shadow-none">
      <CardHeader className="pb-3">
        <Skeleton className="h-5 w-36" />
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-gray-100 p-4">
            <div className="flex items-start gap-3">
              <Skeleton className="h-2.5 w-2.5 rounded-full mt-1.5 shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-64" />
              </div>
              <div className="flex gap-1.5">
                <Skeleton className="h-7 w-16" />
                <Skeleton className="h-7 w-16" />
                <Skeleton className="h-7 w-16" />
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export default function RemindersPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-[#132B22]">Reminders</h1>
        <p className="text-sm text-[#132B22]/50 mt-0.5">
          Restock dates predicted from your purchase history — updates each time you visit
        </p>
      </div>

      <Suspense fallback={<RemindersSkeleton />}>
        <ActiveReminders />
      </Suspense>
    </div>
  )
}
