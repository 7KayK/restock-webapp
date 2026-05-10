import { Suspense } from 'react'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ReminderList } from '@/components/shared/ReminderList'
import type { Reminder } from '@/types'

async function ActiveReminders() {
  const { userId } = await auth()
  if (!userId) return null

  try {
    const user = await prisma.user.findUnique({ where: { clerkId: userId } })

    let reminders: Reminder[] = []

    if (user) {
      const rows = await prisma.reminder.findMany({
        where: { userId: user.id, active: true },
        orderBy: { predictedDate: 'asc' },
      })

      reminders = rows.map((r) => ({
        ...r,
        snoozedUntil: r.snoozedUntil ?? null,
      }))
    }

    const activeCount = reminders.filter((r) => {
      const snoozedUntil = r.snoozedUntil ? new Date(r.snoozedUntil) : null
      return !snoozedUntil || snoozedUntil <= new Date()
    }).length

    return (
      <Card className="bg-white border-gray-100 shadow-none">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base text-[#1B3A5C]">Active Reminders</CardTitle>
            {activeCount > 0 && (
              <span className="text-xs font-medium rounded-full bg-[#0F7B6C]/10 text-[#0F7B6C] px-2.5 py-0.5">
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
  } catch {
    return (
      <Card className="bg-white border-gray-100 shadow-none">
        <CardContent className="py-12 text-center text-sm text-[#1B3A5C]/45">
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
        <h1 className="text-2xl font-bold text-[#1B3A5C]">Reminders</h1>
        <p className="text-sm text-[#1B3A5C]/50 mt-0.5">
          AI-predicted restock dates based on your purchase history
        </p>
      </div>

      <Suspense fallback={<RemindersSkeleton />}>
        <ActiveReminders />
      </Suspense>
    </div>
  )
}
