import { auth } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getOrCreateUser } from '@/lib/getOrCreateUser'

type Params = { params: Promise<{ id: string }> }

export async function POST(request: NextRequest, { params }: Params) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: teamId } = await params

  try {
    const body = await request.json() as { email?: string }
    const email = body.email?.trim().toLowerCase()
    if (!email) return Response.json({ error: 'email is required' }, { status: 400 })

    const owner = await getOrCreateUser(clerkId)

    const team = await prisma.team.findUnique({ where: { id: teamId }, select: { ownerId: true } })
    if (!team) return Response.json({ error: 'Team not found' }, { status: 404 })
    if (team.ownerId !== owner.id) return Response.json({ error: 'Only the owner can add members' }, { status: 403 })

    const invitee = await prisma.user.findUnique({ where: { email } })
    if (!invitee) return Response.json({ error: 'No Restock account found for that email' }, { status: 404 })

    const existing = await prisma.teamMember.findFirst({ where: { teamId, userId: invitee.id } })
    if (existing) return Response.json({ error: 'User is already a member' }, { status: 409 })

    const member = await prisma.teamMember.create({
      data: { teamId, userId: invitee.id, role: 'member' },
      include: { user: { select: { id: true, email: true } } },
    })

    return Response.json({ data: member }, { status: 201 })
  } catch {
    return Response.json({ error: 'Failed to add member' }, { status: 500 })
  }
}
