import { auth } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getOrCreateUser } from '@/lib/getOrCreateUser'

type Params = { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, { params }: Params) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  try {
    const user = await getOrCreateUser(clerkId)
    const member = await prisma.teamMember.findFirst({ where: { teamId: id, userId: user.id } })
    if (!member) return Response.json({ error: 'Not a member of this team' }, { status: 403 })

    const purchases = await prisma.purchase.findMany({
      where: { teamId: id },
      include: { user: { select: { email: true } } },
      orderBy: { createdAt: 'desc' },
      take: 200,
    })

    return Response.json({ data: purchases })
  } catch {
    return Response.json({ error: 'Failed to fetch team purchases' }, { status: 500 })
  }
}
