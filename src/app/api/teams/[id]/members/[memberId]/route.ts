import { auth } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getOrCreateUser } from '@/lib/getOrCreateUser'

type Params = { params: Promise<{ id: string; memberId: string }> }

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: teamId, memberId } = await params

  try {
    const user = await getOrCreateUser(clerkId)

    const team = await prisma.team.findUnique({ where: { id: teamId }, select: { ownerId: true } })
    if (!team) return Response.json({ error: 'Team not found' }, { status: 404 })

    const target = await prisma.teamMember.findUnique({ where: { id: memberId } })
    if (!target || target.teamId !== teamId) {
      return Response.json({ error: 'Member not found' }, { status: 404 })
    }

    // Owner can remove anyone; members can only remove themselves
    const isSelf  = target.userId === user.id
    const isOwner = team.ownerId === user.id
    if (!isSelf && !isOwner) {
      return Response.json({ error: 'Not authorised to remove this member' }, { status: 403 })
    }

    // Prevent owner from removing themselves
    if (target.userId === team.ownerId) {
      return Response.json({ error: 'Owner cannot be removed — transfer ownership first' }, { status: 400 })
    }

    await prisma.teamMember.delete({ where: { id: memberId } })

    return Response.json({ data: { id: memberId } })
  } catch {
    return Response.json({ error: 'Failed to remove member' }, { status: 500 })
  }
}
