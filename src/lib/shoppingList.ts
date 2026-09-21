import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import type { ShoppingItem } from '@/types'

type Db = Prisma.TransactionClient | typeof prisma

// Every write to a shopper's persisted list runs inside one transaction that
// first takes a per-user Postgres advisory lock. The lock serialises the
// writers that can otherwise interleave — the first-load seed, "Build from
// history", the client's debounced PUT and trip completion — so two
// overlapping requests can't both delete-then-insert into each other's rows
// and leave duplicates or drop a just-saved list. It's released automatically
// when the transaction ends.
export async function withListLock<T>(
  userId: string,
  fn: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${userId}))`
    return fn(tx)
  })
}

// The list's current revision (0 when nothing has been written yet). Clients
// send the revision they last saw with each save; a mismatch means another
// device wrote in between, so the save is rejected instead of clobbering it.
export async function getListRevision(userId: string, db: Db = prisma): Promise<number> {
  const row = await db.shoppingList.findUnique({ where: { userId }, select: { revision: true } })
  return row?.revision ?? 0
}

// Call inside withListLock after any change to the list's rows. Returns the
// new revision.
export async function bumpListRevision(tx: Prisma.TransactionClient, userId: string): Promise<number> {
  const row = await tx.shoppingList.upsert({
    where: { userId },
    create: { userId, revision: 1 },
    update: { revision: { increment: 1 } },
    select: { revision: true },
  })
  return row.revision
}

export async function loadPersistedList(userId: string, db: Db = prisma): Promise<ShoppingItem[]> {
  const rows = await db.shoppingListItem.findMany({
    where: { userId },
    orderBy: { position: 'asc' },
  })
  return rows.map((it) => ({
    name:       it.name,
    quantity:   it.quantity,
    unit:       it.unit,
    category:   it.category,
    source:     it.source as ShoppingItem['source'],
    reminderId: it.reminderId ?? undefined,
    reason:     it.reason ?? null,
    done:       it.done,
  }))
}
