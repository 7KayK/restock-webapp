import { auth } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getOrCreateUser } from '@/lib/getOrCreateUser'

export async function GET() {
  const { userId: clerkId } = await auth()
  if (!clerkId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const user = await getOrCreateUser(clerkId)

    const teams = await prisma.team.findMany({
      where: {
        OR: [
          { ownerId: user.id },
          { members: { some: { userId: user.id } } },
        ],
      },
      include: {
        _count: { select: { members: true } },
        owner:  { select: { email: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return Response.json({ data: teams })
  } catch {
    return Response.json({ error: 'Failed to fetch teams' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json() as { name?: string }
    const name = body.name?.trim()
    if (!name) return Response.json({ error: 'name is required' }, { status: 400 })

    const user = await getOrCreateUser(clerkId)

    const team = await prisma.team.create({
      data: {
        name,
        ownerId: user.id,
        members: {
          create: { userId: user.id, role: 'owner' },
        },
      },
      include: { members: true },
    })

    return Response.json({ data: team }, { status: 201 })
  } catch {
    return Response.json({ error: 'Failed to create team' }, { status: 500 })
  }
}
