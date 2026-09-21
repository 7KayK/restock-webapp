import { auth } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'
import { getOrCreateUser } from '@/lib/getOrCreateUser'
import { withListLock, bumpListRevision } from '@/lib/shoppingList'

// Single-item append used by Pantry's "Add to shopping" action (and any
// future caller that wants to add one item without holding the shopper's
// whole list). The Shopping page's own PUT replaces the entire persisted
// list from client-side state — that's fine there because the page loads
// and holds the current list in memory, but Pantry doesn't, so a
// read-modify-write from Pantry would risk clobbering a save made from an
// open Shopping tab. This does an atomic upsert-by-name under the same
// per-user advisory lock the rest of the list's writes use instead.
//
// If the item is already on the list, this just un-marks it done and
// refreshes its reason — it does not duplicate the row or downgrade a more
// specific source (e.g. a manually-added item stays 'manual').
export async function POST(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = (await request.json()) as {
      name?: unknown
      quantity?: unknown
      unit?: unknown
      category?: unknown
      reason?: unknown
    }
    const name = typeof body.name === 'string' ? body.name.trim().toLowerCase() : ''
    if (!name) return Response.json({ error: 'name is required' }, { status: 400 })

    const quantity = typeof body.quantity === 'number' && body.quantity > 0 ? Math.round(body.quantity) : 1
    const unit = typeof body.unit === 'string' && body.unit.trim() ? body.unit : null
    const category = typeof body.category === 'string' && body.category.trim() ? body.category : null
    const reason = typeof body.reason === 'string' && body.reason.trim() ? body.reason : null

    const user = await getOrCreateUser(userId)

    const revision = await withListLock(user.id, async (tx) => {
      const existing = await tx.shoppingListItem.findFirst({ where: { userId: user.id, name } })

      if (existing) {
        await tx.shoppingListItem.update({
          where: { id: existing.id },
          data: { done: false, reason: reason ?? existing.reason },
        })
      } else {
        const count = await tx.shoppingListItem.count({ where: { userId: user.id } })
        await tx.shoppingListItem.create({
          data: {
            userId: user.id,
            name,
            quantity,
            unit,
            category,
            source: 'pantry',
            reason,
            position: count,
          },
        })
      }

      return bumpListRevision(tx, user.id)
    })

    return Response.json({ data: { revision } })
  } catch (err) {
    console.error('[shopping add-item POST]', err)
    return Response.json({ error: 'Failed to add item to your shopping list' }, { status: 500 })
  }
}
