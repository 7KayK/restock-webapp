import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { getOrCreateUser } from '@/lib/getOrCreateUser'

// Generates/refreshes Reminder rows from purchase history.
// Uses the same frequency algorithm as the pantry route.
// Requires ≥2 purchases of the same item to produce a prediction.
// Safe to call repeatedly — upserts by deactivating stale reminders first.
export async function POST() {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const user = await getOrCreateUser(userId)

    const purchases = await prisma.purchase.findMany({
      where: {
        userId: user.id,
        quantity: { gt: 0 }, // exclude depletion events (quantity=0, source='depleted')
      },
      orderBy: { createdAt: 'asc' },
      select: { item: true, quantity: true, category: true, createdAt: true },
    })

    // Group by normalised item name
    const grouped = new Map<string, typeof purchases>()
    for (const p of purchases) {
      const key = p.item.trim().toLowerCase()
      if (!grouped.has(key)) grouped.set(key, [])
      grouped.get(key)!.push(p)
    }

    const now = new Date()
    let created = 0

    for (const [key, group] of grouped) {
      if (group.length < 2) continue // need ≥2 purchases to predict

      const sorted = [...group].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      const last = sorted[sorted.length - 1]
      const count = sorted.length

      // Average gap between purchases in days
      let totalGap = 0
      for (let i = 1; i < sorted.length; i++) {
        totalGap += (sorted[i].createdAt.getTime() - sorted[i - 1].createdAt.getTime()) / 86_400_000
      }
      const avgFrequencyDays = Math.max(1, totalGap / (count - 1))

      // Estimate days until next purchase needed
      const daysSinceLast = (now.getTime() - last.createdAt.getTime()) / 86_400_000
      const daysRemaining = Math.max(0, avgFrequencyDays - daysSinceLast)
      const predictedDate = new Date(now.getTime() + daysRemaining * 86_400_000)

      // Confidence: higher with more data points
      const confidence = count >= 5 ? 0.9 : count >= 3 ? 0.75 : 0.55

      // Deactivate any existing active reminder for this item
      await prisma.reminder.updateMany({
        where: { userId: user.id, item: key, active: true },
        data: { active: false },
      })

      // Create the fresh prediction
      await prisma.reminder.create({
        data: {
          userId: user.id,
          item: key,
          predictedDate,
          confidence,
          active: true,
        },
      })

      created++
    }

    return Response.json({ ok: true, created })
  } catch (err) {
    console.error('[reminders/sync]', err)
    return Response.json({ error: 'Failed to sync reminders' }, { status: 500 })
  }
}
