'use client'

import * as React from 'react'
import { usePathname } from 'next/navigation'
import { AssessmentModal } from '@/components/shared/AssessmentModal'
import { trackAssessmentEvent } from '@/lib/assessment/analytics'

// ---------------------------------------------------------------------------
// Feature flag + trigger config
// ---------------------------------------------------------------------------

// Master kill switch. Defaults OFF everywhere (including production) until
// this has been sanity-checked on staging — flip NEXT_PUBLIC_ASSESSMENT_ENABLED
// to "true" in the relevant Vercel environment when ready to ship it.
const ASSESSMENT_ENABLED = process.env.NEXT_PUBLIC_ASSESSMENT_ENABLED === 'true'

// TODO(mid-September / post-launch): once restock.chat has real, live product
// functionality for end users, this should stop auto-popping up promptly on
// every page load — at that point there's a live browsing experience worth
// protecting from an early interruption. Switch this to 'exit-intent' (or
// 'off', to rely solely on the nav link) via NEXT_PUBLIC_ASSESSMENT_TRIGGER
// in one edit; only 'delay' is implemented today.
type TriggerMode = 'delay' | 'exit-intent' | 'off'
const TRIGGER_MODE = (process.env.NEXT_PUBLIC_ASSESSMENT_TRIGGER as TriggerMode | undefined) ?? 'delay'
const AUTO_POPUP_DELAY_MS = 3000 // within Kay's requested 2-4s window

// Routes where the modal should never appear: authenticated/app routes, and
// auth flow pages where a popup would just be in the way.
const SUPPRESSED_PATH_PREFIXES = ['/dashboard', '/sign-in', '/sign-up', '/sso-callback']

// Query params that mark a visitor as a tester/invite-link arrival. There's
// no real user cohort yet (just Kay + one PM friend), but this keeps the
// suppression correct from day one of early access. Adjust these names to
// match whatever Kay's actual invite links use.
const TESTER_QUERY_PARAMS = ['tester', 'invite', 'ref']

const SEEN_THIS_SESSION_KEY = 'restock_assessment_auto_seen_v1'

function isSuppressedPath(pathname: string): boolean {
  return SUPPRESSED_PATH_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
}

function isTesterArrival(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const params = new URLSearchParams(window.location.search)
    return TESTER_QUERY_PARAMS.some((p) => params.has(p))
  } catch {
    return false
  }
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface AssessmentContextValue {
  enabled: boolean
  isOpen: boolean
  open: () => void
  close: () => void
}

const AssessmentContext = React.createContext<AssessmentContextValue | null>(null)

export function useAssessment(): AssessmentContextValue {
  const ctx = React.useContext(AssessmentContext)
  if (!ctx) {
    throw new Error('useAssessment must be used within an AssessmentProvider')
  }
  return ctx
}

export function AssessmentProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = React.useState(false)
  const suppressed = isSuppressedPath(pathname)

  const markSeen = React.useCallback(() => {
    try {
      sessionStorage.setItem(SEEN_THIS_SESSION_KEY, '1')
    } catch {
      // sessionStorage unavailable (private mode, etc.) — degrade to "always eligible."
    }
  }, [])

  const open = React.useCallback(() => {
    setIsOpen(true)
    markSeen()
    trackAssessmentEvent('assessment_modal_shown', { trigger: 'manual' })
  }, [markSeen])

  const close = React.useCallback(() => setIsOpen(false), [])

  // Auto-popup trigger: once per browser session, after a short delay, only
  // on eligible (non-suppressed, non-tester) marketing pages.
  React.useEffect(() => {
    if (!ASSESSMENT_ENABLED || suppressed || TRIGGER_MODE !== 'delay') return
    if (isTesterArrival()) return

    let alreadySeen = false
    try {
      alreadySeen = sessionStorage.getItem(SEEN_THIS_SESSION_KEY) === '1'
    } catch {
      alreadySeen = false
    }
    if (alreadySeen) return

    const timer = setTimeout(() => {
      setIsOpen(true)
      markSeen()
      trackAssessmentEvent('assessment_modal_shown', { trigger: 'auto' })
    }, AUTO_POPUP_DELAY_MS)

    return () => clearTimeout(timer)
    // Re-evaluate on route change so navigating onto an eligible page from a
    // suppressed one (e.g. signing out of /dashboard) can still trigger it,
    // exactly once per session either way.
  }, [pathname, suppressed, markSeen])

  const value = React.useMemo<AssessmentContextValue>(
    () => ({ enabled: ASSESSMENT_ENABLED, isOpen, open, close }),
    [isOpen, open, close]
  )

  return (
    <AssessmentContext.Provider value={value}>
      {children}
      {ASSESSMENT_ENABLED && !suppressed && (
        <AssessmentModal
          open={isOpen}
          onOpenChange={(next) => {
            setIsOpen(next)
          }}
        />
      )}
    </AssessmentContext.Provider>
  )
}
