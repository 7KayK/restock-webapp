export interface User {
  id: string
  clerkId: string
  email: string
  telegramId?: string | null
  whatsappNumber?: string | null
  createdAt: Date
}

export interface Purchase {
  id: string
  userId: string
  item: string
  quantity: number
  unit?: string | null
  category?: string | null
  price?: number | null
  source: string
  createdAt: Date
}

export interface Reminder {
  id: string
  userId: string
  item: string
  predictedDate: Date
  confidence: number
  active: boolean
  snoozedUntil?: Date | null
  createdAt: Date
  updatedAt: Date
}

// --- Spend / analytics types ---

export interface MonthlySpendPoint {
  month: string      // 'YYYY-MM' key for sorting
  label: string      // 'Jan 2026' for display
  amount: number
  isCurrentMonth: boolean
}

export interface CategorySpend {
  category: string
  total: number
  count: number
  avg: number
}

export interface TopItem {
  item: string
  totalQty: number
  totalSpend: number
  purchaseCount: number
  lastPurchased: string // ISO string
}

export interface SpendAnalysis {
  byMonth: MonthlySpendPoint[]
  byCategory: CategorySpend[]
  topItems: TopItem[]
  currentMonthSpend: number
  previousMonthSpend: number
  changePercent: number | null
}

export interface DashboardStats {
  totalPurchases: number
  activeReminders: number
  monthlySpend: number
  itemsTracked: number
}

// --- Pantry types ---

export type PantryStatus = 'stocked' | 'low' | 'out'
export type PantryConfidence = 'high' | 'medium' | 'low'

export interface PantryItem {
  name: string
  category: string | null
  lastPurchasedAt: string     // ISO string
  quantity: number
  unit: string | null
  avgFrequencyDays: number
  estimatedRemaining: number  // percentage 0–100
  predictedDepletionDate: string // ISO string
  status: PantryStatus
  confidence: PantryConfidence
}

export interface PantryResponse {
  items: PantryItem[]
  counts: { stocked: number; low: number; out: number }
}

// --- API response wrapper ---

export interface ApiResponse<T> {
  data?: T
  error?: string
}

// --- Product search (Open Food Facts + Open Prices + Restock's own data) ---
//
// A free-text product search result, kept deliberately as three separate,
// clearly-sourced arrays rather than one blended list — see
// src/app/api/product-search/route.ts for why: mixing "a Restock user
// reported this price nearby" with "the global community reported this
// price somewhere" without labelling them would misrepresent what the
// number actually means.

export interface ProductMatch {
  code: string | null       // Open Food Facts barcode, when known
  productName: string
  brand: string
  imageUrl: string | null
  nutriscoreGrade: string | null
}

export interface CommunityPrice {
  productName: string
  brand: string
  imageUrl: string | null
  price: number
  currency: string
  date: string | null
  locationLabel: string | null
}

export interface SearchRegion {
  country: string
  countryCode: string
  currency: string
  region: string | null
  city: string | null
}

export interface ProductSearchResult {
  // The shopper's resolved test market, when their saved location maps to
  // one; null means results are unscoped/global.
  region?: SearchRegion | null
  query: string
  restockReports: PriceSighting[]   // Restock's own crowdsourced/receipt data
  communityPrices: CommunityPrice[] // Open Prices — global crowdsourced prices
  products: ProductMatch[]          // Open Food Facts — metadata only, no price
}

export interface FoodProduct {
  item: string           // user's purchase term
  productId: string      // OFF barcode
  productName: string
  brand: string
  imageUrl: string | null
  nutriscoreGrade: string | null  // 'a'|'b'|'c'|'d'|'e' or null
}

export interface UserSettings {
  email: string
  telegramId: string | null
  whatsappNumber: string | null
  createdAt: string
  locationLabel: string | null
  locationLat: number | null
  locationLng: number | null
}

export interface BotActivity {
  source: 'telegram' | 'whatsapp'
  count: number
  minutesAgo: number
}

export interface RecentActivity {
  found: boolean
  source: 'telegram' | 'whatsapp' | null
  count: number
  lastItem: string | null
  minutesAgo: number | null
}

export interface ChannelStatus {
  telegramId: string | null
  whatsappNumber: string | null
  recentBotActivity: BotActivity | null
  telegramLastAt: string | null
  whatsappLastAt: string | null
}

export interface ImageIntelligenceItem {
  name: string
  quantity: number
  unit: string | null
  price: number | null
  category: string
  status: string
  notes: string | null
}

export interface ImageIntelligenceResult {
  type: 'receipt' | 'shopping_bag' | 'pantry' | 'product_label' | 'unknown'
  confidence: number
  store: string | null
  date: string | null
  totalAmount: number | null
  currency: string | null
  items: ImageIntelligenceItem[]
  context: string
}

export interface TeamSummary {
  id: string
  name: string
  ownerId: string
  createdAt: Date
  owner: { email: string }
  _count: { members: number }
}

export interface TeamMemberWithUser {
  id: string
  teamId: string
  userId: string
  role: string
  joinedAt: Date
  user: { id: string; email: string }
}

