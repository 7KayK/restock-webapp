import type { CartRequestItem, ShoppingItem } from '@/types'

// Client-safe (no server imports) so CartBuilder and TripPlanner build the
// request body the same way. The server merges duplicate names, so this can
// map the list line-for-line.
export function toCartRequestItems(items: ShoppingItem[]): CartRequestItem[] {
  return items.map((it) => ({ name: it.name, quantity: it.quantity, unit: it.unit }))
}
