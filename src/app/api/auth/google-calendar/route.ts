import { auth } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'
import { getOAuthUrl } from '@/lib/googleCalendar'

export async function GET(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return Response.redirect(new URL('/sign-in', request.url))
  }

  if (!process.env.GOOGLE_CALENDAR_CLIENT_ID) {
    return Response.redirect(
      new URL('/dashboard/settings?error=calendar_not_configured', request.url)
    )
  }

  return Response.redirect(getOAuthUrl())
}
