import { prisma } from '@/lib/prisma'
import { parseMeasure } from '@/lib/units'
import { matchItemNames } from '@/lib/itemName'
import type { Region } from '@/lib/region'
import { lookupWebPrices, type WebPrice } from '@/lib/priceLookup'
import { normalizeItemKey } from '@/lib/itemName'
import type { CartRequestItem, TypicalEstimate, TypicalPriceLine } from '@/types'

// "What does this usually cost where I live?" — estimates a list from, in
// order: (1) a live web lookup of public retailer pages (src/lib/priceLookup.ts,
// works for any item, cached for days), then (2) official average prices in
// the TypicalPrice table where the web finds nothing. These are area-level
// figures from a named source, never prices at a particular store, and the UI
// says so. They let a list be estimated without relying on shoppers
// reporting prices.

interface TypicalRow {
  item: string
  label: string
  region: string | null
  price: number
  currency: string
  unit: string | null
  isDefault: boolean
  period: string
  source: string
}

// The price of the requested amount, or null if this row can't price the line.
// - List line has a unit (e.g. 2 L): scale the row's price by amount, only
//   when the row's pack is the same kind of measure (volume/mass/count).
// - No unit on the list line: use the row marked as the item's default pack,
//   times quantity, so "milk" isn't priced from a 4 L jug AND a 1 L bottle.
function linePrice(item: CartRequestItem, row: TypicalRow): number | null {
  const req = item.unit ? parseMeasure(item.unit) : null
  const pack = row.unit ? parseMeasure(row.unit) : null
  if (req) {
    if (!pack || pack.dimension !== req.dimension) return null
    return (row.price * item.quantity * req.amount) / pack.amount
  }
  return row.isDefault ? row.price * item.quantity : null
}

// Same idea for a web price (per standard unit): scale by the requested
// amount when the list line has a unit of the same kind, else per-unit × quantity.
function webScale(item: CartRequestItem, web: WebPrice): number | null {
  const req = item.unit ? parseMeasure(item.unit) : null
  const pack = parseMeasure(web.unit)
  if (!pack) return null
  if (req) {
    if (pack.dimension !== req.dimension) return null
    return (item.quantity * req.amount) / pack.amount
  }
  return item.quantity
}

export async function buildTypicalEstimate(
  items: CartRequestItem[],
  region: Region,
  opts: { allowLive?: boolean } = {}
): Promise<TypicalEstimate | null> {
  if (items.length === 0) return null

  const rows: TypicalRow[] = await prisma.typicalPrice.findMany({
    where: { countryCode: region.countryCode },
    select: { item: true, label: true, region: true, price: true, currency: true, unit: true, isDefault: true, period: true, source: true },
  })

  // Live web prices first (any item); official averages fill the gaps. The
  // web lookup is best-effort — if it fails, official averages still show.
  let web = new Map<string, WebPrice>()
  try {
    web = await lookupWebPrices(items.map((i) => i.name), region, { allowLive: opts.allowLive ?? true })
  } catch (err) {
    console.error('[typical web lookup]', err)
  }

  const wantedRegion = region.region?.trim().toLowerCase() ?? null
  const inArea = rows.filter((r) => r.region === null || (wantedRegion !== null && r.region.toLowerCase() === wantedRegion))

  const lines: TypicalPriceLine[] = []
  for (const item of items) {
    const w = web.get(normalizeItemKey(item.name))
    const scale = w ? webScale(item, w) : null
    if (w && scale !== null) {
      lines.push({
        name: item.name,
        quantity: item.quantity,
        price: Math.round(w.price * scale * 100) / 100,
        currency: w.currency,
        packLabel: `per ${w.unit.replace(/^1 /, '')}`,
        source: 'Web prices',
        period: w.fetchedAt.toISOString().slice(0, 10),
        area: region.region ?? region.country,
        matchedAs: item.name,
        kind: 'exact',
        basis: 'web',
        low: Math.round(w.low * scale * 100) / 100,
        high: Math.round(w.high * scale * 100) / 100,
        links: w.observations.map((o) => ({ retailer: o.retailer, url: o.url })),
      })
      continue
    }

    const candidates = inArea
      .map((row) => ({ row, kind: matchItemNames(item.name, row.item) }))
      .filter((c): c is { row: TypicalRow; kind: 'exact' | 'similar' } => c.kind !== null)
      // Prefer: exact name, then the shopper's own province over a national
      // figure, then the newest month.
      .sort(
        (a, b) =>
          Number(b.kind === 'exact') - Number(a.kind === 'exact') ||
          Number(b.row.region !== null) - Number(a.row.region !== null) ||
          b.row.period.localeCompare(a.row.period)
      )

    for (const { row, kind } of candidates) {
      const price = linePrice(item, row)
      if (price === null) continue
      lines.push({
        name: item.name,
        quantity: item.quantity,
        price: Math.round(price * 100) / 100,
        currency: row.currency,
        packLabel: row.unit,
        source: row.source,
        period: row.period,
        area: row.region ?? region.country,
        matchedAs: row.label,
        kind,
        basis: 'official',
      })
      break
    }
  }
  if (lines.length === 0) return null

  return {
    areaLabel: region.region ?? region.country,
    currency: region.currency,
    items: lines,
    total: Math.round(lines.reduce((sum, l) => sum + l.price, 0) * 100) / 100,
    covered: lines.length,
    totalItems: items.length,
    sources: [...new Set(lines.map((l) => `${l.source} (${l.period})`))],
  }
}
