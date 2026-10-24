import type { GroceryStore, StoreTier, TypicalEstimate, BestStoreOption } from '@/types'
import type { RouteMatrixEntry } from '@/lib/routes'
import { estimateGasCost, timeValuePerMinute } from '@/lib/tripCost'

// Typical prices describe a "typical" shelf. Real stores sit above or below
// that depending on what kind of store they are. These multipliers are
// deliberately simple, rounded assumptions (not measured data) and the UI says
// so. They exist so a discount grocer, a regular chain and a corner shop don't
// all look identical.
const TIER_FACTOR: Record<StoreTier, number> = {
  discount: 0.92,
  regular: 1.0,
  premium: 1.15,
  convenience: 1.25,
  dollar: 0.95,
  specialty: 1.05,
}

export const TIER_LABEL: Record<StoreTier, string> = {
  discount: 'Discount grocer',
  regular: 'Regular supermarket',
  premium: 'Premium / specialty-food store',
  convenience: 'Convenience store',
  dollar: 'Dollar store',
  specialty: 'Ethnic / specialty grocer',
}

// Checked in order; first match wins.
const CHAIN_RULES: { tier: StoreTier; re: RegExp }[] = [
  { tier: 'dollar', re: /dollarama|dollar tree|dollar store|dollar city|dollar general|poundland|pound stretcher|b&m|everything.*\$?1/i },
  { tier: 'convenience', re: /7-?eleven|circle k|mac'?s|convenience|\bsparx?\b|centra|londis|costcutter|nisa|gas|petro|esso|shell|fas gas|husky|co-?op.*gas|\bmini.?mart\b/i },
  { tier: 'premium', re: /whole foods|farm boy|longo|nature'?s fare|planet organic|choices market|organic|waitrose|marks (&|and) spencer|m&s|fortnum|sprouts|natural/i },
  { tier: 'specialty', re: /halal|african|afro|caribbean|nigerian|ethnic|asian|oriental|chinese|indian|middle eastern|international|ghana|naija|african market|t&t|h mart|lebanese|mediterranean|south asian/i },
  { tier: 'discount', re: /walmart|no frills|superstore|freshco|food basics|costco|giant tiger|aldi|lidl|iceland|asda|dunnes|farm ?fresh|save a lot|price chopper|justrite|savemore|bargain|wholesale|cash (&|and) carry|real canadian/i },
  { tier: 'regular', re: /safeway|sobeys|co-?op|iga|loblaws|metro|save-?on|tesco|sainsbury|morrisons|supervalu|shoprite|spar|ebeano|market|supermarket|grocer|foods?/i },
]

export function classifyStore(name: string): StoreTier {
  for (const rule of CHAIN_RULES) if (rule.re.test(name)) return rule.tier
  return 'regular'
}

const FRESH_MEAT_FISH = /meat|pork|beef|chicken|turkey|lamb|goat|ribs?|steak|sausage|bacon|ham\b|fish|basa|tilapia|salmon|cod|shrimp|prawn|catfish|croaker|mackerel/i
const FRESH_DAIRY_EGGS = /milk|egg|cheese|butter|yogh?urt|cream|margarine/i
const FRESH_PRODUCE = /apple|banana|tomato|onion|potato|yam|plantain|lettuce|spinach|cabbage|carrot|pepper|cucumber|orange|lemon|mango|pineapple|berries|grapes|garlic|ginger|ugu|fruit|vegetable|produce|herb/i

// Whether this kind of store plausibly stocks an item. Categories only — Restock
// has no live shelf data, so this is a judgement call, shown as "may not
// stock", never as a fact.
export function probablyCarries(tier: StoreTier, itemName: string): boolean {
  if (tier === 'dollar') {
    return !(FRESH_MEAT_FISH.test(itemName) || FRESH_DAIRY_EGGS.test(itemName) || FRESH_PRODUCE.test(itemName))
  }
  if (tier === 'convenience') {
    return !(FRESH_MEAT_FISH.test(itemName) || FRESH_PRODUCE.test(itemName))
  }
  return true
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

// Roads are longer than straight lines; used only when Google routing is unavailable.
const ROAD_FACTOR = 1.3
const FALLBACK_KMH = 35
const EXTRA_STOP_MINUTES = 15 // time cost of a second stop when a store lacks items

export function rankStores(args: {
  stores: GroceryStore[]
  drives: RouteMatrixEntry[]
  typical: TypicalEstimate
}): BestStoreOption[] {
  const { stores, drives, typical } = args
  const currency = typical.currency
  const perMin = timeValuePerMinute(currency)

  const options: BestStoreOption[] = stores.map((s, i) => {
    const tier = classifyStore(s.name)
    const drive = drives[i]
    const routed = drive?.distanceMeters != null && drive?.durationSec != null
    const distanceKm = routed
      ? Math.round((drive.distanceMeters! / 1000) * 10) / 10
      : Math.round(s.distanceKm * ROAD_FACTOR * 10) / 10
    const oneWayMin = routed
      ? Math.round(drive.durationSec! / 60)
      : Math.round((distanceKm / FALLBACK_KMH) * 60)

    let carriedSum = 0
    let missingSum = 0
    const likelyMissing: string[] = []
    for (const line of typical.items) {
      if (probablyCarries(tier, line.name)) carriedSum += line.price
      else {
        missingSum += line.price
        likelyMissing.push(line.name)
      }
    }

    const basket = round2(carriedSum * TIER_FACTOR[tier])
    const fuelCost = estimateGasCost(distanceKm * 1000 * 2, currency)
    const extra = likelyMissing.length > 0 ? EXTRA_STOP_MINUTES : 0
    const timeCost = round2((oneWayMin * 2 + extra) * perMin)
    const allIn = round2(basket + missingSum + fuelCost + timeCost)

    return {
      rank: 0,
      best: false,
      storeName: s.name,
      placeId: s.placeId,
      address: s.address,
      lat: s.lat,
      lng: s.lng,
      tier,
      tierLabel: TIER_LABEL[tier],
      openNow: s.openNow,
      rating: s.rating,
      currency,
      basket,
      missingValue: round2(missingSum),
      likelyMissing,
      fuelCost,
      timeCost,
      driveMinutes: routed ? oneWayMin : null,
      distanceKm,
      routed,
      allIn,
      directionsUrl: `https://www.google.com/maps/dir/?api=1&destination=${s.lat},${s.lng}&destination_place_id=${encodeURIComponent(s.placeId)}&travelmode=driving`,
    }
  })

  options.sort((a, b) => a.allIn - b.allIn)
  options.forEach((o, idx) => {
    o.rank = idx + 1
    o.best = idx === 0
  })
  return options
}
