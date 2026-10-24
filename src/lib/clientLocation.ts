// Client-only helper: the shopper's current coordinates from the browser, used
// when no location has been saved in Settings. Resolves to null instead of
// throwing, and remembers a successful fix for the page's lifetime so lists
// that re-price don't re-prompt.
let cached: { lat: number; lng: number; at: number } | null = null

export function getBrowserOrigin(timeoutMs = 10_000): Promise<{ lat: number; lng: number } | null> {
  if (typeof navigator === 'undefined' || !('geolocation' in navigator)) return Promise.resolve(null)
  if (cached && Date.now() - cached.at < 5 * 60_000) return Promise.resolve({ lat: cached.lat, lng: cached.lng })
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        cached = { lat: pos.coords.latitude, lng: pos.coords.longitude, at: Date.now() }
        resolve({ lat: cached.lat, lng: cached.lng })
      },
      () => resolve(null),
      { timeout: timeoutMs, maximumAge: 60_000, enableHighAccuracy: false }
    )
  })
}
