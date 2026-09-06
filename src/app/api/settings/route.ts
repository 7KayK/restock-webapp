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
        locationLabel: user.locationLabel,
        locationLat: user.locationLat,
        locationLng: user.locationLng,
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

    const update: {
      telegramId?: string | null
      whatsappNumber?: string | null
      locationLabel?: string | null
      locationLat?: number | null
      locationLng?: number | null
      locationUpdatedAt?: Date | null
    } = {}

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

    // Location is a single "current location" — either clear it entirely
    // (locationLabel: null) or set all three fields together.
    if ('locationLabel' in body || 'locationLat' in body || 'locationLng' in body) {
      const { locationLabel, locationLat, locationLng } = body

      if (locationLabel === null) {
        update.locationLabel = null
        update.locationLat = null
        update.locationLng = null
        update.locationUpdatedAt = null
      } else {
        if (typeof locationLabel !== 'string' || locationLabel.trim().length === 0) {
          return Response.json({ error: 'locationLabel is required to set a location' }, { status: 400 })
        }
        if (typeof locationLat !== 'number' || locationLat < -90 || locationLat > 90) {
          return Response.json({ error: 'locationLat must be a number between -90 and 90' }, { status: 400 })
        }
        if (typeof locationLng !== 'number' || locationLng < -180 || locationLng > 180) {
          return Response.json({ error: 'locationLng must be a number between -180 and 180' }, { status: 400 })
        }
        update.locationLabel = locationLabel.trim()
        update.locationLat = locationLat
        update.locationLng = locationLng
        update.locationUpdatedAt = new Date()
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
        locationLabel: updated.locationLabel,
        locationLat: updated.locationLat,
        locationLng: updated.locationLng,
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
