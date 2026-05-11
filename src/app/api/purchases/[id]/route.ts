import { auth } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getOrCreateUser } from '@/lib/getOrCreateUser'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  try {
    const user = await getOrCreateUser(userId)

    await prisma.purchase.delete({ where: { id, userId: user.id } })

    return Response.json({ data: { id } })
  } catch {
    return Response.json({ error: 'Failed to delete purchase' }, { status: 500 })
  }
}