export interface TeamDetail {
  id: string
  name: string
  ownerId: string
  createdAt: Date
  owner: { id: string; email: string }
  members: TeamMemberWithUser[]
}

export interface TeamPurchase {
  id: string
  item: string
  quantity: number
  unit: string | null
  category: string | null
  price: number | null
  source: string
  createdAt: Date
  user: { email: string }
}

export interface InventoryEntry {
  id: string
  item: string
  dueDate?: string
  lastPurchased?: string
}

export interface TeamInventory {
  out: InventoryEntry[]
  low: InventoryEntry[]
  ok: InventoryEntry[]
}

export interface Integration {
  provider: string
  connectedAt: string
}

export interface ShoppingItem {
  name: string
  quantity: number
  unit: string | null
  category: string | null
  source: 'reminder' | 'predicted' | 'manual' | 'pantry'
  reminderId?: string
  // Short, human-readable context for why this item is suggested — e.g.
  // "Running low - about 3 days remaining" (Pantry) or "Usually bought
  // every 12 days" (predicted). Null/undefined for a plain manual add.
  reason?: string | null
  done?: boolean // checked off mid-trip; persisted so it survives a reload
  prices?: PriceSighting[] // cheapest known nearby sightings, cheapest first
}

// --- Price sightings / cart builder ---

export interface PriceSighting {
  id: string
  item: string
  storeName: string
  storePlaceId: string | null
  storeLat: number | null
  storeLng: number | null
  price: number
  currency: string
  unit: string | null
  source: string
  createdAt: string
}

// One list line as the cart and trip endpoints receive it — quantity and
// unit ride along with the name so totals reflect how much is being bought.
export interface CartRequestItem {
  name: string
  quantity: number
  unit: string | null
}

export interface CartItemPrice {
  name: string
  quantity: number
  // Line total: the best matching report's price × quantity (null = unpriced).
  price: number | null
  storeName: string | null
  storePlaceId: string | null
}

export interface CartStoreOption {
  storeName: string
  storePlaceId: string | null
  storeLat: number | null
  storeLng: number | null
  currency: string
  coveredCount: number
  totalItems: number
  total: number
  items: CartItemPrice[]
}

// "Make the trip" — the same store option, plus what it costs to actually
// get there: drive time is traffic-aware (Google Routes), gasCost is a
// round-trip estimate, and tripTotal is basket price + gasCost when both
// are known. Any of the three is null when the store has no known location
// or routing failed for it — it still shows up priced, just without these.
export interface TripStoreOption extends CartStoreOption {
  driveMinutes: number | null
  distanceKm: number | null
  gasCost: number | null
  tripTotal: number | null
}

export interface TripResult {
  stores: TripStoreOption[]
  // Why drive time / gas is missing, when it is: 'no-coordinates' = none of
  // the priced stores has a saved map location (price reported as free text
  // or seeded from a receipt); 'routing-failed' = stores had locations but
  // Google's Routes API returned nothing (API not enabled, billing, key).
  routingNote?: 'no-coordinates' | 'routing-failed' | null
}

export interface MixedCart {
  currency: string
  total: number
  items: CartItemPrice[]
  missing: string[]
}

// Why a list item has no price: 'none' = nobody has reported one,
// 'stale' = only reports older than the freshness window exist,
// 'unit-mismatch' = fresh reports exist but in a unit that can't be compared
// to the list line (e.g. list says litres, report says a count).
export type UnpricedReason = 'none' | 'stale' | 'unit-mismatch'

export interface CartBuilderResult {
  byStore: CartStoreOption[]
  mixed: MixedCart[]
  unpriced: string[]
  unpricedReasons?: Record<string, UnpricedReason>
  // List lines priced from a report with a looser name (e.g. list "whole
  // milk 2l" priced from a report for "milk") — shown so it's never silent.
  similarMatches?: { listItem: string; reportedAs: string }[]
  // Typical prices for the shopper's area from official sources — an
  // estimate of what the list usually costs, not a price at any store.
  typical?: TypicalEstimate | null
  // True when no typical estimate was possible because the shopper hasn't
  // saved a location in a supported region yet.
  needsLocation?: boolean
}

export interface TypicalPriceLine {
  name: string
  quantity: number
  price: number            // line total for the quantity asked for
  currency: string
  packLabel: string | null // e.g. "4 L" — the pack size the source prices
  source: string
  period: string
  area: string             // "Saskatchewan" or "Canada"
  matchedAs: string        // the source's name for the item
  kind: 'exact' | 'similar'
  // Where the number comes from: an official statistic, or prices found on
  // public retailer pages by a live web lookup.
  basis: 'official' | 'web'
  // Web lookups only: the spread across the pages found, and those pages.
  low?: number
  high?: number
  links?: { retailer: string; url: string }[]
}

export interface TypicalEstimate {
  areaLabel: string
  currency: string
  items: TypicalPriceLine[]
  total: number
  covered: number
  totalItems: number
  sources: string[]
}

export interface GroceryStore {
  placeId: string
  name: string
  address: string     // Google Places vicinity (includes city)
  lat: number
  lng: number
  distanceKm: number
  rating?: number
  openNow?: boolean
  hoursToday: string  // 'Open now' | 'Closed' | 'Hours unavailable'
}
