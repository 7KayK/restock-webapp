import { auth } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getOrCreateUser } from '@/lib/getOrCreateUser'

export async function GET() {
  const { userId: clerkId } = await auth()
  if (!clerkId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const user = await getOrCreateUser(clerkId)
    const integrations = await prisma.userIntegration.findMany({
      where: { userId: user.id },
      select: { provider: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    })
    return Response.json({
      data: integrations.map((i) => ({
        provider: i.provider,
        connectedAt: i.createdAt.toISOString(),
      })),
    })
  } catch {
    return Response.json({ error: 'Failed to fetch integrations' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const provider = searchParams.get('provider')
  if (!provider) return Response.json({ error: 'provider is required' }, { status: 400 })

  try {
    const user = await getOrCreateUser(clerkId)
    await prisma.userIntegration.deleteMany({ where: { userId: user.id, provider } })
    return Response.json({ data: { disconnected: true } })
  } catch {
    return Response.json({ error: 'Failed to disconnect' }, { status: 500 })
  }
}
