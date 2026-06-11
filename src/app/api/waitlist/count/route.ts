import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const count = await prisma.waitlist.count()
    return Response.json({ count })
  } catch {
    return Response.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
