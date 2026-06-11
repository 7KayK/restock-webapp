import { prisma } from '@/lib/prisma'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json()

    if (
      typeof body !== 'object' ||
      body === null ||
      !('name' in body) ||
      !('email' in body) ||
      !('country' in body)
    ) {
      return Response.json({ error: 'name, email, and country are required' }, { status: 400 })
    }

    const { name, email, country } = body as Record<string, unknown>

    if (typeof name !== 'string' || name.trim().length === 0) {
      return Response.json({ error: 'name is required' }, { status: 400 })
    }
    if (typeof email !== 'string' || !EMAIL_RE.test(email.trim())) {
      return Response.json({ error: 'A valid email address is required' }, { status: 400 })
    }
    if (typeof country !== 'string' || country.trim().length === 0) {
      return Response.json({ error: 'country is required' }, { status: 400 })
    }

    const existing = await prisma.waitlist.findUnique({
      where: { email: email.trim().toLowerCase() },
    })

    if (existing) {
      return Response.json({ error: 'duplicate' }, { status: 409 })
    }

    await prisma.waitlist.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        country: country.trim(),
      },
    })

    const position = await prisma.waitlist.count()

    return Response.json({ success: true, position }, { status: 201 })
  } catch {
    return Response.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
