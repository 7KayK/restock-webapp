import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import type { PantryItem, PantryStatus, PantryConfidence } from '@/types'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const user = await prisma.user.findUnique({ where: { clerkId: userId } })
    if (!user) return Response.json({ error: 'User not found' }, { status: 404 })

    const purchases = await prisma.purchase.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'asc' },
      select: { item: true, quantity: true, unit: true, category: true, createdAt: true },
    })

    // Group by normalised item name (lowercase trim)
    const grouped = new Map<string, typeof purchases>()
    for (const p of purchases) {
      const key = p.item.trim().toLowerCase()
      if (!grouped.has(key)) grouped.set(key, [])
      grouped.get(key)!.push(p)
    }

    const now = new Date()
    const items: PantryItem[] = []

    for (const [, group] of grouped) {
      // Sort ascending (already sorted from DB but guard anyway)
      const sorted = [...group].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      const last = sorted[sorted.length - 1]
      const count = sorted.length

      // Average frequency between purchases (days)
      let avgFrequencyDays = 30 // default for single purchase
      if (count >= 2) {
        let totalGap = 0
        for (let i = 1; i < sorted.length; i++) {
          totalGap +=
            (sorted[i].createdAt.getTime() - sorted[i - 1].createdAt.getTime()) /
            (1000 * 60 * 60 * 24)
        }
        avgFrequencyDays = Math.max(1, totalGap / (count - 1))
      }

      const dailyRate = last.quantity / avgFrequencyDays
      const daysSinceLast =
        (now.getTime() - last.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      const estimatedConsumed = dailyRate * daysSinceLast
      const estimatedRemainingQty = Math.max(0, last.quantity - estimatedConsumed)
      const estimatedRemaining = Math.min(100, (estimatedRemainingQty / last.quantity) * 100)

      const daysUntilDepletion = dailyRate > 0 ? estimatedRemainingQty / dailyRate : avgFrequencyDays
      const predictedDepletionDate = new Date(
        now.getTime() + daysUntilDepletion * 24 * 60 * 60 * 1000
      )

      const status: PantryStatus =
        estimatedRemaining <= 10 ? 'out' : estimatedRemaining <= 50 ? 'low' : 'stocked'

      const confidence: PantryConfidence =
        count >= 3 ? 'high' : count === 2 ? 'medium' : 'low'

      items.push({
        name: last.item,
        category: last.category,
        lastPurchasedAt: last.createdAt.toISOString(),
        quantity: last.quantity,
        unit: last.unit,
        avgFrequencyDays: Math.round(avgFrequencyDays),
        estimatedRemaining: Math.round(estimatedRemaining),
        predictedDepletionDate: predictedDepletionDate.toISOString(),
        status,
        confidence,
      })
    }

    // Sort: out first, then low, then stocked
    const ORDER: Record<PantryStatus, number> = { out: 0, low: 1, stocked: 2 }
    items.sort((a, b) => ORDER[a.status] - ORDER[b.status])

    const counts = {
      stocked: items.filter((i) => i.status === 'stocked').length,
      low: items.filter((i) => i.status === 'low').length,
      out: items.filter((i) => i.status === 'out').length,
    }

    return Response.json({ items, counts })
  } catch (err) {
    console.error('[pantry] error:', err)
    return Response.json({ error: 'Failed to load pantry' }, { status: 500 })
  }
}
