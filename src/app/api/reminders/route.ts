import { auth } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getOrCreateUser } from '@/lib/getOrCreateUser'
import { createCalendarEvent } from '@/lib/googleCalendar'

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

export async function POST(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json() as {
      item?:          string
      predictedDate?: string
      confidence?:    number
    }

    const { item, predictedDate, confidence } = body
    if (!item?.trim())      return Response.json({ error: 'item is required' }, { status: 400 })
    if (!predictedDate)     return Response.json({ error: 'predictedDate is required' }, { status: 400 })
    if (confidence == null) return Response.json({ error: 'confidence is required' }, { status: 400 })

    const user = await getOrCreateUser(userId)
    const date = new Date(predictedDate)

    const reminder = await prisma.reminder.create({
      data: {
        userId:       user.id,
        item:         item.trim(),
        predictedDate: date,
        confidence,
      },
    })

    // Fire-and-forget: create calendar event if Google Calendar is connected
    const integration = await prisma.userIntegration.findFirst({
      where: { userId: user.id, provider: 'google_calendar' },
    })
    if (integration) {
      createCalendarEvent(user.id, {
        title:       `Restock: ${reminder.item}`,
        date,
        description: `Restock reminder — time to buy ${reminder.item}.\n\nCreated by Restock.`,
      }).catch(() => { /* calendar failure must not break the reminder */ })
    }

    return Response.json({ data: reminder }, { status: 201 })
  } catch {
    return Response.json({ error: 'Failed to create reminder' }, { status: 500 })
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
