import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { getOrCreateUser } from '@/lib/getOrCreateUser'
import type { ShoppingItem } from '@/types'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const user = await getOrCreateUser(userId)
    const now = new Date()
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    // Items from active reminders due within 7 days (or overdue)
    const dueReminders = await prisma.reminder.findMany({
      where: {
        userId: user.id,
        active: true,
        predictedDate: { lte: sevenDaysFromNow },
      },
      orderBy: { predictedDate: 'asc' },
    })

    const reminderItems: ShoppingItem[] = dueReminders.map((r) => ({
      name:      r.item,
      quantity:  1,
      unit:      null,
      category:  null,
      source:    'reminder' as const,
      reminderId: r.id,
    }))

    const reminderItemNames = new Set(dueReminders.map((r) => r.item))

    // Predicted items: frequently bought items overdue by average interval
    const allPurchases = await prisma.purchase.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'asc' },
      select: { item: true, quantity: true, unit: true, category: true, createdAt: true },
    })

    // Group by item
    type PurchaseRecord = { quantity: number; unit: string | null; category: string | null; createdAt: Date }
    const byItem = new Map<string, PurchaseRecord[]>()
    for (const p of allPurchases) {
      const list = byItem.get(p.item) ?? []
      list.push({ quantity: p.quantity, unit: p.unit, category: p.category, createdAt: p.createdAt })
      byItem.set(p.item, list)
    }

    const predicted: ShoppingItem[] = []
    for (const [item, records] of byItem) {
      if (reminderItemNames.has(item)) continue
      if (records.length < 3) continue

      let totalMs = 0
      for (let i = 1; i < records.length; i++) {
        totalMs += records[i].createdAt.getTime() - records[i - 1].createdAt.getTime()
      }
      const avgIntervalDays = totalMs / (records.length - 1) / (24 * 60 * 60 * 1000)
      const last = records[records.length - 1]
      const daysSinceLast = (now.getTime() - last.createdAt.getTime()) / (24 * 60 * 60 * 1000)

      if (daysSinceLast >= avgIntervalDays * 0.8) {
        predicted.push({
          name:     item,
          quantity: last.quantity,
          unit:     last.unit ?? null,
          category: last.category ?? null,
          source:   'predicted' as const,
        })
      }
    }

    return Response.json({ data: { items: [...reminderItems, ...predicted] } })
  } catch {
    return Response.json({ error: 'Failed to build shopping list' }, { status: 500 })
  }
}
