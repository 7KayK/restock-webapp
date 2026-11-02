'use client'

import { useState } from 'react'
import { Route, Loader2, AlertCircle, Clock, Fuel, Navigation, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toCartRequestItems } from '@/lib/cartRequest'
import type { BestStoreResult, ShoppingItem, TripResult, TripStoreOption } from '@/types'

type PlanState = 'idle' | 'locating' | 'loading' | 'error' | 'done'

// "Make the trip" — an on-demand re-ranking of the same stores CartBuilder
// already prices, factoring in drive time (traffic-aware) and an estimated
// round-trip gas cost from wherever the shopper is right now. Location is
// captured fresh via the browser at click time rather than a saved
// address — there's no saved address book yet (see the roadmap note in
// src/app/api/shopping/list/route.ts's history). On-demand and separate
// from CartBuilder's automatic refresh because routing calls are billed —
// they should only run when someone actually clicks this button.
export function TripPlanner({ items }: { items: ShoppingItem[] }) {
  const [state, setState] = useState<PlanState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [stores, setStores] = useState<TripStoreOption[]>([])
  const [routingNote, setRoutingNote] = useState<TripResult['routingNote']>(null)
  const [best, setBest] = useState<BestStoreResult | null>(null)

  function planTrip() {
    const requestItems = toCartRequestItems(items)
    if (requestItems.length === 0) {
      setState('error')
      setError('Add at least one item to your list first, then tap Make the trip.')
      return
    }

    if (!('geolocation' in navigator)) {
      setState('error')
      setError("Your browser can't share your location — try a different browser or device.")
      return
    }

    setState('locating')
    setError(null)

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setState('loading')
        const origin = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        const post = (url: string) =>
          fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items: requestItems, origin }),
          }).then(async (r) => {
            if (r.status === 401 || r.status === 404) {
              throw new Error('Your session expired — sign in again and retry.')
            }
            return (await r.json().catch(() => null)) as { data?: unknown; error?: string } | null
          })

        // Best-store ranking (typical prices + drive + fuel + time) is the main
        // answer; stores with shopper-reported prices are shown below it when any exist.
        Promise.all([post('/api/deals/best-store'), post('/api/deals/trip').catch(() => null)])
          .then(([bestJson, tripJson]) => {
            const bestData = bestJson?.data as BestStoreResult | undefined
            if (!bestData) throw new Error(bestJson?.error ?? 'Failed to rank stores')
            const tripData = tripJson?.data as TripResult | undefined
            setBest(bestData)
            setStores(tripData?.stores ?? [])
            setRoutingNote(tripData?.routingNote ?? null)
            setState('done')
          })
          .catch((err: unknown) => {
            setError(err instanceof Error ? err.message : 'Failed to plan the trip')
            setState('error')
          })
      },
      (geoErr) => {
        setState('error')
        // Each failure needs different advice — lumping them under
        // "permission denied" sent phone users to the wrong fix.
        if (geoErr.code === geoErr.PERMISSION_DENIED) {
          setError(
            'Location is blocked for Restock. On Android: tap the lock/tune icon in Chrome (or long-press the app icon → App info → Permissions → Location) and choose Allow, then try again.'
          )
        } else if (geoErr.code === geoErr.POSITION_UNAVAILABLE) {
          setError("Couldn't get a location fix. Turn on your phone's Location (GPS) in quick settings and try again.")
        } else {
          setError('Finding your location took too long. Move to an open area or check that Location is on, then try again.')
        }
      },
      { timeout: 20_000, maximumAge: 60_000, enableHighAccuracy: false }
    )
  }

  const busy = state === 'locating' || state === 'loading'

  return (
    <div className="rounded-xl border border-dashed border-[rgba(19,43,34,0.18)] bg-white/60 px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-[#132B22]/70">Make the trip</p>
          <p className="text-xs text-[#132B22]/40 mt-0.5">
            Finds the best store for your list: typical prices, traffic-aware drive time, fuel and your time
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 shrink-0 border-[rgba(19,43,34,0.18)] text-[#132B22]/70"
          onClick={planTrip}
          disabled={busy}
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Route className="h-3.5 w-3.5" />}
          {state === 'locating' ? 'Locating…' : state === 'loading' ? 'Planning…' : 'Make the trip'}
        </Button>
      </div>

      {state === 'error' && error && (
        <div className="mt-3 flex items-start gap-2 text-xs text-[#EF4444]/80">
          <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {state === 'done' && best && <BestStores result={best} />}

      {state === 'done' && stores.length > 0 && (
        <p className="mt-4 text-xs font-medium text-[#132B22]/55">Stores where shoppers reported prices</p>
      )}

      {state === 'done' && (
        <div className="mt-2 space-y-2">
          {routingNote === 'no-coordinates' && stores.length > 0 && (
            <p className="text-xs text-[#132B22]/50 rounded-lg bg-[#C9A15A]/15 px-3 py-2">
              Showing prices only: none of these stores has a map location yet. Report prices by picking the store from the search box so Restock can calculate drive time and gas.
            </p>
          )}
          {routingNote === 'routing-failed' && stores.length > 0 && (
            <p className="text-xs text-[#132B22]/50 rounded-lg bg-[#C9A15A]/15 px-3 py-2">
              Showing prices only: drive time couldn&apos;t be calculated right now. Please try again shortly.
            </p>
          )}
          {stores.map((s) => (
            <div
              key={`${s.storePlaceId ?? s.storeName}-${s.currency}`}
              className="rounded-lg border border-[rgba(19,43,34,0.10)] bg-white px-3 py-2.5"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-[#132B22]">{s.storeName}</p>
                <p className="text-sm font-semibold text-[#132B22]">
                  {s.currency} {(s.tripTotal ?? s.total).toFixed(2)}
                </p>
              </div>
              <p className="text-xs text-[#132B22]/45 mt-0.5">
                Covers {s.coveredCount} of {s.totalItems} items
                {s.tripTotal !== null &&
                  ` — ${s.currency} ${s.total.toFixed(2)} basket + ${s.currency} ${(s.gasCost ?? 0).toFixed(2)} gas`}
              </p>
              {s.driveMinutes !== null || s.distanceKm !== null ? (
                <div className="flex items-center gap-3 mt-1.5 text-xs text-[#132B22]/50">
                  {s.driveMinutes !== null && (
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {s.driveMinutes} min drive
                    </span>
                  )}
                  {s.distanceKm !== null && (
                    <span className="inline-flex items-center gap-1">
                      <Fuel className="h-3 w-3" />
                      {s.distanceKm} km away
                    </span>
                  )}
                </div>
              ) : (
                <p className="text-xs text-[#132B22]/35 mt-1.5">Distance unavailable for this store</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const REASON_TEXT: Record<NonNullable<BestStoreResult['reason']>, string> = {
  'no-location': 'We need your location to find stores near you.',
  'unsupported-region': "We couldn't work out which country you're in from your location. Try again with location allowed, or set your city in Settings.",
  'no-prices': 'We could not find typical prices for these items yet. Try simpler item names, like “pork” instead of “pork ribs”.',
  'no-stores': 'No grocery stores were found within 10 km of you.',
}

function BestStores({ result }: { result: BestStoreResult }) {
  if (result.reason) {
    return <p className="mt-3 text-xs text-[#132B22]/50">{REASON_TEXT[result.reason]}</p>
  }
  const top = result.stores.slice(0, 5)
  const cur = result.currency ?? ''
  return (
    <div className="mt-3 space-y-2">
      <p className="text-xs text-[#132B22]/45">
        Near you{result.areaLabel ? ` in ${result.areaLabel}` : ''}. Estimates, not shelf prices: the basket uses typical local prices adjusted for store type.
      </p>
      {result.routingNote === 'routing-failed' && (
        <p className="text-xs text-[#132B22]/50 rounded-lg bg-[#C9A15A]/15 px-3 py-2">
          Live traffic times are unavailable right now, so drive times below are rough estimates from distance.
        </p>
      )}
      {top.map((s) => (
        <div
          key={s.placeId}
          className={`rounded-lg border bg-white px-3 py-2.5 ${s.best ? 'border-[#C9A15A] shadow-[0_2px_10px_rgba(201,161,90,0.25)]' : 'border-[rgba(19,43,34,0.10)]'}`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#132B22]">
                {s.best && <span className="mr-1.5 rounded bg-[#C9A15A]/25 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-[#132B22]/70">Best choice</span>}
                {s.storeName}
              </p>
              <p className="text-xs text-[#132B22]/40 mt-0.5">
                {s.tierLabel}
                {s.openNow !== undefined && ` · ${s.openNow ? 'Open now' : 'Closed now'}`}
                {s.rating !== undefined && (
                  <span className="inline-flex items-center gap-0.5 ml-1.5"><Star className="h-3 w-3" />{s.rating}</span>
                )}
              </p>
            </div>
            <p className="text-sm font-semibold text-[#132B22] shrink-0">
              {cur} {s.allIn.toFixed(2)}
            </p>
          </div>
          <p className="text-xs text-[#132B22]/50 mt-1">
            Basket {cur} {(s.basket + s.missingValue).toFixed(2)} + fuel {cur} {s.fuelCost.toFixed(2)} + your time {cur} {s.timeCost.toFixed(2)}
          </p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-[#132B22]/50">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {s.driveMinutes !== null ? `${s.driveMinutes} min drive` : 'about ' + Math.max(1, Math.round((s.distanceKm / 35) * 60)) + ' min drive (estimate)'}
            </span>
            <span className="inline-flex items-center gap-1">
              <Fuel className="h-3 w-3" />
              {s.distanceKm} km
            </span>
            <a
              href={s.directionsUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-medium text-[#132B22]/70 underline underline-offset-2"
            >
              <Navigation className="h-3 w-3" />
              Directions
            </a>
          </div>
          {s.likelyMissing.length > 0 && (
            <p className="text-xs text-[#B45309]/80 mt-1.5">
              May not stock: {s.likelyMissing.join(', ')} (counted as bought elsewhere)
            </p>
          )}
        </div>
      ))}
      <p className="text-[11px] text-[#132B22]/35">
        Store-type price adjustments, fuel (8.5 L/100 km) and the value of your time are rounded assumptions. Restock can&apos;t see live shelf stock or how busy a store is.
      </p>
    </div>
  )
}
