import { auth } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  try {
    const body = await request.json()
    const { active, snoozedUntil } = body

    const user = await prisma.user.findUnique({ where: { clerkId: userId } })
    if (!user) return Response.json({ error: 'User not found' }, { status: 404 })

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

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  try {
    const user = await prisma.user.findUnique({ where: { clerkId: userId } })
    if (!user) return Response.json({ error: 'User not found' }, { status: 404 })

    await prisma.reminder.delete({ where: { id, userId: user.id } })

    return Response.json({ data: { id } })
  } catch {
    return Response.json({ error: 'Failed to delete reminder' }, { status: 500 })
  }
}
