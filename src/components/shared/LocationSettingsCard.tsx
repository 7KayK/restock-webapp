'use client'

import { useCallback, useRef, useState } from 'react'
import { useLoadScript, Autocomplete } from '@react-google-maps/api'
import { MapPin, Loader2, LocateFixed, X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { UserSettings } from '@/types'

const LIBRARIES: 'places'[] = ['places']

type LocationFields = Pick<UserSettings, 'locationLabel' | 'locationLat' | 'locationLng'>

export function LocationSettingsCard({
  settings,
  onUpdated,
}: {
  settings: LocationFields | null
  onUpdated: (data: LocationFields) => void
}) {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '',
    libraries: LIBRARIES,
  })

  const [locating, setLocating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchKey, setSearchKey] = useState(0)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)

  const saveLocation = useCallback(
    async (label: string, lat: number, lng: number) => {
      setSaving(true)
      setError(null)
      try {
        const res = await fetch('/api/settings', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ locationLabel: label, locationLat: lat, locationLng: lng }),
        })
        const json = (await res.json()) as { data?: LocationFields; error?: string }
        if (!res.ok) throw new Error(json.error ?? 'Failed to save location')
        onUpdated(json.data!)
        setSearchKey((k) => k + 1)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save location')
      } finally {
        setSaving(false)
      }
    },
    [onUpdated]
  )

  const useCurrentLocation = useCallback(() => {
    setError(null)
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        fetch(`/api/location/reverse-geocode?lat=${lat}&lng=${lng}`)
          .then((r) => r.json())
          .then((json: { data?: { label?: string } }) => {
            const label = json.data?.label ?? `${lat.toFixed(3)}, ${lng.toFixed(3)}`
            return saveLocation(label, lat, lng)
          })
          .finally(() => setLocating(false))
      },
      () => {
        setLocating(false)
        setError('Location access denied — try searching for your city instead.')
      },
      { timeout: 10000 }
    )
  }, [saveLocation])

  function handlePlaceChanged() {
    const place = autocompleteRef.current?.getPlace()
    if (!place?.geometry?.location) return
    const lat = place.geometry.location.lat()
    const lng = place.geometry.location.lng()
    const label = place.formatted_address ?? place.name ?? `${lat.toFixed(3)}, ${lng.toFixed(3)}`
    void saveLocation(label, lat, lng)
  }

  const clearLocation = useCallback(async () => {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locationLabel: null }),
      })
      const json = (await res.json()) as { data?: LocationFields; error?: string }
      if (!res.ok) throw new Error(json.error ?? 'Failed to clear location')
      onUpdated(json.data!)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear location')
    } finally {
      setSaving(false)
    }
  }, [onUpdated])

  const hasLocation = Boolean(settings?.locationLabel)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-[#132B22]" />
          <CardTitle className="text-base">Location</CardTitle>
        </div>
        <CardDescription>
          Used to find grocery stores and deals near you. We only keep a city-level label here — the exact
          coordinates are used just to sort distances.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Current location</span>
          <span className="font-medium text-[#132B22]">{settings?.locationLabel ?? 'Not set'}</span>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            size="sm"
            onClick={useCurrentLocation}
            disabled={locating || saving}
            className="text-[#132B22] border-[#132B22]/30 hover:bg-[#132B22]/5"
          >
            {locating ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <LocateFixed className="h-4 w-4 mr-2" />
            )}
            Use my current location
          </Button>
          {hasLocation && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearLocation}
              disabled={saving}
              className="text-[#EF4444] border-[#EF4444]/30 hover:bg-[#EF4444]/5 hover:text-[#EF4444]"
            >
              <X className="h-4 w-4 mr-2" />
              Clear
            </Button>
          )}
        </div>

        {isLoaded && (
          <div key={searchKey} className="space-y-1.5">
            <label className="text-sm font-medium text-[#132B22]/70">Or search for a city</label>
            <Autocomplete
              onLoad={(ac) => {
                autocompleteRef.current = ac
              }}
              onPlaceChanged={handlePlaceChanged}
              options={{ types: ['(cities)'] }}
            >
              <Input placeholder="e.g. Lagos, Nigeria" disabled={saving} />
            </Autocomplete>
          </div>
        )}

        {error && <p className="text-sm text-[#EF4444]">{error}</p>}
      </CardContent>
    </Card>
  )
}
