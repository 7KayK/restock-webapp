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

export interface SpendSummary {
  total: number
  byCategory: Record<string, number>
  byMonth: Array<{ month: string; amount: number }>
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

export interface ApiResponse<T> {
  data?: T
  error?: string
}
