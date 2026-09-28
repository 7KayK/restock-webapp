/**
 * Normalizes an item name into the key used to match crowdsourced price
 * sightings against shopping-list items and cart requests.
 *
 * This exists because of a real gap found in testing: searching "tortilla
 * wraps" returned zero prices even though the price-matching logic and
 * data model were both working exactly as designed — the miss was that
 * price lookups compare item names with an exact string match, so
 * "tortilla wraps" and "tortilla wrap" (or any other trivial wording
 * difference) were treated as two unrelated items.
 *
 * This is a conservative heuristic, not real NLP or a product-matching
 * system: it only closes the gap for simple singular/plural wording of the
 * same phrase, and it does not retroactively fix any sighting saved before
 * this normalization existed. It deliberately does NOT attempt synonyms or
 * brand normalization — "flour tortillas" still won't match "tortilla
 * wraps". That needs an actual product-matching layer, which is separate,
 * larger work, not this fix.
 */
export function normalizeItemKey(raw: string): string {
  const key = raw.trim().toLowerCase().replace(/\s+/g, ' ')
  if (key.length <= 3 || !key.endsWith('s')) return key

  // Already-singular words ending in "s" that a naive strip would break:
  // hummus, asparagus, citrus, molasses, swiss, ...
  if (/(ss|us|is)$/.test(key)) return key

  // "berries" -> "berry", "groceries" -> "grocery"
  if (key.endsWith('ies') && key.length > 4) return key.slice(0, -3) + 'y'

  // "boxes" -> "box", "batches" -> "batch", "dishes" -> "dish"
  if (/(ch|sh|x|z)es$/.test(key)) return key.slice(0, -2)

  // Regular plural: "wraps" -> "wrap", "eggs" -> "egg"
  return key.slice(0, -1)
}
