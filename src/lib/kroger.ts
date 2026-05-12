import type { KrogerDeal, KrogerStore } from '@/types'

const BASE = 'https://api.kroger.com/v1'

// Module-level token cache — lives for the lifetime of the server process
let _token = ''
let _tokenExpiry = 0

async function getToken(): Promise<string> {
  if (_token && Date.now() < _tokenExpiry) return _token

  const creds = Buffer.from(
    `${process.env.KROGER_CLIENT_ID}:${process.env.KROGER_CLIENT_SECRET}`
  ).toString('base64')

  const res = await fetch(`${BASE}/connect/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${creds}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials&scope=product.compact',
    cache: 'no-store',
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Kroger OAuth ${res.status}: ${text}`)
  }

  const data = (await res.json()) as { access_token: string; expires_in: number }
  _token = data.access_token
  _tokenExpiry = Date.now() + (data.expires_in - 60) * 1000
  return _token
}

interface RawProduct {
  productId: string
  description: string
  items?: Array<{
    size?: string
    price?: { regular?: number; promo?: number }
  }>
  images?: Array<{
    perspective: string
    default?: boolean
    sizes?: Array<{ id: string; url: string }>
  }>
}

interface RawLocation {
  locationId: string
  name: string
  address: { addressLine1: string; city: string; state: string; zipCode: string }
  geolocation: { latitude: number; longitude: number }
  distance: number
  phone?: string
  hours?: { open24?: boolean; [day: string]: unknown }
}

export async function searchKrogerProduct(term: string): Promise<Omit<KrogerDeal, 'item'> | null> {
  const token = await getToken()
  const url = `${BASE}/products?filter.term=${encodeURIComponent(term)}&filter.limit=1&filter.fulfillment=ais`

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })

  if (!res.ok) return null

  const data = (await res.json()) as { data?: RawProduct[] }
  const product = data.data?.[0]
  if (!product) return null

  const item = product.items?.[0]
  const regularPrice = item?.price?.regular ?? 0
  const rawPromo = item?.price?.promo ?? null
  const promoPrice = rawPromo !== null && rawPromo < regularPrice ? rawPromo : null

  const frontImage = product.images?.find((i) => i.perspective === 'front' && i.default)
  const imageUrl = frontImage?.sizes?.find((s) => s.id === 'medium')?.url ?? null

  return {
    productId: product.productId,
    productName: product.description,
    size: item?.size ?? '',
    regularPrice,
    promoPrice,
    savings:
      promoPrice !== null
        ? Math.round((regularPrice - promoPrice) * 100) / 100
        : null,
    imageUrl,
    hasPromo: promoPrice !== null,
  }
}

export async function findNearbyKrogerStores(lat: number, lng: number): Promise<KrogerStore[]> {
  const token = await getToken()
  const url = `${BASE}/locations?filter.latLng=${lat},${lng}&filter.radiusInMiles=10&filter.limit=10`

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })

  if (!res.ok) return []

  const data = (await res.json()) as { data?: RawLocation[] }

  return (data.data ?? []).map((loc) => {
    const dayName = new Date()
      .toLocaleDateString('en-US', { weekday: 'long' })
      .toLowerCase()
    const todayHours = loc.hours?.[dayName] as
      | { open?: string; close?: string }
      | undefined

    let hoursToday = 'Hours unavailable'
    if (loc.hours?.open24) {
      hoursToday = 'Open 24 hours'
    } else if (todayHours?.open && todayHours?.close) {
      hoursToday = `${todayHours.open} – ${todayHours.close}`
    }

    return {
      locationId: loc.locationId,
      name: loc.name,
      address: loc.address.addressLine1,
      city: loc.address.city,
      state: loc.address.state,
      zip: loc.address.zipCode,
      lat: loc.geolocation.latitude,
      lng: loc.geolocation.longitude,
      distance: Math.round(loc.distance * 10) / 10,
      phone: loc.phone ?? '',
      hoursToday,
    }
  })
}
