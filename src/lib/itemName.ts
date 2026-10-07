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

// Words that describe size/quantity rather than the product itself, so
// "whole milk 2l" still reduces to the tokens ["whole", "milk"].
const NOISE_TOKENS = new Set([
  'the', 'and', 'of', 'a', 'pack', 'packs', 'box', 'bag', 'bottle', 'bottles', 'can', 'cans', 'carton',
  'ml', 'l', 'g', 'kg', 'lb', 'lbs', 'oz', 'pc', 'pcs', 'ct', 'dozen', 'each',
])

export function itemTokens(raw: string): string[] {
  return raw
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ') // drops digits, %, punctuation
    .split(/\s+/)
    .filter((t) => t.length >= 2 && !NOISE_TOKENS.has(t))
    .map(normalizeItemKey)
}

// How a crowdsourced price report's item name relates to a shopping-list
// line: 'exact' (same after normalization), 'similar' (the report's name is
// a plain-language subset of the list line, e.g. report "milk" for list
// "whole milk 2l"), or null. Deliberately one-directional: a report for
// "coconut milk" is NOT used for a list line "milk". Callers must tell the
// shopper when a price came from a 'similar' match.
export function matchItemNames(listName: string, reportedName: string): 'exact' | 'similar' | null {
  if (normalizeItemKey(listName) === normalizeItemKey(reportedName)) return 'exact'
  const listTokens = new Set(itemTokens(listName))
  const reported = itemTokens(reportedName)
  if (reported.length === 0 || listTokens.size === 0) return null
  return reported.every((t) => listTokens.has(t)) ? 'similar' : null
}
