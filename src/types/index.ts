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
  source: 'reminder' | 'predicted' | 'manual'
  reminderId?: string
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
