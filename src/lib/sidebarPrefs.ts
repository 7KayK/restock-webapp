// Client-only navigation preferences — e.g. whether Spend Analysis shows
// up in the nav at all. Same pattern as the existing auto-calendar toggle
// in Settings (restock_auto_calendar): localStorage only, no Prisma field,
// no backend round-trip. This is "how I like my own nav to look," not
// data that needs to sync across devices — the same tradeoff Settings
// already accepts for auto-calendar.
const SPEND_ANALYSIS_VISIBLE_KEY = 'restock_spend_analysis_visible'
const EVENT_NAME = 'restock:nav-prefs-changed'

// Defaults to visible — opt-OUT, not opt-in. Spend tracking is close to
// core to what Restock is for, so a new user should see it unless they
// deliberately hide it, rather than needing to discover a setting to turn
// it on in the first place.
export function isSpendAnalysisVisible(): boolean {
  if (typeof window === 'undefined') return true
  const stored = window.localStorage.getItem(SPEND_ANALYSIS_VISIBLE_KEY)
  return stored === null ? true : stored === 'true'
}

export function setSpendAnalysisVisible(visible: boolean): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(SPEND_ANALYSIS_VISIBLE_KEY, String(visible))
  // A same-tab localStorage write never fires the native 'storage' event —
  // that only fires in OTHER tabs — so Sidebar/BottomNav listen for this
  // custom event instead, to update immediately without a page reload.
  window.dispatchEvent(new Event(EVENT_NAME))
}

// Subscribes to both the same-tab custom event and the cross-tab native
// 'storage' event. Returns an unsubscribe function for a useEffect cleanup.
export function onNavPrefsChanged(handler: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  window.addEventListener(EVENT_NAME, handler)
  window.addEventListener('storage', handler)
  return () => {
    window.removeEventListener(EVENT_NAME, handler)
    window.removeEventListener('storage', handler)
  }
}
