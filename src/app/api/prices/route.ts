import { auth } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'
import { createPriceClient, type PriceQuery, type PriceResponse } from '@/lib/pricesClient'

// Proxies Kay's standalone price-collection service (Restock_Shared_Price_Service
// on her machine — see its README.md and CLAUDE_INTEGRATION.md). This is the
// ONLY place either Restock app talks to that service: restock-mobile has no
// backend of its own (see Restock-Mobile/src/lib/api.ts) and calls this route
// exactly like every other /api/* route here, so mobile never needs a second
// base URL or a different auth pattern for public retailer prices.
//
// Deliberately a thin, unmutated passthrough. Per the price service's own
// integration notes: its provenance (source, scope, channel, observed_at,
// expires_at) must never be rewritten, and these public-retailer observations
// must stay separate from crowdsourced/receipt PriceSighting rows rather than
// being merged into that lossy 21-day-freshness schema — see priceSightings.ts.
// Callers that want "the best price from anywhere" combine both API results
// client-side, each clearly labelled by source, not this route.
//
// The service isn't deployed anywhere yet — for now this only works against
// a locally-running `python price_service.py serve` (see its README for why
// that's the right call while this is still an experiment: no hosting cost
// until there's a reason to pay for one). If it's unreachable, this returns
// an empty-but-well-formed PriceResponse rather than an error or a guessed
// price, so the UI's job is always just "show notice/empty state", never
// "handle two different failure shapes."
const DEFAULT_BASE_URL = 'http://127.0.0.1:8080' // local `python price_service.py serve` only — never reachable once this route runs on Vercel
const FETCH_TIMEOUT_MS = 5000

const VALID_PROVINCES = new Set(['SK', 'MB'])
const VALID_SCOPES = new Set(['retailer_online', 'store', 'region'])
const VALID_CHANNELS = new Set(['online', 'in_store'])

export async function GET(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const baseUrl = process.env.PRICE_SERVICE_BASE_URL?.trim() || DEFAULT_BASE_URL
  const { searchParams } = request.nextUrl

  const query: PriceQuery = {}
  const q = searchParams.get('q')
  if (q) query.q = q
  const province = searchParams.get('province')
  if (province && VALID_PROVINCES.has(province)) query.province = province as PriceQuery['province']
  const sourceId = searchParams.get('source_id')
  if (sourceId) query.source_id = sourceId
  const productKey = searchParams.get('product_key')
  if (productKey) query.product_key = productKey
  const gtin = searchParams.get('gtin')
  if (gtin) query.gtin = gtin
  const scope = searchParams.get('scope')
  if (scope && VALID_SCOPES.has(scope)) query.scope = scope as PriceQuery['scope']
  const channel = searchParams.get('channel')
  if (channel && VALID_CHANNELS.has(channel)) query.channel = channel as PriceQuery['channel']
  const storeId = searchParams.get('store_id')
  if (storeId) query.store_id = storeId
  const limitParam = searchParams.get('limit')
  if (limitParam) {
    const n = parseInt(limitParam, 10)
    if (Number.isFinite(n)) query.limit = Math.min(200, Math.max(1, n))
  }
  const offsetParam = searchParams.get('offset')
  if (offsetParam) {
    const n = parseInt(offsetParam, 10)
    if (Number.isFinite(n) && n >= 0) query.offset = n
  }
  if (searchParams.get('include_noncurrent') === 'true') query.include_noncurrent = true

  const empty = (notice: string): PriceResponse => ({
    generated_at: new Date().toISOString(),
    total: 0,
    offset: query.offset ?? 0,
    limit: query.limit ?? 50,
    prices: [],
    notice,
  })

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  try {
    const client = createPriceClient(baseUrl)
    const data = await client.prices(query, controller.signal)
    return Response.json({ data })
  } catch (err) {
    console.error('[prices GET] price service unreachable at', baseUrl, err)
    return Response.json({
      data: empty('Current price unavailable — the price service is not running.'),
    })
  } finally {
    clearTimeout(timeout)
  }
}
