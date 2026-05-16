import { auth } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getOrCreateUser } from '@/lib/getOrCreateUser'
import { Prisma } from '@prisma/client'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const user = await getOrCreateUser(userId)
    return Response.json({
      data: {
        email: user.email,
        telegramId: user.telegramId,
        whatsappNumber: user.whatsappNumber,
        createdAt: user.createdAt,
      },
    })
  } catch {
    return Response.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = (await request.json()) as Record<string, unknown>
    const user = await getOrCreateUser(userId)

    const update: { telegramId?: string | null; whatsappNumber?: string | null } = {}

    if ('telegramId' in body) {
      const val = body.telegramId
      update.telegramId = val === null || val === '' ? null : String(val).trim()
    }

    if ('whatsappNumber' in body) {
      const val = body.whatsappNumber
      if (val !== null && val !== '') {
        const phone = String(val).trim().replace(/\s+/g, '')
        if (!/^\+[1-9]\d{7,14}$/.test(phone)) {
          return Response.json(
            { error: 'Enter a valid number in E.164 format, e.g. +15551234567' },
            { status: 400 }
          )
        }
        update.whatsappNumber = phone
      } else {
        update.whatsappNumber = null
      }
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: update,
    })

    return Response.json({
      data: {
        email: updated.email,
        telegramId: updated.telegramId,
        whatsappNumber: updated.whatsappNumber,
        createdAt: updated.createdAt,
      },
    })
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return Response.json(
        { error: 'This Telegram ID or WhatsApp number is already linked to another account' },
        { status: 409 }
      )
    }
    return Response.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}
