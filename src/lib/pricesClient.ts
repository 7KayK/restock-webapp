// Copied verbatim from Restock_Shared_Price_Service/restock-prices-client.ts
// (Codex's standalone price-collection service — see its README.md and
// CLAUDE_INTEGRATION.md). Kept byte-identical to the source on purpose: this
// is the one contract restock-webapp, restock-mobile, and the price service
// itself all agree on, so reformatting it here risks drifting from what the
// other two actually implement. If the service's API shape changes, copy
// the updated file over this one rather than hand-editing it.
//
// Only this app's own /api/prices route (src/app/api/prices/route.ts) calls
// this client. restock-mobile has no backend of its own and never imports
// this file directly — it just calls /api/prices like every other route.

/** Shared client for Next.js, React Native/Expo, or any fetch-capable JS runtime.
 * Only public catalogue queries belong here. Never send purchase/receipt/user data.
 */
export type PriceStatus = 'fresh' | 'stale' | 'needs_review' | 'not_started' |
  'source_unavailable' | 'availability_unconfirmed' | 'unavailable';
export interface PublicPrice {
  id: string; product_key: string; source_id: string; retailer: string;
  name: string; variant_id?: string | null; variant_label?: string | null;
  gtin?: string | null; province: 'SK' | 'MB'; community: string;
  scope: 'retailer_online' | 'store' | 'region'; channel: 'online' | 'in_store';
  store_id?: string | null; region_id?: string | null;
  price_cents: number; currency: 'CAD'; price_kind: string;
  package: {quantity: number; unit: 'g' | 'ml'; basis: string} | null;
  unit_price_cents_per_100: number | null; conditions: Record<string, unknown>;
  availability: string; status: PriceStatus; observed_at: string; expires_at: string;
  source_url: string; geography_note: string; tax_and_fees: string; price_is_estimate: false;
}
export interface PriceResponse {
  generated_at: string; total: number; offset: number; limit: number;
  prices: PublicPrice[]; notice: string;
}
export interface PriceQuery {
  q?: string; province?: 'SK' | 'MB'; source_id?: string; product_key?: string;
  gtin?: string; scope?: PublicPrice['scope']; channel?: PublicPrice['channel'];
  store_id?: string; limit?: number; offset?: number; include_noncurrent?: boolean;
}
export function createPriceClient(baseUrl: string, fetcher: typeof fetch = fetch) {
  const root = baseUrl.replace(/\/$/, '');
  return {
    async prices(query: PriceQuery = {}, signal?: AbortSignal): Promise<PriceResponse> {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(query)) if (value !== undefined) params.set(key, String(value));
      const response = await fetcher(`${root}/v1/prices?${params}`, {signal, headers: {Accept: 'application/json'}});
      if (!response.ok) throw new Error(`Price service returned ${response.status}`);
      return response.json() as Promise<PriceResponse>;
    },
    async sources(signal?: AbortSignal): Promise<unknown> {
      const response = await fetcher(`${root}/v1/sources`, {signal});
      if (!response.ok) throw new Error(`Price service returned ${response.status}`);
      return response.json();
    },
  };
}
export function isCurrentPrice(price: PublicPrice, now = Date.now()): boolean {
  return price.status === 'fresh' && Date.parse(price.observed_at) <= now && now < Date.parse(price.expires_at);
}
export function priceLabel(price: PublicPrice): string {
  const amount = new Intl.NumberFormat('en-CA', {style:'currency', currency:'CAD'}).format(price.price_cents / 100);
  return `${amount} CAD · ${price.channel === 'online' ? 'Online' : 'Advertised in-store'} · ${price.retailer}`;
}
