import type { FoodProduct } from '@/types'

// NOTE: despite the filename, this does not call the Kroger API — it wraps
// Open Food Facts, a free crowdsourced product-metadata database. It
// returns product name/brand/image/Nutri-Score only; there is no price
// field here at all. Real-time pricing (the Cart Builder on the Deals
// page, and per-item prices on the Shopping list) comes from crowdsourced
// PriceSighting reports instead (src/lib/priceSightings.ts) — a real
// Kroger integration would only cover the US, which doesn't help Canada
// (the primary market) or the other markets Restock is being tested in.

const OFF_SEARCH = 'https://world.openfoodfacts.org/cgi/search.pl'
const USER_AGENT = 'Restock/1.0 (restock.chat)'

interface OFFProduct {
  code?: string
  product_name?: string
  brands?: string
  nutriscore_grade?: string
  image_url?: string
}

interface OFFResponse {
  products?: OFFProduct[]
}

export async function searchFoodProduct(term: string): Promise<Omit<FoodProduct, 'item'> | null> {
  const params = new URLSearchParams({
    search_terms: term,
    search_simple: '1',
    action: 'process',
    json: '1',
    page_size: '5',
    lc: 'en',
    fields: 'code,product_name,brands,nutriscore_grade,image_url',
  })

  const res = await fetch(`${OFF_SEARCH}?${params}`, {
    headers: { 'User-Agent': USER_AGENT },
    cache: 'no-store',
  })

  if (!res.ok) {
    console.error('[openfoodfacts] search failed:', res.status, term)
    return null
  }

  const data = (await res.json()) as OFFResponse
  // Use the first product that has a non-empty name
  const product = data.products?.find((p) => p.product_name?.trim())
  if (!product?.product_name) return null

  return {
    productId: product.code ?? crypto.randomUUID(),
    productName: product.product_name.trim(),
    brand: product.brands?.split(',')[0].trim() ?? '',
    imageUrl: product.image_url ?? null,
    nutriscoreGrade: product.nutriscore_grade?.toLowerCase() ?? null,
  }
}
