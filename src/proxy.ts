import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/api/purchases(.*)',
  '/api/reminders(.*)',
  '/api/spend(.*)',
  '/api/ai(.*)',
  '/api/deals(.*)',
  '/api/stores(.*)',
])

const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? ''
const hasValidClerkKey = publishableKey.startsWith('pk_live_') || publishableKey.startsWith('pk_test_') && !publishableKey.includes('placeholder')

export const proxy = hasValidClerkKey
  ? clerkMiddleware(async (auth, req) => {
      if (isProtectedRoute(req)) {
        await auth.protect()
      }
    })
  : (_req: NextRequest) => NextResponse.next()

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
