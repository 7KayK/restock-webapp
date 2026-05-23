import { auth } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getOrCreateUser } from '@/lib/getOrCreateUser'

type Params = { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, { params }: Params) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  try {
    const user = await getOrCreateUser(clerkId)
    const member = await prisma.teamMember.findFirst({ where: { teamId: id, userId: user.id } })
    if (!member) return Response.json({ error: 'Not a member of this team' }, { status: 403 })

    const now = new Date()
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    const thirtyDaysAgo   = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const reminders = await prisma.reminder.findMany({
      where: { teamId: id, active: true },
      orderBy: { predictedDate: 'asc' },
    })

    const out = reminders
      .filter((r) => r.predictedDate < now)
      .map((r) => ({ id: r.id, item: r.item, dueDate: r.predictedDate.toISOString() }))

    const low = reminders
      .filter((r) => r.predictedDate >= now && r.predictedDate <= sevenDaysFromNow)
      .map((r) => ({ id: r.id, item: r.item, dueDate: r.predictedDate.toISOString() }))

    const reminderItems = new Set(reminders.map((r) => r.item))

    const recentPurchases = await prisma.purchase.findMany({
      where: { teamId: id, createdAt: { gte: thirtyDaysAgo } },
      orderBy: { createdAt: 'desc' },
    })

    const seen = new Set<string>()
    const ok = recentPurchases
      .filter((p) => {
        if (reminderItems.has(p.item)) return false
        if (seen.has(p.item)) return false
        seen.add(p.item)
        return true
      })
      .map((p) => ({ id: p.id, item: p.item, lastPurchased: p.createdAt.toISOString() }))

    return Response.json({ data: { out, low, ok } })
  } catch {
    return Response.json({ error: 'Failed to fetch inventory' }, { status: 500 })
  }
}
