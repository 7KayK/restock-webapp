import { auth } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getOrCreateUser } from '@/lib/getOrCreateUser'

type Params = { params: Promise<{ id: string }> }

async function assertMember(userId: string, teamId: string) {
  const member = await prisma.teamMember.findFirst({
    where: { teamId, userId },
  })
  return !!member
}

export async function GET(_request: NextRequest, { params }: Params) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  try {
    const user = await getOrCreateUser(clerkId)
    if (!await assertMember(user.id, id)) {
      return Response.json({ error: 'Not a member of this team' }, { status: 403 })
    }

    const team = await prisma.team.findUnique({
      where: { id },
      include: {
        owner:   { select: { id: true, email: true } },
        members: {
          include: { user: { select: { id: true, email: true } } },
          orderBy: { joinedAt: 'asc' },
        },
      },
    })
    if (!team) return Response.json({ error: 'Team not found' }, { status: 404 })

    return Response.json({ data: team })
  } catch {
    return Response.json({ error: 'Failed to fetch team' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  try {
    const body = await request.json() as { name?: string }
    const name = body.name?.trim()
    if (!name) return Response.json({ error: 'name is required' }, { status: 400 })

    const user = await getOrCreateUser(clerkId)

    const team = await prisma.team.findUnique({ where: { id }, select: { ownerId: true } })
    if (!team) return Response.json({ error: 'Team not found' }, { status: 404 })
    if (team.ownerId !== user.id) return Response.json({ error: 'Only the owner can rename the team' }, { status: 403 })

    const updated = await prisma.team.update({ where: { id }, data: { name } })
    return Response.json({ data: updated })
  } catch {
    return Response.json({ error: 'Failed to update team' }, { status: 500 })
  }
}
