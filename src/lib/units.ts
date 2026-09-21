// Just enough unit handling to price a list line against a crowdsourced
// report whose package size is free text ("2L", "500 ml", "dozen", "2 x 500g").
// Not a general units library — anything it can't recognise falls back to
// "same label or don't compare" rather than guessing.

type Dimension = 'mass' | 'volume' | 'count'

interface Measure {
  dimension: Dimension
  // Amount in the dimension's base unit: grams, millilitres, or single items.
  amount: number
}

const UNITS: Record<string, { dimension: Dimension; factor: number }> = {
  // mass → grams
  g: { dimension: 'mass', factor: 1 },
  gram: { dimension: 'mass', factor: 1 },
  grams: { dimension: 'mass', factor: 1 },
  kg: { dimension: 'mass', factor: 1000 },
  kilogram: { dimension: 'mass', factor: 1000 },
  kilograms: { dimension: 'mass', factor: 1000 },
  lb: { dimension: 'mass', factor: 453.592 },
  lbs: { dimension: 'mass', factor: 453.592 },
  pound: { dimension: 'mass', factor: 453.592 },
  pounds: { dimension: 'mass', factor: 453.592 },
  oz: { dimension: 'mass', factor: 28.3495 },
  ounce: { dimension: 'mass', factor: 28.3495 },
  ounces: { dimension: 'mass', factor: 28.3495 },
  // volume → millilitres
  ml: { dimension: 'volume', factor: 1 },
  millilitre: { dimension: 'volume', factor: 1 },
  millilitres: { dimension: 'volume', factor: 1 },
  milliliter: { dimension: 'volume', factor: 1 },
  milliliters: { dimension: 'volume', factor: 1 },
  l: { dimension: 'volume', factor: 1000 },
  litre: { dimension: 'volume', factor: 1000 },
  litres: { dimension: 'volume', factor: 1000 },
  liter: { dimension: 'volume', factor: 1000 },
  liters: { dimension: 'volume', factor: 1000 },
  'fl oz': { dimension: 'volume', factor: 29.5735 },
  floz: { dimension: 'volume', factor: 29.5735 },
  qt: { dimension: 'volume', factor: 946.353 },
  quart: { dimension: 'volume', factor: 946.353 },
  quarts: { dimension: 'volume', factor: 946.353 },
  gal: { dimension: 'volume', factor: 3785.41 },
  gallon: { dimension: 'volume', factor: 3785.41 },
  gallons: { dimension: 'volume', factor: 3785.41 },
  // count → single items
  dozen: { dimension: 'count', factor: 12 },
  doz: { dimension: 'count', factor: 12 },
  each: { dimension: 'count', factor: 1 },
  ea: { dimension: 'count', factor: 1 },
  ct: { dimension: 'count', factor: 1 },
  count: { dimension: 'count', factor: 1 },
  pc: { dimension: 'count', factor: 1 },
  pcs: { dimension: 'count', factor: 1 },
  piece: { dimension: 'count', factor: 1 },
  pieces: { dimension: 'count', factor: 1 },
  pack: { dimension: 'count', factor: 1 },
  pk: { dimension: 'count', factor: 1 },
}

// "<n> x <n> <unit>", "<n> <unit>", or a bare "<unit>" (= 1 of it).
const MEASURE_PATTERN = /^(?:(\d+(?:\.\d+)?)\s*[x×]\s*)?(\d+(?:\.\d+)?)?\s*([a-z][a-z ]*)$/

function normalizeLabel(label: string | null): string | null {
  const text = label
    ?.trim()
    .toLowerCase()
    .replace(/(\d),(\d)/g, '$1.$2')
    .replace(/\./g, (m, offset: number, whole: string) => (/\d/.test(whole[offset - 1] ?? '') && /\d/.test(whole[offset + 1] ?? '') ? m : ''))
    .replace(/\s+/g, ' ')
  return text ? text : null
}

export function parseMeasure(label: string): Measure | null {
  const text = normalizeLabel(label)
  if (!text) return null
  const match = MEASURE_PATTERN.exec(text)
  if (!match) return null

  const unit = UNITS[match[3].trim()]
  if (!unit) return null

  const multiplier = match[1] ? parseFloat(match[1]) : 1
  const amount = match[2] ? parseFloat(match[2]) : 1
  const total = multiplier * amount * unit.factor
  return total > 0 ? { dimension: unit.dimension, amount: total } : null
}

// How many of a report's packages it takes to cover a list line, or null when
// the report can't be compared to it at all.
//
// - No unit on either side: the report is for whatever the list line counts
//   in, so it's just `quantity` of them (the common case — most reports have
//   no unit).
// - Both parse as measures of the same kind: whole packs needed, rounded up
//   (2 L against a 4 L jug is 1 pack; against 500 ml bottles it's 4).
// - Both parse but as different kinds (mass vs volume): not comparable.
// - Otherwise: comparable only if the labels match ("carton" vs "carton").
export function packsNeeded(
  quantity: number,
  requestedUnit: string | null,
  reportedUnit: string | null
): number | null {
  const requested = normalizeLabel(requestedUnit)
  const reported = normalizeLabel(reportedUnit)
  if (!requested || !reported) return quantity

  const req = parseMeasure(requested)
  const rep = parseMeasure(reported)
  if (req && rep) {
    if (req.dimension !== rep.dimension) return null
    // The epsilon keeps float noise (e.g. 1000/500.0000001) from adding a pack.
    return Math.max(1, Math.ceil((quantity * req.amount) / rep.amount - 1e-9))
  }

  return requested === reported ? quantity : null
}
