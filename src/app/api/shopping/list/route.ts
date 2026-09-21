import { auth } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getOrCreateUser } from '@/lib/getOrCreateUser'
import {
  withListLock,
  getListRevision,
  bumpListRevision,
  loadPersistedList,
} from '@/lib/shoppingList'
import { priceFreshnessCutoff, toPriceSighting, dedupeCheapestPerStore } from '@/lib/priceSightings'
import type { ShoppingItem } from '@/types'

// Attaches each item's cheapest known nearby prices (crowdsourced for now —
// see src/lib/kroger.ts's doc comment for why there's no live store-price
// API behind this yet). Distance-weighting which sighting to show is a
// deliberately deferred follow-up (roadmap: location + prices now, then
// factor in distance-to-store on top of price) — for now this just surfaces
// the cheapest few reports for each item, regardless of how far the
// reporting store is.
async function attachPrices(items: ShoppingItem[]): Promise<ShoppingItem[]> {
  const names = [...new Set(items.map((it) => it.name))]
  if (names.length === 0) return items

  const sightings = await prisma.priceSighting.findMany({
    where: { item: { in: names }, createdAt: { gte: priceFreshnessCutoff() } },
    orderBy: { price: 'asc' },
  })

  const byItem = new Map<string, ShoppingItem['prices']>()
  for (const name of names) {
    const forItem = sightings.filter((s) => s.item === name).map(toPriceSighting)
    byItem.set(name, dedupeCheapestPerStore(forItem).slice(0, 3))
  }

  return items.map((it) => ({ ...it, prices: byItem.get(it.name) ?? [] }))
}

// Due reminders + frequently-bought items overdue by their average
// purchase interval — used only to seed a shopper's list the first time
// it's empty (new user, or just after a completed trip). Once seeded, the
// persisted ShoppingListItem rows are the source of truth, not this.
async function buildSmartList(userId: string): Promise<ShoppingItem[]> {
  const now = new Date()
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  const dueReminders = await prisma.reminder.findMany({
    where: {
      userId,
      active: true,
      predictedDate: { lte: sevenDaysFromNow },
    },
    orderBy: { predictedDate: 'asc' },
  })

  const reminderItems: ShoppingItem[] = dueReminders.map((r) => ({
    name:       r.item,
    quantity:   1,
    unit:       null,
    category:   null,
    source:     'reminder' as const,
    reminderId: r.id,
    reason:     'Reminder due',
  }))

  const reminderItemNames = new Set(dueReminders.map((r) => r.item))

  const allPurchases = await prisma.purchase.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' },
    select: { item: true, quantity: true, unit: true, category: true, createdAt: true },
  })

  type PurchaseRecord = { quantity: number; unit: string | null; category: string | null; createdAt: Date }
  const byItem = new Map<string, PurchaseRecord[]>()
  for (const p of allPurchases) {
    const list = byItem.get(p.item) ?? []
    list.push({ quantity: p.quantity, unit: p.unit, category: p.category, createdAt: p.createdAt })
    byItem.set(p.item, list)
  }

  const predicted: ShoppingItem[] = []
  for (const [item, records] of byItem) {
    if (reminderItemNames.has(item)) continue
    if (records.length < 3) continue

    let totalMs = 0
    for (let i = 1; i < records.length; i++) {
      totalMs += records[i].createdAt.getTime() - records[i - 1].createdAt.getTime()
    }
    const avgIntervalDays = totalMs / (records.length - 1) / (24 * 60 * 60 * 1000)
    const last = records[records.length - 1]
    const daysSinceLast = (now.getTime() - last.createdAt.getTime()) / (24 * 60 * 60 * 1000)

    if (daysSinceLast >= avgIntervalDays * 0.8) {
      predicted.push({
        name:     item,
        quantity: last.quantity,
        unit:     last.unit ?? null,
        category: last.category ?? null,
        source:   'predicted' as const,
        reason:   `Usually bought every ${Math.round(avgIntervalDays)} days`,
      })
    }
  }

  return [...reminderItems, ...predicted]
}

interface ListRow {
  userId:     string
  name:       string
  quantity:   number
  unit:       string | null
  category:   string | null
  source:     string
  reminderId: string | null
  reason:     string | null
  done?:      boolean
  position:   number
}

// Same rows, same order, same content — ignoring ids and timestamps.
function sameList(stored: Omit<ListRow, 'userId'>[], incoming: ListRow[]): boolean {
  return (
    stored.length === incoming.length &&
    stored.every((s, i) => {
      const n = incoming[i]
      return (
        s.name === n.name &&
        s.quantity === n.quantity &&
        s.unit === n.unit &&
        s.category === n.category &&
        s.source === n.source &&
        s.reminderId === n.reminderId &&
        s.reason === n.reason &&
        (s.done ?? false) === (n.done ?? false) &&
        s.position === n.position
      )
    })
  )
}

