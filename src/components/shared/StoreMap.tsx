'use client'

import { useState, useEffect, useCallback } from 'react'
import { GoogleMap, Marker, InfoWindow, useLoadScript } from '@react-google-maps/api'
import { MapPin, Clock, Star, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { GroceryStore } from '@/types'

const MAP_CONTAINER_STYLE = { width: '100%', height: '100%' }
const DEFAULT_ZOOM = 13

type Status = 'idle' | 'locating' | 'loading' | 'ready' | 'denied' | 'error'

export function StoreMap() {
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState<string>('Failed to load nearby stores. Please try again later.')
  const [center, setCenter] = useState<{ lat: number; lng: number } | null>(null)
  const [stores, setStores] = useState<GroceryStore[]>([])
  const [selected, setSelected] = useState<GroceryStore | null>(null)
  const [activeIdx, setActiveIdx] = useState<number | null>(null)

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '',
  })

  const fetchStores = useCallback(async (lat: number, lng: number) => {
    setStatus('loading')
    try {
      const res = await fetch(`/api/stores?lat=${lat}&lng=${lng}`)
      if (!res.ok) {
        const json = (await res.json().catch(() => ({}))) as { error?: string }
        setErrorMsg(json.error ?? 'Failed to load nearby stores. Please try again later.')
        setStatus('error')
        return
      }
      const json = (await res.json()) as { data?: GroceryStore[] }
      setStores(json.data ?? [])
      setStatus('ready')
    } catch {
      setErrorMsg('Failed to load nearby stores. Please try again later.')
      setStatus('error')
    }
  }, [])

  const requestLocation = useCallback(() => {
    setStatus('locating')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        setCenter({ lat, lng })
        fetchStores(lat, lng)
      },
      () => {
        setStatus('denied')
      },
      { timeout: 10000 }
    )
  }, [fetchStores])

  useEffect(() => {
    if (isLoaded) requestLocation()
  }, [isLoaded, requestLocation])

  function selectStore(store: GroceryStore, idx: number) {
    setSelected(store)
    setActiveIdx(idx)
    setCenter({ lat: store.lat, lng: store.lng })
  }

  if (loadError) {
    return <MapError message="Failed to load Google Maps. Check your API key." />
  }

  if (!isLoaded || status === 'idle' || status === 'locating') {
    return (
      <div className="flex-1 flex items-center justify-center text-[#132B22]/45">
        <div className="text-center space-y-2">
          <Loader2 className="h-6 w-6 animate-spin mx-auto text-[#132B22]" />
          <p className="text-sm">{status === 'locating' ? 'Getting your location…' : 'Loading map…'}</p>
        </div>
      </div>
    )
  }

  if (status === 'denied') {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center space-y-3 max-w-xs">
          <AlertCircle className="h-8 w-8 mx-auto text-[#EF4444]/60" />
          <p className="text-sm font-medium text-[#132B22]">Location access denied</p>
          <p className="text-xs text-[#132B22]/45">
            Enable location in your browser settings and try again.
          </p>
          <Button
            size="sm"
            variant="outline"
            className="text-[#132B22] border-[#132B22]/30 hover:bg-[#132B22]/5"
            onClick={requestLocation}
          >
            Try again
          </Button>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return <MapError message={errorMsg} />
  }

  return (
    <div className="flex flex-1 min-h-0 gap-4">
      {/* Store list sidebar */}
      <div className="w-72 shrink-0 overflow-y-auto space-y-2 pr-1">
        {status === 'loading' && (
          <div className="flex items-center gap-2 text-xs text-[#132B22]/45 py-2">
            <Loader2 className="h-3 w-3 animate-spin" />
            Finding nearby stores…
          </div>
        )}
        {status === 'ready' && stores.length === 0 && (
          <p className="text-sm text-[#132B22]/45 py-4 text-center">
            No grocery stores found within 10 km
          </p>
        )}
        {stores.map((store, idx) => (
          <button
            key={store.placeId}
            onClick={() => selectStore(store, idx)}
            className={cn(
              'w-full text-left rounded-xl border p-3 transition-colors',
              activeIdx === idx
                ? 'border-[#132B22] bg-[#132B22]/5'
                : 'border-[rgba(19,43,34,0.10)] bg-white hover:border-[#132B22]/30 hover:bg-[#132B22]/5'
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-semibold text-[#132B22] leading-tight">{store.name}</p>
              <span className="shrink-0 text-xs text-[#132B22] font-medium whitespace-nowrap">
                {store.distanceKm} km
              </span>
            </div>
            <p className="text-xs text-[#132B22]/50 mt-0.5 line-clamp-1">{store.address}</p>
            <div className="flex items-center gap-3 mt-1.5">
              <div className="flex items-center gap-1 text-xs text-[#132B22]/40">
                <Clock className="h-3 w-3 shrink-0" />
                <span>{store.hoursToday}</span>
              </div>
              {store.rating !== undefined && (
                <div className="flex items-center gap-0.5 text-xs text-[#132B22]/40">
                  <Star className="h-3 w-3 shrink-0 fill-[#EAB308] text-[#EAB308]" />
                  <span>{store.rating.toFixed(1)}</span>
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Map */}
      <div className="flex-1 rounded-xl overflow-hidden border border-[rgba(19,43,34,0.10)] min-h-[400px]">
        {center && (
          <GoogleMap
            mapContainerStyle={MAP_CONTAINER_STYLE}
            center={center}
            zoom={DEFAULT_ZOOM}
            options={{
              disableDefaultUI: false,
              zoomControl: true,
              streetViewControl: false,
              mapTypeControl: false,
              fullscreenControl: false,
              styles: [
                { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
              ],
            }}
          >
            {/* User location marker */}
            <Marker
              position={center}
              icon={{
                path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
                fillColor: '#132B22',
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWeight: 2,
                scale: 1.5,
                anchor: { x: 12, y: 22 } as google.maps.Point,
              }}
              title="Your location"
            />

            {/* Store markers */}
            {stores.map((store, idx) => (
              <Marker
                key={store.placeId}
                position={{ lat: store.lat, lng: store.lng }}
                onClick={() => selectStore(store, idx)}
                icon={{
                  path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
                  fillColor: activeIdx === idx ? '#132B22' : '#22C55E',
                  fillOpacity: 1,
                  strokeColor: '#ffffff',
                  strokeWeight: 2,
                  scale: 1.5,
                  anchor: new google.maps.Point(12, 22),
                }}
              />
            ))}

            {/* Info window for selected store */}
            {selected && (
              <InfoWindow
                position={{ lat: selected.lat, lng: selected.lng }}
                onCloseClick={() => { setSelected(null); setActiveIdx(null) }}
              >
                <div className="p-1 min-w-[180px]">
                  <p className="font-semibold text-sm text-[#132B22]">{selected.name}</p>
                  <p className="text-xs text-[#5b6a5d] mt-0.5">{selected.address}</p>
                  <div className="flex items-center gap-1 mt-1 text-xs text-[#5b6a5d]">
                    <Clock className="h-3 w-3" />
                    <span>{selected.hoursToday}</span>
                  </div>
                  {selected.rating !== undefined && (
                    <div className="flex items-center gap-1 mt-0.5 text-xs text-[#5b6a5d]">
                      <Star className="h-3 w-3 fill-[#EAB308] text-[#EAB308]" />
                      <span>{selected.rating.toFixed(1)} rating</span>
                    </div>
                  )}
                  <p className="text-xs font-medium text-[#132B22] mt-1">
                    {selected.distanceKm} km away
                  </p>
                </div>
              </InfoWindow>
            )}
          </GoogleMap>
        )}
      </div>
    </div>
  )
}

function MapError({ message }: { message: string }) {
  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="text-center space-y-2 max-w-xs">
        <MapPin className="h-8 w-8 mx-auto text-[#132B22]/20" />
        <p className="text-sm text-[#132B22]/60">{message}</p>
      </div>
    </div>
  )
}
