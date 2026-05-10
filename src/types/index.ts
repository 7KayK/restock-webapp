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

// --- API response wrapper ---

export interface ApiResponse<T> {
  data?: T
  error?: string
}

export interface Deal {
  id: string
  item: string
  store: string
  originalPrice: number
  salePrice: number
  discount: number
  expiresAt?: string
}

export interface Store {
  id: string
  name: string
  address: string
  distance?: number
  lat?: number
  lng?: number
}
