import { auth } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getOrCreateUser } from '@/lib/getOrCreateUser'
import type { ImageIntelligenceItem } from '@/types'

type ActionType = 'purchases' | 'reminders' | 'calendar'

function buildCalendarUrl(date: Date, itemNames: string[]): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  const y   = date.getFullYear()
  const m   = pad(date.getMonth() + 1)
  const d   = pad(date.getDate())
  const nd  = new Date(date.getTime() + 86_400_000)
  const ny  = nd.getFullYear()
  const nm  = pad(nd.getMonth() + 1)
  const ndd = pad(nd.getDate())

  const title   = encodeURIComponent('Restock Shopping Trip')
  const dates   = `${y}${m}${d}/${ny}${nm}${ndd}`
  const details = encodeURIComponent(
    itemNames.length
      ? `Items to buy: ${itemNames.join(', ')}\n\nCreated by Restock.`
      : 'Created by Restock.'
  )
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}`
}

export async function POST(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json() as {
      action?: ActionType
      items?: ImageIntelligenceItem[]
      calendarDate?: string
      teamId?: string | null
    }

    const { action, items, calendarDate, teamId } = body

    if (!action || !['purchases', 'reminders', 'calendar'].includes(action)) {
      return Response.json({ error: 'action must be purchases, reminders, or calendar' }, { status: 400 })
    }
    if (!Array.isArray(items) || items.length === 0) {
      return Response.json({ error: 'items array is required and must not be empty' }, { status: 400 })
    }

    const user = await getOrCreateUser(userId)

    if (action === 'purchases') {
      const purchases = await Promise.all(
        items.map((item) =>
          prisma.purchase.create({
            data: {
              userId:   user.id,
              teamId:   teamId ?? null,
              item:     item.name.trim().toLowerCase(),
              quantity: item.quantity ?? 1,
              unit:     item.unit ?? null,
              category: item.category ?? null,
              price:    item.price ?? null,
              source:   'image',
            },
          })
        )
      )
      return Response.json({ data: { purchases } }, { status: 201 })
    }

    if (action === 'reminders') {
      const predictedDate = calendarDate
        ? new Date(calendarDate)
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

      const reminders = await Promise.all(
        items.map((item) =>
          prisma.reminder.create({
            data: {
              userId:        user.id,
              teamId:        teamId ?? null,
              item:          item.name.trim().toLowerCase(),
              predictedDate,
              confidence:    0.8,
            },
          })
        )
      )
      return Response.json({ data: { reminders } }, { status: 201 })
    }

    // calendar — no DB write, return quick-add URL
    const date = calendarDate ? new Date(calendarDate) : new Date()
    const calendarUrl = buildCalendarUrl(date, items.map((it) => it.name))
    return Response.json({ data: { calendarUrl } })
  } catch {
    return Response.json({ error: 'Failed to save items' }, { status: 500 })
  }
}