export async function GET(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const user = await getOrCreateUser(userId)
    // "Build from history" passes this to explicitly regenerate from
    // reminders/purchase history, overwriting whatever's currently on the
    // list — a normal page load should never silently do that.
    const forceRegenerate = request.nextUrl.searchParams.get('regenerate') === '1'

    // Revision is read before the rows: if a save lands in between, the
    // client ends up holding a revision older than its items, and its next
    // save is rejected as stale (safe) rather than accepted over newer data.
    let revision = await getListRevision(user.id)
    let items = forceRegenerate ? [] : await loadPersistedList(user.id)

    if (items.length === 0) {
      const suggested = await buildSmartList(user.id)
      // Only touch the persisted list if there's actually something to
      // replace it with. Without this guard, "Build from history" (or a
      // first-ever load with no reminder/purchase history yet) would wipe
      // any existing list and leave nothing in its place — a silent
      // data-loss trap rather than a real regeneration.
      if (suggested.length > 0) {
        const rows: ListRow[] = suggested.map((it, i) => ({
          userId:     user.id,
          name:       it.name,
          quantity:   Math.max(1, Math.round(it.quantity)),
          unit:       it.unit,
          category:   it.category,
          source:     it.source,
          reminderId: it.reminderId ?? null,
          reason:     it.reason ?? null,
          position:   i,
        }))

        // Delete + insert commit together or not at all, so a failed insert
        // can't leave the shopper's list wiped.
        const seeded = await withListLock(user.id, async (tx) => {
          // Re-check under the lock: another request (a second tab, or the
          // same page's double-fetch) may have seeded or saved a list while
          // the suggestions above were being computed. A plain load must
          // never clobber that; only an explicit regenerate replaces it.
          if (!forceRegenerate && (await tx.shoppingListItem.count({ where: { userId: user.id } })) > 0) {
            return null
          }
          await tx.shoppingListItem.deleteMany({ where: { userId: user.id } })
          await tx.shoppingListItem.createMany({ data: rows })
          return bumpListRevision(tx, user.id)
        })

        if (seeded !== null) {
          items = suggested
          revision = seeded
        } else {
          revision = await getListRevision(user.id)
          items = await loadPersistedList(user.id)
        }
      } else if (forceRegenerate) {
        // Nothing to regenerate from — return whatever's still persisted
        // instead of an empty list, so the button visibly does nothing
        // rather than looking like it silently wiped everything.
        items = await loadPersistedList(user.id)
      }
    }

    const withPrices = await attachPrices(items)
    return Response.json({ data: { items: withPrices, revision } })
  } catch (err) {
    console.error('[shopping list GET]', err)
    return Response.json({ error: 'Failed to build shopping list' }, { status: 500 })
  }
}

// Replaces the shopper's whole persisted list with whatever the client
// currently has on screen — called (debounced) on every add/edit/remove so
// the list survives a reload or a switch to another device instead of only
// living in that browser tab's state. Delete-all-and-recreate is simpler
// and safe at this list's size than diffing individual rows, and it keeps
// `position` trivially in sync with on-screen order.
//
// The body carries `baseRevision`: the list revision the client last saw. If
// the list has moved on since (another device saved, or the list was
// regenerated or completed), the save is rejected with 409 and the current
// list, so the client can show what's actually stored instead of silently
// overwriting it. A body without baseRevision (a tab still running an older
// bundle) skips the check rather than failing.
export async function PUT(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = (await request.json()) as { items?: unknown; baseRevision?: unknown }
    if (!Array.isArray(body.items)) {
      return Response.json({ error: 'items array is required' }, { status: 400 })
    }
    const baseRevision =
      typeof body.baseRevision === 'number' && Number.isInteger(body.baseRevision) ? body.baseRevision : null

    const user = await getOrCreateUser(userId)

    const rows = body.items
      .filter((it): it is ShoppingItem => !!it && typeof it === 'object' && typeof (it as ShoppingItem).name === 'string')
      .map((it, i) => ({
        userId:     user.id,
        name:       it.name,
        quantity:   Math.max(1, Math.round(it.quantity ?? 1)),
        unit:       it.unit ?? null,
        category:   it.category ?? null,
        source:     it.source ?? 'manual',
        reminderId: it.reminderId ?? null,
        reason:     it.reason ?? null,
        done:       it.done ?? false,
        position:   i,
      }))

    const outcome = await withListLock(user.id, async (tx) => {
      const current = await getListRevision(user.id, tx)

      // The client echoes the list back after loading, adopting a conflict
      // or regenerating; when that matches what's stored there's nothing to
      // write, and bumping the revision would make every other open device
      // hit a spurious conflict on its next edit.
      const stored = await tx.shoppingListItem.findMany({ where: { userId: user.id }, orderBy: { position: 'asc' } })
      if (sameList(stored, rows)) return { conflict: false as const, revision: current }

      if (baseRevision !== null && baseRevision !== current) {
        return { conflict: true as const, revision: current, items: await loadPersistedList(user.id, tx) }
      }
      await tx.shoppingListItem.deleteMany({ where: { userId: user.id } })
      if (rows.length > 0) await tx.shoppingListItem.createMany({ data: rows })
      return { conflict: false as const, revision: await bumpListRevision(tx, user.id) }
    })

    if (outcome.conflict) {
      const items = await attachPrices(outcome.items)
      return Response.json(
        { error: 'List was changed elsewhere', data: { items, revision: outcome.revision } },
        { status: 409 }
      )
    }

    return Response.json({ data: { savedCount: rows.length, revision: outcome.revision } })
  } catch (err) {
    console.error('[shopping list PUT]', err)
    return Response.json({ error: 'Failed to save shopping list' }, { status: 500 })
  }
}
