import { prisma } from '@/lib/prisma'
import { rateLimit } from '@/lib/rate-limit'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const VALID_SEGMENTS = ['household', 'solo', 'growing', 'procurement', 'curious']

function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) return forwardedFor.split(',')[0].trim()
  return request.headers.get('x-real-ip') ?? 'unknown'
}

export async function POST(request: Request) {
  // This is a new public, unauthenticated write surface (the Restock
  // Readiness Assessment submits here too), so it's rate-limited per IP.
  const ip = getClientIp(request)
  const { ok, retryAfterMs } = rateLimit(`waitlist:${ip}`, { limit: 5, windowMs: 10 * 60 * 1000 })
  if (!ok) {
    return Response.json(
      { error: 'Too many requests. Please try again shortly.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(retryAfterMs / 1000)) } }
    )
  }

  try {
    const body: unknown = await request.json()

    if (typeof body !== 'object' || body === null) {
      return Response.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const { name, email, country, phone, segment, score, answers } = body as Record<string, unknown>

    if (typeof name !== 'string' || name.trim().length === 0) {
      return Response.json({ error: 'name is required' }, { status: 400 })
    }
    if (typeof email !== 'string' || !EMAIL_RE.test(email.trim())) {
      return Response.json({ error: 'A valid email address is required' }, { status: 400 })
    }
    if (country !== undefined && country !== null && typeof country !== 'string') {
      return Response.json({ error: 'country must be a string' }, { status: 400 })
    }
    if (phone !== undefined && phone !== null && typeof phone !== 'string') {
      return Response.json({ error: 'phone must be a string' }, { status: 400 })
    }
    if (segment !== undefined && segment !== null && (typeof segment !== 'string' || !VALID_SEGMENTS.includes(segment))) {
      return Response.json({ error: 'Invalid segment' }, { status: 400 })
    }
    if (score !== undefined && score !== null && (typeof score !== 'number' || score < 0 || score > 100)) {
      return Response.json({ error: 'Invalid score' }, { status: 400 })
    }
    if (answers !== undefined && answers !== null && typeof answers !== 'object') {
      return Response.json({ error: 'answers must be an object' }, { status: 400 })
    }

    const normalizedEmail = email.trim().toLowerCase()
    const existing = await prisma.waitlist.findUnique({ where: { email: normalizedEmail } })

    // Re-taking the assessment (or resubmitting the simple waitlist form)
    // with an email already on the list updates that record instead of
    // hard-rejecting it — a returning visitor shouldn't dead-end here.
    if (existing) {
      await prisma.waitlist.update({
        where: { email: normalizedEmail },
        data: {
          name: name.trim(),
          ...(typeof country === 'string' ? { country: country.trim() } : {}),
          ...(phone !== undefined ? { phone: typeof phone === 'string' ? phone.trim() || null : null } : {}),
          ...(typeof segment === 'string' ? { segment } : {}),
          ...(typeof score === 'number' ? { score } : {}),
          ...(answers !== undefined && answers !== null ? { answers: answers as object } : {}),
        },
      })
      const position = await prisma.waitlist.count()
      return Response.json({ success: true, position, updated: true }, { status: 200 })
    }

    await prisma.waitlist.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        country: typeof country === 'string' ? country.trim() : null,
        phone: typeof phone === 'string' ? phone.trim() || null : null,
        segment: typeof segment === 'string' ? segment : null,
        score: typeof score === 'number' ? score : null,
        answers: answers !== undefined && answers !== null ? (answers as object) : undefined,
      },
    })

    const position = await prisma.waitlist.count()

    return Response.json({ success: true, position }, { status: 201 })
  } catch (err) {
    console.error('[api/waitlist] POST failed', err)
    return Response.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
