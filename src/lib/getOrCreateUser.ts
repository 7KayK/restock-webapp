import { currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import type { User } from '@prisma/client'

export async function getOrCreateUser(clerkId: string): Promise<User> {
  const existing = await prisma.user.findUnique({ where: { clerkId } })
  if (existing) return existing

  const clerkUser = await currentUser()
  const primaryEmail = clerkUser?.primaryEmailAddress ?? clerkUser?.emailAddresses[0]
  const email = primaryEmail?.emailAddress ?? ''
  // Only a verified address proves this Clerk account actually owns the
  // email — see the stale-row case below for why that matters.
  const emailIsVerified = primaryEmail?.verification?.status === 'verified'

  try {
    return await prisma.user.create({
      data: { clerkId, email },
    })
  } catch (err) {
    // email is @unique, so this create() can collide two different ways:
    // (1) a race — another request created the same clerkId a moment ago, or
    // (2) a stale row — an old User already holds this email under a
    //     different (no-longer-valid) clerkId, e.g. after a Clerk account
    //     reset. Either way, crashing the page is the wrong response —
    //     look the row back up instead, and for the stale-row case,
    //     reconcile it onto the current clerkId so future lookups work.
    //
    // The stale-row reconcile hands over an existing user's purchases, bot
    // links and team memberships, so it's only allowed when Clerk has
    // verified this account owns the email. An unverified address could be
    // typed by anyone; without this check, signing up with someone else's
    // email would take over their data.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      const byClerkId = await prisma.user.findUnique({ where: { clerkId } })
      if (byClerkId) return byClerkId

      if (email && emailIsVerified) {
        const byEmail = await prisma.user.findUnique({ where: { email } })
        if (byEmail) {
          // Guard on the clerkId we just read so a concurrent reconcile can't
          // be silently overwritten.
          return prisma.user.update({
            where: { id: byEmail.id, clerkId: byEmail.clerkId },
            data: { clerkId },
          })
        }
      }
    }
    throw err
  }
}
