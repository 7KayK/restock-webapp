import { auth } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getOrCreateUser } from '@/lib/getOrCreateUser'

export async function POST(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json() as {
      completed?: { name: string; reminderId?: string }[]
    }
    const { completed } = body

    if (!Array.isArray(completed) || completed.length === 0) {
      return Response.json({ error: 'completed array is required' }, { status: 400 })
    }

    const user = await getOrCreateUser(userId)

    const reminderIds = completed
      .map((c) => c.reminderId)
      .filter((id): id is string => !!id)

    // Deactivate associated reminders
    if (reminderIds.length > 0) {
      await prisma.reminder.updateMany({
        where: { id: { in: reminderIds }, userId: user.id },
        data: { active: false },
      })
    }

    // Log manual completions for items without a reminder
    const manualItems = completed.filter((c) => !c.reminderId)
    if (manualItems.length > 0) {
      await Promise.all(
        manualItems.map((c) =>
          prisma.purchase.create({
            data: {
              userId:   user.id,
              item:     c.name.trim().toLowerCase(),
              quantity: 1,
              source:   'manual',
            },
          })
        )
      )
    }

    return Response.json({ data: { completedCount: completed.length } })
  } catch {
    return Response.json({ error: 'Failed to complete shopping trip' }, { status: 500 })
  }
}
