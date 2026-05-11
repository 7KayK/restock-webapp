import { auth } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getOrCreateUser } from '@/lib/getOrCreateUser'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const user = await getOrCreateUser(userId)

    const reminders = await prisma.reminder.findMany({
      where: { userId: user.id, active: true },
      orderBy: { predictedDate: 'asc' },
    })

    return Response.json({ data: reminders })
  } catch {
    return Response.json({ error: 'Failed to fetch reminders' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { id, active, snoozedUntil } = body

    if (!id) return Response.json({ error: 'id is required' }, { status: 400 })

    const user = await getOrCreateUser(userId)

    const reminder = await prisma.reminder.update({
      where: { id, userId: user.id },
      data: {
        ...(active !== undefined && { active }),
        ...(snoozedUntil !== undefined && {
          snoozedUntil: snoozedUntil ? new Date(snoozedUntil) : null,
        }),
      },
    })

    return Response.json({ data: reminder })
  } catch {
    return Response.json({ error: 'Failed to update reminder' }, { status: 500 })
  }
}
