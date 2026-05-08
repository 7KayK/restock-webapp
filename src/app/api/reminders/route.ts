import { auth } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (!user) return Response.json({ data: [] })

  const reminders = await prisma.reminder.findMany({
    where: { userId: user.id, active: true },
    orderBy: { predictedDate: 'asc' },
  })

  return Response.json({ data: reminders })
}

export async function PATCH(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { id, active, snoozedUntil } = body

  const user = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (!user) return Response.json({ error: 'User not found' }, { status: 404 })

  const reminder = await prisma.reminder.update({
    where: { id, userId: user.id },
    data: {
      ...(active !== undefined && { active }),
      ...(snoozedUntil !== undefined && { snoozedUntil: new Date(snoozedUntil) }),
    },
  })

  return Response.json({ data: reminder })
}
