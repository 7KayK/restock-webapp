import { currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import type { User } from '@prisma/client'

export async function getOrCreateUser(clerkId: string): Promise<User> {
  const existing = await prisma.user.findUnique({ where: { clerkId } })
  if (existing) return existing

  const clerkUser = await currentUser()
  const email = clerkUser?.emailAddresses[0]?.emailAddress ?? ''

  return prisma.user.create({
    data: { clerkId, email },
  })
}
