import { auth } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'
import { exchangeCodeForTokens } from '@/lib/googleCalendar'
import { getOrCreateUser } from '@/lib/getOrCreateUser'

export async function GET(request: NextRequest) {
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return Response.redirect(new URL('/sign-in', request.url))
  }

  const { searchParams } = new URL(request.url)
  const code  = searchParams.get('code')
  const error = searchParams.get('error')

  if (error || !code) {
    return Response.redirect(new URL('/dashboard/settings?error=calendar_denied', request.url))
  }

  try {
    const user = await getOrCreateUser(clerkId)
    await exchangeCodeForTokens(code, user.id)
    return Response.redirect(new URL('/dashboard/settings?success=calendar_connected', request.url))
  } catch {
    return Response.redirect(new URL('/dashboard/settings?error=calendar_failed', request.url))
  }
}
